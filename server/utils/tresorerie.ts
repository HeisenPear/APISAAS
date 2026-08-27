/**
 * Prévisionnel de trésorerie — projection de cash-flow.
 *
 * Modèle v1, déterministe et transparent :
 *  - Entrées/sorties projetées par mois = **moyenne saisonnière** du même mois
 *    calendaire sur l'historique disponible (jusqu'à `lookbackYears` années).
 *    Les charges récurrentes passées y sont déjà incluses, donc pas de double
 *    comptage.
 *  - Pour un mois SANS historique, on retombe sur les **charges récurrentes
 *    connues** dues ce mois-là (plancher de dépenses) ; entrées = 0.
 *  - Le solde cumulé part d'un `soldeActuel` fourni par l'utilisateur (on ne
 *    suit pas le compte bancaire) et avance mois par mois.
 *
 * La fonction est pure et testée ; la route se contente de l'alimenter.
 */

// ⚠️ C'était une SECONDE définition, identique mot pour mot à celle de
// `recurrence.ts` — le module qui calcule réellement l'échéance suivante.
// Deux tables qui décrivent la même règle finissent par diverger : ajouter
// « trimestriel » au moteur aurait laissé cette copie à deux valeurs, et
// c'est justement CELLE-CI que l'auto-import Nuxt retenait.
//
// Import de TYPE, jamais un réexport : un réexport recréerait exactement le
// second chemin d'auto-import qu'on vient de supprimer.
import type { IntervalleRecurrence } from '~~/server/utils/recurrence';

export interface HistoriqueMois {
  annee: number;
  /** 1-12 */
  mois: number;
  ventes: number;
  achats: number;
}

export interface ChargeRecurrente {
  libelle: string;
  montant: number;
  intervalle: IntervalleRecurrence;
  /** Mois calendaire (1-12) de la prochaine échéance — utilisé pour l'annuel. */
  moisProchain: number;
}

export type PrevisionType = 'depense' | 'investissement' | 'recette';
export type PrevisionRecurrence = 'ponctuel' | 'mensuel' | 'annuel';

/**
 * Poste PLANIFIÉ saisi à la main par l'apiculteur (dépense, investissement ou recette).
 * S'ajoute à la saisonnalité déduite de l'historique — c'est du cash-flow certain, pas
 * une estimation. `montant` est toujours positif ; le sens vient de `type`.
 */
export interface PrevisionItem {
  montant: number;
  type: PrevisionType;
  recurrence: PrevisionRecurrence;
  /** Année de la 1re échéance. */
  annee: number;
  /** Mois 1-12 de la 1re échéance. */
  mois: number;
}

export interface TresorerieParams {
  historique: HistoriqueMois[];
  recurrents: ChargeRecurrente[];
  previsions?: PrevisionItem[];
  soldeActuel: number;
  horizonMois: number;
  anneeCourante: number;
  /** 1-12 */
  moisCourant: number;
}

export interface MoisProjection {
  annee: number;
  mois: number;
  label: string;
  entrees: number;
  sorties: number;
  /** Part planifiée (postes saisis) incluse dans entrees/sorties, pour transparence. */
  entreesPrevues: number;
  sortiesPrevues: number;
  net: number;
  soldeCumule: number;
  confiance: 'haute' | 'moyenne' | 'faible';
  source: 'historique' | 'recurrents';
}

export interface ResultatTresorerie {
  projection: MoisProjection[];
  soldeFinal: number;
  pointBas: { label: string; solde: number } | null;
  moisDeficit: number;
  entreesTotales: number;
  sortiesTotales: number;
}

const MOIS_LABELS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export function moisLabel(annee: number, mois: number): string {
  return `${MOIS_LABELS[mois - 1]} ${annee}`;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Moyenne saisonnière (sur les années disponibles) pour un mois calendaire. */
function moyenneSaisonniere(
  historique: HistoriqueMois[],
  moisCalendaire: number,
): { ventes: number; achats: number; nAnnees: number } | null {
  const items = historique.filter((h) => h.mois === moisCalendaire);
  if (items.length === 0) return null;
  const nAnnees = new Set(items.map((i) => i.annee)).size;
  const ventes = items.reduce((s, i) => s + i.ventes, 0) / items.length;
  const achats = items.reduce((s, i) => s + i.achats, 0) / items.length;
  return { ventes, achats, nAnnees };
}

/** Somme des charges récurrentes dues un mois calendaire donné. */
function recurrentsDus(recurrents: ChargeRecurrente[], moisCalendaire: number): number {
  return recurrents.reduce((sum, r) => {
    if (r.intervalle === 'mensuel') return sum + r.montant;
    if (r.intervalle === 'annuel' && r.moisProchain === moisCalendaire) return sum + r.montant;
    return sum;
  }, 0);
}

/** Un poste planifié tombe-t-il sur (annee, mois) donné, selon sa récurrence ? */
function previsionActive(p: PrevisionItem, annee: number, mois: number): boolean {
  const apres = annee > p.annee || (annee === p.annee && mois >= p.mois);
  if (p.recurrence === 'mensuel') return apres;
  if (p.recurrence === 'annuel') return mois === p.mois && annee >= p.annee;
  return annee === p.annee && mois === p.mois; // ponctuel
}

/** Entrées / sorties planifiées (saisies main) qui tombent sur (annee, mois). */
function previsionsDuMois(
  previsions: PrevisionItem[],
  annee: number,
  mois: number,
): { entrees: number; sorties: number } {
  let entrees = 0;
  let sorties = 0;
  for (const p of previsions) {
    if (!previsionActive(p, annee, mois)) continue;
    if (p.type === 'recette') entrees += p.montant;
    else sorties += p.montant; // depense | investissement
  }
  return { entrees: round2(entrees), sorties: round2(sorties) };
}

/** Projette la trésorerie sur `horizonMois` mois à partir du mois suivant. */
export function projeterTresorerie(params: TresorerieParams): ResultatTresorerie {
  const {
    historique,
    recurrents,
    previsions = [],
    soldeActuel,
    horizonMois,
    anneeCourante,
    moisCourant,
  } = params;

  const projection: MoisProjection[] = [];
  let solde = soldeActuel;
  let entreesTotales = 0;
  let sortiesTotales = 0;
  let pointBas: { label: string; solde: number } | null = null;

  for (let i = 1; i <= horizonMois; i++) {
    const offset = moisCourant - 1 + i; // mois écoulés depuis janvier de l'année courante
    const annee = anneeCourante + Math.floor(offset / 12);
    const mois = (offset % 12) + 1;

    const saison = moyenneSaisonniere(historique, mois);
    let entrees: number;
    let sorties: number;
    let source: 'historique' | 'recurrents';
    let confiance: 'haute' | 'moyenne' | 'faible';

    if (saison) {
      entrees = round2(saison.ventes);
      sorties = round2(saison.achats);
      source = 'historique';
      confiance = saison.nAnnees >= 3 ? 'haute' : saison.nAnnees === 2 ? 'moyenne' : 'faible';
    } else {
      entrees = 0;
      sorties = round2(recurrentsDus(recurrents, mois));
      source = 'recurrents';
      confiance = 'faible';
    }

    // Postes planifiés (saisis à la main) : s'ajoutent PAR-DESSUS la saisonnalité.
    const prev = previsionsDuMois(previsions, annee, mois);
    entrees = round2(entrees + prev.entrees);
    sorties = round2(sorties + prev.sorties);

    const net = round2(entrees - sorties);
    solde = round2(solde + net);
    entreesTotales = round2(entreesTotales + entrees);
    sortiesTotales = round2(sortiesTotales + sorties);

    const label = moisLabel(annee, mois);
    if (pointBas === null || solde < pointBas.solde) pointBas = { label, solde };

    projection.push({
      annee,
      mois,
      label,
      entrees,
      sorties,
      entreesPrevues: prev.entrees,
      sortiesPrevues: prev.sorties,
      net,
      soldeCumule: solde,
      confiance,
      source,
    });
  }

  return {
    projection,
    soldeFinal: solde,
    pointBas,
    moisDeficit: projection.filter((p) => p.soldeCumule < 0).length,
    entreesTotales,
    sortiesTotales,
  };
}
