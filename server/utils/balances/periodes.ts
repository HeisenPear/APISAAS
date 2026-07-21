// ═══════════════════════════════════════════════════════════════════════════
// FENÊTRES & ÉCHANTILLONNAGE DES COURBES.
//
// Ordre de grandeur : une balance qui mesure toutes les 15 min produit ~35 000
// points par an. Renvoyer ça au navigateur, c'est plusieurs Mo de JSON pour
// tracer 1 200 pixels de large. On agrège donc EN SQL (bucket temporel +
// moyenne) : le nombre de points renvoyés reste borné quelle que soit la
// période demandée.
//
// Fonctions PURES — la requête SQL est construite dans la route.
// ═══════════════════════════════════════════════════════════════════════════

import type { Plan } from '~~/app/config/plans';

export const PERIODES_BALANCE = ['24h', '7j', '30j', 'saison'] as const;
export type PeriodeBalance = (typeof PERIODES_BALANCE)[number];

/**
 * Fenêtre d'historique CONSULTABLE par plan, en jours.
 *
 * ⚠️ On ne SUPPRIME jamais une mesure : c'est une limite de REQUÊTE. Un compte
 * Starter qui passe en Pro retrouve instantanément tout son historique — la
 * donnée était là depuis le début.
 *
 * (À remonter dans `PlanLimits` sous une clé `historiqueBalancesJours` le jour
 * où l'on touche `app/config/plans.ts` — hors périmètre de ce lot.)
 */
export const HISTORIQUE_JOURS_PAR_PLAN: Record<Plan, number> = {
  decouverte: 0,
  starter: 90,
  pro: Number.POSITIVE_INFINITY,
  expert: Number.POSITIVE_INFINITY,
};

/** Taille du bucket d'agrégation par période, en secondes. */
export const BUCKET_SECONDES: Record<PeriodeBalance, number> = {
  '24h': 15 * 60, // ~96 points
  '7j': 60 * 60, // ~168 points
  '30j': 3 * 60 * 60, // ~240 points
  saison: 24 * 60 * 60, // ~245 points (1er mars → fin octobre)
};

/** Garde-fou dur : jamais plus de points que ça, quoi qu'il arrive. */
export const MAX_POINTS = 2000;

/** Mois de démarrage de la saison apicole (mars — reprise de ponte). */
const MOIS_DEBUT_SAISON = 2; // index 0-based

export interface FenetreMesures {
  periode: PeriodeBalance;
  depuis: Date;
  jusqua: Date;
  bucketSecondes: number;
  /** La fenêtre du plan a rogné la période demandée (l'UI propose l'upgrade). */
  tronquee: boolean;
  /** Plafond du plan, en jours (`Infinity` = illimité). */
  joursMaxPlan: number;
}

/** Début de la saison apicole en cours (1er mars ; avant mars, celle de l'an passé). */
export function debutSaison(maintenant: Date): Date {
  const annee =
    maintenant.getUTCMonth() < MOIS_DEBUT_SAISON
      ? maintenant.getUTCFullYear() - 1
      : maintenant.getUTCFullYear();
  return new Date(Date.UTC(annee, MOIS_DEBUT_SAISON, 1, 0, 0, 0));
}

/**
 * Résout la fenêtre de requête d'une période, plafonnée par le plan.
 * `tronquee` distingue « il n'y a pas de données » de « ton plan ne te les
 * montre pas » — c'est ce booléen qui doit piloter le message de l'UI.
 */
export function resoudreFenetre(
  periode: PeriodeBalance,
  plan: Plan,
  maintenant: Date = new Date(),
): FenetreMesures {
  const jusqua = maintenant;
  let depuis: Date;
  switch (periode) {
    case '24h':
      depuis = new Date(maintenant.getTime() - 24 * 3600 * 1000);
      break;
    case '7j':
      depuis = new Date(maintenant.getTime() - 7 * 86_400_000);
      break;
    case '30j':
      depuis = new Date(maintenant.getTime() - 30 * 86_400_000);
      break;
    default:
      depuis = debutSaison(maintenant);
  }

  const joursMaxPlan = HISTORIQUE_JOURS_PAR_PLAN[plan];
  let tronquee = false;
  if (Number.isFinite(joursMaxPlan)) {
    const plancher = new Date(maintenant.getTime() - joursMaxPlan * 86_400_000);
    if (depuis < plancher) {
      depuis = plancher;
      tronquee = true;
    }
  }

  return {
    periode,
    depuis,
    jusqua,
    bucketSecondes: BUCKET_SECONDES[periode],
    tronquee,
    joursMaxPlan,
  };
}
