import { and, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import { alertes, interventions, stocks, transactions } from '~~/server/database/schema';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { compterRuchesJamaisVisitees } from './cheptel';
import { ruchesRetabliesIds } from '~~/server/utils/alertesCore';
import type { AlerteActive, ContexteResolution, Resolveur } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-RÉSOLUTION — SOURCE DE VÉRITÉ UNIQUE.
//
// Une alerte dont la condition n'est plus vraie doit être résolue, sinon
// l'anti-doublon la considère toujours active et BLOQUE la prochaine alerte
// légitime du même type. Cette logique existait en double (route dashboard et
// cron), avec des divergences réelles : `rdv_rappel` n'était résolu que par le
// cron, et `sante_critique` par personne.
//
// ⚠️ Deux invariants à ne jamais casser :
//
//  1. Un résolveur n'écrit RIEN. Il rend des ids ; `appliquerResolutions` fait
//     UNE mise à jour groupée. Ça permet aussi d'isoler les échecs.
//  2. Les ids résolus sont SOUSTRAITS de l'anti-doublon pour la suite du run
//     (cf. index.ts). Sans ça, une alerte qu'on vient de résoudre passerait pour
//     encore active et ne serait jamais recréée — c'est exactement ce qui
//     ferait disparaître la météo, qui est résolue puis régénérée à chaque run.
//
// ⚠️ `inArray` PARTOUT, jamais `ANY(${ids}::uuid[])` : le binding d'un tableau
// JS en paramètre unique est fragile derrière le pooler Supabase en mode
// transaction (`prepare: false`) et a déjà fait échouer toute la résolution en
// production.
// ═══════════════════════════════════════════════════════════════════════════

/** Alertes encore actives d'un utilisateur — lues UNE fois par run. */
export async function chargerAlertesActives(userId: string): Promise<AlerteActive[]> {
  return db
    .select({ id: alertes.id, type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));
}

/** Ids des alertes actives d'un type donné qui portent une référence. */
function referencesActives(ctx: ContexteResolution, type: string): string[] {
  return ctx.existantes.filter((a) => a.type === type && a.referenceId).map((a) => a.referenceId!);
}

/** Alertes d'un type dont la référence appartient à `resolues`. */
function idsDont(ctx: ContexteResolution, type: string, resolues: Set<string>): string[] {
  return ctx.existantes
    .filter((a) => a.type === type && resolues.has(a.referenceId ?? ''))
    .map((a) => a.id);
}

/**
 * `visite_requise` : la ruche a été revue depuis le seuil de saison.
 * `premiere_visite` : plus AUCUNE ruche n'attend son premier contrôle.
 */
export const resoudreVisites: Resolveur = async (ctx) => {
  const out: string[] = [];

  const visiteIds = referencesActives(ctx, 'visite_requise');
  if (visiteIds.length > 0) {
    const cutoff = new Date(ctx.maintenant);
    cutoff.setDate(cutoff.getDate() - intervalleVisiteJours(ctx.maintenant));
    const revues = await db
      .selectDistinct({ rucheId: interventions.rucheId })
      .from(interventions)
      .where(
        and(
          inArray(interventions.rucheId, visiteIds),
          eq(interventions.type, 'controle'),
          gte(interventions.dateVisite, cutoff),
        ),
      );
    const revuesIds = new Set(
      revues.map((v) => v.rucheId).filter((id): id is string => id !== null),
    );
    out.push(...idsDont(ctx, 'visite_requise', revuesIds));
  }

  const premieres = ctx.existantes.filter((a) => a.type === 'premiere_visite');
  if (premieres.length > 0 && compterRuchesJamaisVisitees(ctx.cheptel) === 0) {
    out.push(...premieres.map((a) => a.id));
  }

  return out;
};

/**
 * `sante_critique` : le score est remonté au-dessus du seuil, ou la ruche n'est
 * plus comptabilisée. PURE.
 *
 * Ce type n'était résolu NULLE PART : l'alerte survivait à la guérison de la
 * colonie et empêchait, par anti-doublon, toute alerte ultérieure sur la même
 * ruche — y compris une vraie rechute.
 */
export const resoudreSanteCritique: Resolveur = (ctx) => {
  const actives = ctx.existantes.filter((a) => a.type === 'sante_critique');
  if (actives.length === 0) return [];
  const retablies = ruchesRetabliesIds(ctx.cheptel, ctx.maintenant);
  // Une ruche absente du cheptel (supprimée, désactivée) n'a plus de raison de
  // porter une alerte de santé non plus.
  const presentes = new Set(ctx.cheptel.map((r) => r.id));
  return actives
    .filter((a) => {
      const ref = a.referenceId ?? '';
      return retablies.has(ref) || !presentes.has(ref);
    })
    .map((a) => a.id);
};

/** `stock_bas` : la quantité est repassée au-dessus du seuil (ou le seuil a sauté). */
export const resoudreStocks: Resolveur = async (ctx) => {
  const ids = referencesActives(ctx, 'stock_bas');
  if (ids.length === 0) return [];
  const ok = await db
    .select({ id: stocks.id })
    .from(stocks)
    .where(
      and(
        inArray(stocks.id, ids),
        sql`${stocks.seuilAlerte} IS NULL OR ${stocks.quantite}::numeric > ${stocks.seuilAlerte}::numeric`,
      ),
    );
  return idsDont(ctx, 'stock_bas', new Set(ok.map((s) => s.id)));
};

/** `facture_retard` : la facture n'est plus en retard (réglée, annulée, échéance repoussée). */
export const resoudreFactures: Resolveur = async (ctx) => {
  const ids = referencesActives(ctx, 'facture_retard');
  if (ids.length === 0) return [];
  const ok = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        inArray(transactions.id, ids),
        sql`NOT (statut = 'envoyee' AND date_echeance IS NOT NULL AND date_echeance < ${ctx.maintenant.toISOString()})`,
      ),
    );
  return idsDont(ctx, 'facture_retard', new Set(ok.map((f) => f.id)));
};

/**
 * `rdv_rappel` : le rendez-vous est passé.
 *
 * N'était résolu que par le cron : une alerte de RDV restait donc active pour
 * l'éternité côté route à la demande.
 */
export const resoudreRdv: Resolveur = async (ctx) => {
  const ids = referencesActives(ctx, 'rdv_rappel');
  if (ids.length === 0) return [];
  const passes = await db
    .select({ id: interventions.id })
    .from(interventions)
    .where(and(inArray(interventions.id, ids), lt(interventions.dateVisite, ctx.maintenant)));
  return idsDont(ctx, 'rdv_rappel', new Set(passes.map((r) => r.id)));
};

/**
 * Applique tous les résolveurs, en UNE mise à jour, et rend les ids résolus.
 *
 * Chaque résolveur est isolé : celui qui échoue est logué et n'emporte ni les
 * autres, ni la génération, ni l'utilisateur — le cron perdait jusqu'ici le
 * compte entier au moindre throw (`processInBatches` capture par utilisateur).
 */
export async function appliquerResolutions(
  ctx: ContexteResolution,
  resolveurs: readonly Resolveur[],
): Promise<Set<string>> {
  const resolus = new Set<string>();
  if (ctx.existantes.length === 0) return resolus;

  for (const resoudre of resolveurs) {
    try {
      for (const id of await resoudre(ctx)) resolus.add(id);
    } catch (err) {
      console.error('[moteurAlertes] résolution en échec', {
        userId: ctx.userId,
        erreur: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (resolus.size > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: ctx.maintenant, updatedAt: ctx.maintenant })
      .where(inArray(alertes.id, [...resolus]));
  }
  return resolus;
}
