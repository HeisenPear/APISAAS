// Moteur de suggestions mellifères : à partir du référentiel des floraisons
// (table floraisons_referentiel), filtre selon la position (latitude/altitude),
// le mois et le type de miel recherché. Fonctions pures → testables.

export interface Floraison {
  id: string;
  nom: string;
  nomLatin: string | null;
  typeMiel: string | null;
  regionPrincipale: string | null;
  moisDebut: number;
  jourDebutTypique: number;
  dureeJoursTypique: number;
  altitudeMin: number | null;
  altitudeMax: number | null;
  latitudeMin: string | null;
  latitudeMax: string | null;
  potentielProductionKgRuche: string | null;
  remarques?: string | null;
  emoji: string | null;
}

export interface CriteresFloraison {
  /** Mois calendaire 1-12. */
  mois?: number;
  latitude?: number;
  altitude?: number;
  typeMiel?: string;
}

/**
 * Ensemble des mois (1-12) couverts par la floraison, à partir du jour de début
 * typique et de la durée. Gère le passage d'année (ex. bruyère blanche : nov → janv).
 */
export function moisEnFleur(
  f: Pick<Floraison, 'moisDebut' | 'jourDebutTypique' | 'dureeJoursTypique'>,
): number[] {
  const start = f.moisDebut - 1 + (f.jourDebutTypique - 1) / 30;
  const end = start + f.dureeJoursTypique / 30;
  const overlaps = (s: number, e: number, m: number) => s < m + 1 && e > m;
  const mois = new Set<number>();
  for (let m = 0; m < 12; m++) {
    // base + variante décalée d'un an pour couvrir le débordement déc → janv.
    if (overlaps(start, end, m) || overlaps(start - 12, end - 12, m)) mois.add(m + 1);
  }
  return [...mois].sort((a, b) => a - b);
}

/** La floraison est-elle compatible avec les critères fournis ? */
export function floraisonCompatible(f: Floraison, c: CriteresFloraison): boolean {
  if (c.mois != null && !moisEnFleur(f).includes(c.mois)) return false;
  if (c.typeMiel && f.typeMiel !== c.typeMiel) return false;
  if (c.latitude != null && f.latitudeMin != null && f.latitudeMax != null) {
    if (c.latitude < Number(f.latitudeMin) || c.latitude > Number(f.latitudeMax)) return false;
  }
  if (c.altitude != null && f.altitudeMin != null && f.altitudeMax != null) {
    if (c.altitude < f.altitudeMin || c.altitude > f.altitudeMax) return false;
  }
  return true;
}

/** Floraisons compatibles, triées par potentiel de production décroissant. */
export function suggererFloraisons(list: Floraison[], c: CriteresFloraison): Floraison[] {
  return list
    .filter((f) => floraisonCompatible(f, c))
    .sort(
      (a, b) =>
        Number(b.potentielProductionKgRuche ?? 0) - Number(a.potentielProductionKgRuche ?? 0),
    );
}

const MOIS_COURTS = [
  '',
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

/** Libellé lisible de la période de floraison (ex. « mai », « juin–juil. »). */
export function periodeLabel(f: Pick<Floraison, 'moisDebut' | 'dureeJoursTypique'>): string {
  const nb = Math.max(1, Math.ceil(f.dureeJoursTypique / 30));
  if (nb === 1) return MOIS_COURTS[f.moisDebut] ?? '';
  const end = ((f.moisDebut - 1 + nb - 1) % 12) + 1;
  return `${MOIS_COURTS[f.moisDebut]}–${MOIS_COURTS[end]}`;
}

/** Indice paysage : où chercher cette miellée (forêt, culture, lande…). */
export function indicePaysage(f: Floraison): string | null {
  const arbres = ['acacia', 'tilleul', 'châtaignier', 'sapin'];
  const cultures = ['colza', 'tournesol', 'lavande', 'lavandin', 'sarrasin'];
  const landes = ['bruyère', 'bruyère blanche', 'thym', 'romarin'];
  const t = f.typeMiel ?? '';
  if (arbres.includes(t)) return 'Cherchez les zones boisées';
  if (cultures.includes(t)) return 'Cherchez les grandes cultures';
  if (landes.includes(t)) return 'Cherchez les landes et garrigues';
  return null;
}
