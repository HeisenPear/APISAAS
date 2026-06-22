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

export type IntervalleRecurrence = 'mensuel' | 'annuel';

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

export interface TresorerieParams {
  historique: HistoriqueMois[];
  recurrents: ChargeRecurrente[];
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

/** Projette la trésorerie sur `horizonMois` mois à partir du mois suivant. */
export function projeterTresorerie(params: TresorerieParams): ResultatTresorerie {
  const { historique, recurrents, soldeActuel, horizonMois, anneeCourante, moisCourant } = params;

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
