// ═══════════════════════════════════════════════════════════════════════════
// CADENCE DE VISITE SAISONNIÈRE — le bon rythme de visite dépend de la saison
// apicole, pas d'un délai fixe unique. Fonctions pures → testables.
//
//  - Printemps (mars-mai) : essaimage → visites rapprochées (~10 j).
//  - Été (juin-août)      : miellées → suivi régulier (~14 j).
//  - Automne (sept-nov)   : préparation hivernage (~21 j).
//  - Hiver (déc-févr)     : REPOS — on n'ouvre pas les ruches (seuil large).
//
// Sert au socle d'alertes « visite » ET à la feuille de route du jour, pour que
// l'app sollicite l'apiculteur au bon moment plutôt qu'à un rythme arbitraire.
// ═══════════════════════════════════════════════════════════════════════════

export type Saison = 'hiver' | 'printemps' | 'ete' | 'automne';

const FMT_MOIS_PARIS = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  timeZone: 'Europe/Paris',
});

/** Mois 1-12 dans le fuseau Europe/Paris (cohérent avec les heures calmes push). */
export function moisParis(date: Date): number {
  return Number(FMT_MOIS_PARIS.format(date));
}

/** Saison apicole d'une date (bornes calendaires, fuseau Paris). */
export function saisonApicole(date: Date): Saison {
  const m = moisParis(date);
  if (m === 12 || m <= 2) return 'hiver';
  if (m <= 5) return 'printemps';
  if (m <= 8) return 'ete';
  return 'automne';
}

export interface Cadence {
  saison: Saison;
  /** Seuil de retard de visite en jours (au-delà → « à visiter »). */
  intervalleJours: number;
  /** Hiver : on ne provoque pas de visite d'ouverture. */
  repos: boolean;
  label: string;
}

const CADENCE_PAR_SAISON: Record<Saison, Omit<Cadence, 'saison'>> = {
  printemps: { intervalleJours: 10, repos: false, label: 'Printemps — surveillance essaimage' },
  ete: { intervalleJours: 14, repos: false, label: 'Été — suivi des miellées' },
  automne: { intervalleJours: 21, repos: false, label: 'Automne — préparation hivernage' },
  hiver: { intervalleJours: 60, repos: true, label: 'Hiver — repos du cheptel' },
};

/** Cadence complète recommandée pour une date. */
export function cadenceVisite(date: Date): Cadence {
  const saison = saisonApicole(date);
  return { saison, ...CADENCE_PAR_SAISON[saison] };
}

/** Seuil de retard de visite (jours) recommandé pour une date. */
export function intervalleVisiteJours(date: Date): number {
  return cadenceVisite(date).intervalleJours;
}

/**
 * Nombre de visites de ruches recommandées sur la semaine pour un cheptel donné.
 * Toutes les ruches devant être vues tous les `intervalleJours` : par semaine on
 * en couvre environ N × 7 / intervalle. Renvoie 0 en repos hivernal.
 */
export function chargeHebdomadaire(nbRuchesActives: number, date: Date): number {
  const { intervalleJours, repos } = cadenceVisite(date);
  if (repos || nbRuchesActives <= 0) return 0;
  return Math.ceil((nbRuchesActives * 7) / intervalleJours);
}
