import { and, eq, inArray } from 'drizzle-orm';
import { db } from '~~/server/utils/db';
import { interventions, planExecutions } from '~~/server/database/schema';
import {
  chargerRuches,
  memeNumero,
  insererInterventionTx,
  type RucheRef,
} from '~~/server/utils/copilote-actions';
import { getRuchesSante } from '~~/server/utils/copilote-data';
import { normaliser } from '~~/server/utils/copilote-local';
import type { CibleRuches, CritereRuche } from '~~/server/utils/copilote-cibles';
import type { PlanMaya } from '~~/server/utils/copilote-plan';

/**
 * EXÉCUTEUR de plans de Maya — la couche qui RÉSOUT les cibles en ruches réelles
 * puis exécute un plan (fan-out en lot) de façon TRANSACTIONNELLE : tout réussit
 * ou rien n'est écrit (rollback). Le journal des ressources créées est persisté
 * (table plan_executions) pour un UNDO EN CASCADE durable. 100 % déterministe.
 */

/** Prédicats de critère de ciblage, évalués sur la santé calculée (déterministe). */
type SanteRow = Awaited<ReturnType<typeof getRuchesSante>>[number];
const PREDICAT_CRITERE: Record<CritereRuche, (r: SanteRow) => boolean> = {
  faible: (r) => r.scoreSante < 50,
  retard: (r) => r.joursDepuisVisite === null || r.joursDepuisVisite > 21,
  varroa: (r) => r.varroa != null && r.varroa > 3,
  malade: (r) => r.maladieObservee != null && r.maladieObservee.trim() !== '',
};

/**
 * Résout une cible (portée) en liste de ruches CONCRÈTES (avec id + rucher).
 * Charge toujours les ruches actives (pour les ids), puis filtre selon le mode.
 * Le critère réutilise le score santé déterministe (getRuchesSante).
 */
export async function resoudreCibles(userId: string, cible: CibleRuches): Promise<RucheRef[]> {
  const rows = await chargerRuches(userId);
  if (rows.length === 0) return [];

  switch (cible.mode) {
    case 'toutes':
      return rows;

    case 'rucher': {
      const mots = normaliser(cible.rucher)
        .split(' ')
        .filter((m) => m.length >= 3);
      if (!mots.length) return [];
      return rows.filter((r) => {
        const nom = normaliser(r.rucherNom);
        return mots.some((m) => nom.includes(m));
      });
    }

    case 'liste':
      return rows.filter((r) => cible.numeros.some((n) => memeNumero(r.numero, n)));

    case 'plage':
      return rows.filter((r) => {
        const n = Number(r.numero.replace(/\D/g, ''));
        return Number.isFinite(n) && n >= cible.de && n <= cible.a;
      });

    case 'critere': {
      const sante = await getRuchesSante(userId);
      const predicat = PREDICAT_CRITERE[cible.critere];
      const qualifiantes = sante.filter(predicat);
      return rows.filter((r) =>
        qualifiantes.some(
          (s) => memeNumero(s.numero, r.numero) && normaliser(s.rucher) === normaliser(r.rucherNom),
        ),
      );
    }
  }
}

/** Résultat de l'exécution d'un plan (renvoyé à la route SSE). */
export interface ResultatPlan {
  ok: boolean;
  texte: string;
  /** Id du journal `plan_executions` — sert au bouton « Tout annuler ». */
  planExecId?: string;
  nbReussies: number;
  nbTotal: number;
}

/**
 * Exécute un plan en LOT dans UNE transaction : chaque étape réutilise la
 * primitive atomique (insererInterventionTx) avec la transaction partagée. Si une
 * étape échoue, TOUT est annulé (rien d'écrit). En cas de succès, le journal des
 * ressources créées est persisté pour permettre l'annulation en cascade.
 */
export async function executerPlan(userId: string, plan: PlanMaya): Promise<ResultatPlan> {
  const nbTotal = plan.etapes.length;
  if (nbTotal === 0) {
    return { ok: false, texte: 'Aucune ruche ne correspond — rien à enregistrer.', nbReussies: 0, nbTotal: 0 };
  }

  try {
    const { planExecId, nb } = await db.transaction(async (tx) => {
      const ressources: { actionId: string; id: string }[] = [];
      for (const etape of plan.etapes) {
        // v1 : le lot ne fan-out que des interventions (réversibles, non financières).
        if (etape.actionId !== 'intervention') {
          throw new Error(`Action non supportée en lot : ${etape.actionId}`);
        }
        const res = await insererInterventionTx(tx, userId, etape.params);
        if (!res.ok || !res.cree) throw new Error(res.texte || 'Étape en échec');
        ressources.push({ actionId: res.cree.actionId, id: res.cree.id });
      }
      const [pe] = await tx
        .insert(planExecutions)
        .values({ userId, type: plan.type, titre: plan.titre, ressources })
        .returning({ id: planExecutions.id });
      return { planExecId: pe?.id, nb: ressources.length };
    });

    return {
      ok: true,
      texte: `C’est fait ✅ ${nb} ${nb > 1 ? 'interventions enregistrées' : 'intervention enregistrée'} en un coup — ${plan.titre.toLowerCase()}. Tu peux tout annuler en un clic si besoin.`,
      planExecId,
      nbReussies: nb,
      nbTotal,
    };
  } catch (err) {
    console.error('[copilote] executerPlan échec:', err instanceof Error ? err.message : err);
    return {
      ok: false,
      texte:
        "Je n'ai pas pu appliquer le lot — rien n'a été enregistré (tout a été annulé automatiquement). Réessaie dans un instant.",
      nbReussies: 0,
      nbTotal,
    };
  }
}

/** Résultat d'une annulation de plan. */
export interface ResultatAnnulationPlan {
  ok: boolean;
  texte: string;
}

/**
 * Annule EN CASCADE un plan exécuté : supprime les ressources créées (dans une
 * transaction) et marque le journal comme annulé. Idempotent (un plan déjà annulé
 * renvoie un message neutre). Scopé userId de bout en bout.
 */
export async function annulerPlan(userId: string, planExecId: string): Promise<ResultatAnnulationPlan> {
  const [pe] = await db
    .select({ id: planExecutions.id, statut: planExecutions.statut, ressources: planExecutions.ressources })
    .from(planExecutions)
    .where(and(eq(planExecutions.id, planExecId), eq(planExecutions.userId, userId)))
    .limit(1);

  if (!pe) return { ok: false, texte: 'Je ne retrouve pas ce lot — il a peut-être déjà été retiré.' };
  if (pe.statut === 'annule') return { ok: true, texte: 'Ce lot est déjà annulé 👍' };

  const ressources = (pe.ressources as { actionId: string; id: string }[]) ?? [];
  const idsInterventions = ressources.filter((r) => r.actionId === 'intervention').map((r) => r.id);

  await db.transaction(async (tx) => {
    if (idsInterventions.length > 0) {
      await tx
        .delete(interventions)
        .where(and(inArray(interventions.id, idsInterventions), eq(interventions.userId, userId)));
    }
    await tx
      .update(planExecutions)
      .set({ statut: 'annule', annuleAt: new Date() })
      .where(and(eq(planExecutions.id, planExecId), eq(planExecutions.userId, userId)));
  });

  const n = idsInterventions.length;
  return {
    ok: true,
    texte: `C’est annulé 👍 J’ai retiré ${n > 1 ? `les ${n} interventions` : "l'intervention"} du lot.`,
  };
}
