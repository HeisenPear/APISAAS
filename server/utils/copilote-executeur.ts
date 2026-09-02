import { and, eq, inArray } from 'drizzle-orm';
import { annulationAutorisee, annulationExpiree } from '~~/server/utils/annulationRegle';
import { db } from '~~/server/utils/db';
import { interventions, planExecutions } from '~~/server/database/schema';
import type { Plan } from '~~/app/config/plans';
import {
  chargerRuches,
  memeNumero,
  insererInterventionTx,
  insererClientTx,
  insererVenteTx,
  insererAchatTx,
  insererRucherTx,
  insererRucheTx,
  insererMortaliteTx,
  insererRecolteTx,
  insererStockTx,
  annulerClientTx,
  annulerVenteTx,
  annulerAchatTx,
  annulerRucherTx,
  annulerRucheTx,
  annulerMortaliteTx,
  annulerRecolteTx,
  annulerStockTx,
  type RucheRef,
  type ActionCreatrice,
  type ResultatExecution,
} from '~~/server/utils/copilote-actions';
import type { DrizzleTransaction } from '~~/server/types/interventions';
import { getRuchesSante } from '~~/server/utils/copilote-data';
import { normaliser } from '~~/server/utils/copilote-local';
import type { CibleRuches, CritereRuche } from '~~/server/utils/copilote-cibles';
import type { PlanMaya, EtapePlan } from '~~/server/utils/copilote-plan';

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
      // Articles/mots-outils français ≥ 3 lettres à ignorer : sans ce filtre,
      // « rucher des Tilleuls » matcherait aussi « rucher des Acacias » (le mot
      // « des » est commun aux deux). On matche ensuite sur des MOTS ENTIERS du
      // nom (pas une sous-chaîne : « nord » ne doit pas capturer « nordet »),
      // avec repli `includes` seulement pour les tokens longs (≥ 4 lettres).
      const MOTS_OUTILS = new Set([
        'des',
        'les',
        'aux',
        'une',
        'mon',
        'mes',
        'ton',
        'tes',
        'son',
        'ses',
        'nos',
        'tes',
        'leur',
        'leurs',
        'avec',
        'pour',
        'dans',
        'sur',
        'chez',
      ]);
      const mots = normaliser(cible.rucher)
        .split(/\s+/)
        .filter((m) => m.length >= 3 && !MOTS_OUTILS.has(m));
      if (!mots.length) return [];
      return rows.filter((r) => {
        const nom = normaliser(r.rucherNom);
        const nomMots = new Set(nom.split(/\s+/));
        return mots.some((m) => nomMots.has(m) || (m.length >= 4 && nom.includes(m)));
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

/** Une ressource créée par une étape, tracée pour l'undo (journal `plan_executions`). */
interface RessourcePlan {
  actionId: ActionCreatrice;
  id: string;
}

/**
 * Exécute UNE étape dans la transaction partagée, en dispatchant vers la primitive
 * d'écriture tx-aware du bon domaine. Réutilise exactement les cœurs atomiques des
 * actions isolées (aucune règle métier dupliquée). 'vente' reste un stub non exécutable.
 */
function executerEtapeTx(
  exec: DrizzleTransaction,
  userId: string,
  etape: EtapePlan,
  planAbo: Plan,
): Promise<ResultatExecution> {
  switch (etape.actionId) {
    case 'intervention':
      return insererInterventionTx(exec, userId, etape.params, planAbo);
    case 'client':
      return insererClientTx(exec, userId, etape.params, planAbo);
    case 'recolte':
      return insererRecolteTx(exec, userId, etape.params, planAbo);
    case 'stock':
      return insererStockTx(exec, userId, etape.params, planAbo);
    case 'vente':
      return insererVenteTx(exec, userId, etape.params, planAbo);
    case 'achat':
      return insererAchatTx(exec, userId, etape.params, planAbo);
    case 'rucher':
      return insererRucherTx(exec, userId, etape.params, planAbo);
    case 'ruche':
      return insererRucheTx(exec, userId, etape.params, planAbo);
    case 'mortalite':
      return insererMortaliteTx(exec, userId, etape.params, planAbo);
  }
}

/**
 * Annule UNE ressource créée, et RÉPOND combien de lignes sont vraiment parties.
 *
 * ⚠️ ELLE ÉTAIT `Promise<void>`, ET C'EST LA CAUSE RACINE DE DEUX DÉFAUTS.
 *
 * Une sortie muette ne peut pas mentir : elle ne dit rien. C'est ce qui rendait
 * possible le `case 'vente': return;` — un no-op parfaitement silencieux, que
 * TypeScript ne pouvait pas signaler puisqu'il n'y avait rien à rendre. Et
 * c'est ce qui obligeait l'appelant à ANNONCER un nombre au lieu de le mesurer :
 * « J'ai défait les 20 actions » comptait les ressources journalisées, jamais
 * les lignes supprimées. Toute ligne déjà disparue, tout undo no-op, toute
 * action future non câblée était comptée comme défaite.
 *
 * `Promise<number>` ferme les deux : un cas qui ne défait rien doit désormais
 * l'écrire (`return 0`), et l'appelant peut additionner du réel.
 *
 * ⚠️ CETTE PROMESSE A ÉTÉ TENUE, ET C'EST LA MEILLEURE PREUVE QU'ELLE VALAIT.
 * Le commentaire d'origine disait : « le jour où la vente écrira pour de bon,
 * ce switch refusera de compiler tant qu'on ne lui aura pas dit comment la
 * défaire ». C'est exactement ce qui s'est produit — passer `ecrit: true` dans
 * le catalogue a fait tomber la compilation ICI, avant qu'une seule vente ne
 * puisse être écrite sans savoir se défaire. `auto ⟹ annulable` n'est pas
 * qu'une règle de prose : elle est tenue par le typage.
 */
async function annulerRessourceTx(
  exec: DrizzleTransaction,
  userId: string,
  ressource: RessourcePlan,
): Promise<number> {
  switch (ressource.actionId) {
    case 'intervention': {
      const partis = await exec
        .delete(interventions)
        .where(and(eq(interventions.id, ressource.id), eq(interventions.userId, userId)))
        .returning({ id: interventions.id });
      return partis.length;
    }
    case 'client':
      return annulerClientTx(exec, userId, ressource.id);
    case 'recolte':
      return annulerRecolteTx(exec, userId, ressource.id);
    case 'stock':
      return annulerStockTx(exec, userId, ressource.id);
    case 'vente':
      // Restreinte aux BROUILLONS dans `annulerVenteTx` : Maya n'écrit que des
      // brouillons, donc défaire autre chose voudrait dire effacer une facture
      // émise — celles-là ne se suppriment pas, elles s'avoirent.
      return annulerVenteTx(exec, userId, ressource.id);
    case 'achat':
      // Restreinte au TYPE `achat` dans `annulerAchatTx` : un identifiant venu
      // d'un journal corrompu ne doit pas faire supprimer une facture de vente
      // par la porte des dépenses.
      return annulerAchatTx(exec, userId, ressource.id);
    case 'rucher':
      // Refuse un rucher qui porte DÉJÀ une ruche : la clé étrangère est en
      // cascade, et « Annuler » ne doit pas emporter un cheptel.
      return annulerRucherTx(exec, userId, ressource.id);
    case 'ruche':
      // Refuse une ruche qui porte DÉJÀ une intervention : ce n'est plus ce
      // que Maya vient d'écrire, c'est le travail de l'apiculteur.
      return annulerRucheTx(exec, userId, ressource.id);
    case 'mortalite':
      // RESTAURE le statut d'avant, puis retire la trace. Défaire un changement
      // de statut n'est pas supprimer une ligne : l'ancien statut est lu dans
      // la trace, jamais reçu du client.
      return annulerMortaliteTx(exec, userId, ressource.id);
    default:
      return jamaisAtteint(ressource.actionId, 'annulerRessourceTx');
  }
}

/**
 * Le cas qu'on jure impossible — et qui doit hurler s'il arrive.
 *
 * TypeScript garantit l'exhaustivité À LA COMPILATION : si un `ActionId`
 * nouveau n'est pas traité, `x` n'est plus `never` et le fichier ne compile
 * plus. À l'exécution, le journal d'un lot peut contenir n'importe quoi (il est
 * relu depuis la base, écrit par une version antérieure du code) : on préfère
 * une erreur qui annule la transaction à un silence qui compterait la ligne
 * comme défaite.
 */
function jamaisAtteint(x: never, ou: string): never {
  throw new Error(`${ou} : cas non traité « ${String(x)} » — l'annulation serait incomplète.`);
}

/**
 * La règle d'annulation vit maintenant dans `annulationRegle.ts`, PARTAGÉE
 * avec l'annulation d'une action seule.
 *
 * ⚠️ ELLE ÉTAIT ICI, ET C'EST BIEN LE PROBLÈME. Le lot était sérieusement
 * gardé — types relus en base, fenêtre de 24 h, refus en bloc — pendant que
 * `annulerActionIntervention` faisait un DELETE nu. Le chemin le mieux protégé
 * était celui qui demandait une confirmation ; celui qui écrivait TOUT SEUL
 * n'avait aucun filet. Une règle écrite chez un seul appelant finit toujours
 * par ne garder que lui.
 *
 * ⚠️ CE MODULE LES A RÉEXPORTÉES, ET ÇA ANNULAIT LE PARTAGE. Nitro
 * auto-importe PAR NOM : deux modules exportant `TYPES_ANNULABLES` lui donnent
 * deux chemins, il en retient un et ignore l'autre — ici c'était le réexport
 * qui gagnait, donc `annulationRegle.ts`, le module qui fait justement
 * autorité, était le module ignoré. Le jour où quelqu'un définit une version
 * LOCALE d'un de ces noms ici, elle prend silencieusement la place de la règle
 * partagée, et le lot repart avec sa propre table d'annulables — exactement le
 * défaut que ce découpage venait supprimer.
 *
 * On importe donc, on ne réexporte pas. Les appelants vont à la source.
 */

/**
 * Exécute un plan (LOT ou SÉQUENCE composée) dans UNE transaction : chaque étape
 * réutilise le cœur atomique de son domaine avec la transaction partagée. Si une
 * étape échoue, TOUT est annulé (rien d'écrit). En cas de succès, le journal des
 * ressources créées est persisté pour permettre l'annulation en cascade.
 */
export async function executerPlan(
  userId: string,
  plan: PlanMaya,
  planAbo: Plan,
): Promise<ResultatPlan> {
  const nbTotal = plan.etapes.length;
  if (nbTotal === 0) {
    return { ok: false, texte: 'Rien à enregistrer.', nbReussies: 0, nbTotal: 0 };
  }

  try {
    const { planExecId, nb } = await db.transaction(async (tx) => {
      const ressources: RessourcePlan[] = [];
      for (const etape of plan.etapes) {
        const res = await executerEtapeTx(tx, userId, etape, planAbo);
        if (!res.ok || !res.cree) {
          const e = new Error(res.texte || 'Étape en échec');
          // Marque portée par l'erreur : le `catch` doit pouvoir distinguer un
          // refus d'abonnement d'une panne, et ne pas conseiller de réessayer.
          if (res.refusPlan) (e as Error & { refusPlan?: boolean }).refusPlan = true;
          throw e;
        }
        ressources.push({ actionId: res.cree.actionId, id: res.cree.id });
      }
      const [pe] = await tx
        .insert(planExecutions)
        .values({ userId, type: plan.type, titre: plan.titre, ressources })
        .returning({ id: planExecutions.id });
      return { planExecId: pe?.id, nb: ressources.length };
    });

    const quoi =
      plan.type === 'lot'
        ? `${nb} ${nb > 1 ? 'interventions enregistrées' : 'intervention enregistrée'} en un coup`
        : `${nb} ${nb > 1 ? 'actions enchaînées' : 'action réalisée'}`;
    return {
      ok: true,
      texte: `Et voilà — ${quoi}, ${plan.titre.toLowerCase()}. Tu peux tout annuler en un clic si tu changes d’avis.`,
      planExecId,
      nbReussies: nb,
      nbTotal,
    };
  } catch (err) {
    console.error('[copilote] executerPlan échec:', err instanceof Error ? err.message : err);

    // Un refus d'ABONNEMENT garde sa phrase : elle nomme la formule qui
    // débloque et où changer. La remplacer par « Réessaie dans un instant »
    // donnait un conseil faux — réessayer ne lève jamais un plafond — et
    // effaçait la seule porte de sortie que l'apiculteur avait sous les yeux.
    if ((err as { refusPlan?: boolean })?.refusPlan && err instanceof Error) {
      return {
        ok: false,
        texte: `${err.message}\n\nRien n'a été enregistré : le lot entier a été annulé.`,
        nbReussies: 0,
        nbTotal,
      };
    }

    return {
      ok: false,
      texte:
        "Je n'ai pas pu tout appliquer — rien n'a été enregistré (tout a été annulé automatiquement). Réessaie dans un instant.",
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
 * Annule EN CASCADE un plan exécuté : défait les ressources créées EN ORDRE INVERSE
 * (dans une transaction) — dispatch par domaine — et marque le journal comme annulé.
 * Idempotent (un plan déjà annulé renvoie un message neutre). Scopé userId.
 */
export async function annulerPlan(
  userId: string,
  planExecId: string,
): Promise<ResultatAnnulationPlan> {
  const [pe] = await db
    .select({
      id: planExecutions.id,
      statut: planExecutions.statut,
      ressources: planExecutions.ressources,
      createdAt: planExecutions.createdAt,
    })
    .from(planExecutions)
    .where(and(eq(planExecutions.id, planExecId), eq(planExecutions.userId, userId)))
    .limit(1);

  if (!pe)
    return { ok: false, texte: 'Je ne retrouve pas ce lot — il a peut-être déjà été retiré.' };
  if (pe.statut === 'annule') return { ok: true, texte: 'Ce lot est déjà annulé' };

  // FENÊTRE D'ANNULATION — « Tout annuler » est un geste d'immédiateté, pas un
  // outil de réécriture d'historique.
  //
  // L'annulation SUPPRIME les lignes créées, sans vérifier ce qu'on a bâti
  // dessus depuis : `annulerClientTx` efface un client qui a peut-être reçu des
  // factures, `annulerRecolteTx` une récolte peut-être déjà mise en pot. Défaire
  // un lot vieux de trois mois, c'est donc au mieux une erreur de clé étrangère,
  // au pire une ligne comptable qui disparaît sans que personne l'ait demandé.
  //
  // Au-delà de la fenêtre, on refuse — en disant quoi faire à la place. Rien
  // n'est perdu : la donnée reste modifiable normalement dans l'application.
  // Un lot ne se défait qu'ENTIÈREMENT. On vérifie AVANT de toucher à quoi que
  // ce soit : une annulation partielle laisserait la base dans un état que
  // personne n'a demandé, et que l'apiculteur croirait propre.
  const idsInterventions = ((pe.ressources as RessourcePlan[]) ?? [])
    .filter((r) => r.actionId === 'intervention')
    .map((r) => r.id);

  if (idsInterventions.length) {
    const lignes = await db
      .select({ type: interventions.type })
      .from(interventions)
      .where(and(inArray(interventions.id, idsInterventions), eq(interventions.userId, userId)));

    // ⚠️ ON COMPARE LES ENSEMBLES, PAS SEULEMENT LE RÉSULTAT. Une ligne déjà
    // supprimée à la main ne remonte pas du SELECT : elle sortait donc du
    // contrôle de type et repassait pour annulable. Un lot de 12 pesées
    // (type NON annulable) dont les lignes avaient disparu franchissait le
    // garde sans broncher, la boucle ne supprimait rien, et Maya répondait
    // « J'ai défait les 12 actions du lot ». On traite le manque comme un
    // inconnu — donc comme un refus.
    const manquantes = idsInterventions.length - lignes.length;
    const types = [...lignes.map((l) => l.type), ...Array<null>(manquantes).fill(null)];

    const verdict = annulationAutorisee(types, pe.createdAt);
    if (!verdict.ok) return { ok: false, texte: verdict.motif };
  } else if (annulationExpiree(pe.createdAt)) {
    // Un lot sans intervention (client, récolte, stock) n'a pas de type à
    // relire, mais la fenêtre s'applique quand même.
    return {
      ok: false,
      texte:
        'Ce lot date de plus de 24 heures — je ne le défais pas automatiquement, ' +
        'car tu as pu t’appuyer dessus depuis (une facture, une mise en pot…). ' +
        'Tu peux modifier ou supprimer chaque élément directement dans l’application.',
    };
  }

  const ressources = (pe.ressources as RessourcePlan[]) ?? [];

  let defaites = 0;
  await db.transaction(async (tx) => {
    // Ordre inverse : on défait la dernière ressource créée en premier.
    for (const ressource of [...ressources].reverse()) {
      defaites += await annulerRessourceTx(tx, userId, ressource);
    }
    await tx
      .update(planExecutions)
      .set({ statut: 'annule', annuleAt: new Date() })
      .where(and(eq(planExecutions.id, planExecId), eq(planExecutions.userId, userId)));
  });

  // ⚠️ ON ANNONCE CE QU'ON A MESURÉ, PAS CE QU'ON AVAIT PRÉVU. La phrase
  // comptait `ressources.length` — le nombre de lignes JOURNALISÉES à
  // l'exécution, jamais le nombre de lignes réellement supprimées. Une ligne
  // déjà disparue, un undo no-op : tout était compté comme défait. Sur le
  // message qui clôt un geste destructeur, un chiffre inventé est le pire des
  // détails.
  if (defaites === 0) {
    return {
      ok: true,
      texte:
        'Il n’y avait plus rien à défaire — ces lignes avaient déjà disparu. ' +
        'Le lot est marqué annulé.',
    };
  }
  const prevu = ressources.length;
  const reste = prevu - defaites;
  return {
    ok: true,
    texte:
      `C’est annulé — j’ai défait ${defaites > 1 ? `les ${defaites} actions` : "l'action"} du lot.` +
      (reste > 0
        ? ` ${reste === 1 ? 'Une ligne avait' : `${reste} lignes avaient`} déjà disparu de leur côté.`
        : ''),
  };
}
