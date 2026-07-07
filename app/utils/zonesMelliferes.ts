// Zones mellifères par département (curées d'après la géographie apicole française).
// Chaque type de miel est associé à des départements avec une intensité (3 forte,
// 2 moyenne). Combiné au potentiel de production du référentiel, on en déduit, par
// département, la part (%) de chaque miel et le miel dominant (couleur de la zone).
// Données approximatives et éditables. Fonctions pures → testables.

import { moisEnFleur, type Floraison } from '~/utils/floraisons';

/** Couleur par type de miel (clé = typeMiel du référentiel floraisons). */
export const COULEUR_MIEL: Record<string, string> = {
  acacia: '#aed581',
  lavande: '#7e57c2',
  lavandin: '#b39ddb',
  tournesol: '#fbc02d',
  colza: '#c0ca33',
  châtaignier: '#8d6e63',
  sapin: '#2e7d32',
  tilleul: '#d4e157',
  romarin: '#4db6ac',
  thym: '#00897b',
  bruyère: '#ec407a',
  'bruyère blanche': '#f48fb1',
  sarrasin: '#a1887f',
};

export function couleurMiel(typeMiel: string | null | undefined): string {
  return (typeMiel && COULEUR_MIEL[typeMiel]) || '#cbd5e1';
}

type Intensite = 1 | 2 | 3;

function z(forte: string[], moyenne: string[] = []): Record<string, Intensite> {
  const m: Record<string, Intensite> = {};
  for (const d of moyenne) m[d] = 2;
  for (const d of forte) m[d] = 3;
  return m;
}

/** typeMiel → { codeDépartement → intensité }. Géographie mellifère curée. */
export const MIEL_ZONES: Record<string, Record<string, Intensite>> = {
  acacia: z(
    ['47', '82', '24', '33'],
    [
      '32',
      '81',
      '31',
      '71',
      '89',
      '21',
      '45',
      '37',
      '49',
      '07',
      '26',
      '84',
      '30',
      '16',
      '69',
      '86',
      '79',
    ],
  ),
  lavande: z(['04', '26', '84'], ['05', '07', '83', '30', '06']),
  lavandin: z(['04', '26', '84'], ['05', '30', '11', '83', '13', '07']),
  tournesol: z(
    ['31', '32', '82', '79'],
    [
      '86',
      '17',
      '16',
      '47',
      '81',
      '11',
      '28',
      '36',
      '18',
      '41',
      '49',
      '85',
      '33',
      '09',
      '65',
      '24',
      '87',
    ],
  ),
  colza: z(
    ['28', '45', '51', '10'],
    [
      '89',
      '80',
      '60',
      '27',
      '76',
      '02',
      '52',
      '41',
      '18',
      '21',
      '77',
      '36',
      '08',
      '55',
      '54',
      '88',
      '59',
      '62',
      '50',
      '14',
    ],
  ),
  châtaignier: z(
    ['07', '30', '2A', '2B', '48'],
    [
      '24',
      '19',
      '87',
      '12',
      '81',
      '34',
      '66',
      '09',
      '83',
      '04',
      '43',
      '63',
      '23',
      '15',
      '56',
      '38',
      '26',
      '46',
      '69',
    ],
  ),
  sapin: z(
    ['88', '68', '39', '25'],
    ['67', '90', '70', '74', '73', '05', '04', '38', '01', '63', '15', '43'],
  ),
  tilleul: z(['26', '05'], ['04', '84', '38', '07']),
  romarin: z(['13', '84', '30'], ['34', '11', '04', '83', '06', '66']),
  thym: z(['34', '30', '11'], ['13', '84', '66', '07', '48', '26', '04', '83']),
  bruyère: z(
    ['33', '40', '22'],
    [
      '29',
      '56',
      '87',
      '23',
      '19',
      '15',
      '43',
      '48',
      '24',
      '64',
      '41',
      '18',
      '71',
      '16',
      '17',
      '46',
    ],
  ),
  'bruyère blanche': z(['2A', '2B'], ['83', '13', '30', '34', '06', '66']),
  sarrasin: z(['22', '29', '56', '35'], ['53', '44', '50', '61']),
};

export interface TypePresence {
  typeMiel: string;
  pct: number;
  couleur: string;
  emoji: string | null;
}
export interface DeptBreakdown {
  types: TypePresence[];
  dominant: string;
  couleur: string;
  richesse: number;
}

/**
 * Calcule, pour chaque département, la répartition (%) des miels et le dominant.
 * Poids d'un miel = intensité × potentiel de production (référentiel).
 * Si `moisFiltre` (1-12) est fourni, ne retient que les miels EN FLEUR ce mois-là
 * (d'après la période de floraison du référentiel).
 */
export function calculerZonesDepartements(
  floraisons: Floraison[],
  moisFiltre?: number,
): {
  zones: Record<string, DeptBreakdown>;
  maxRichesse: number;
} {
  const potentiel: Record<string, number> = {};
  const emoji: Record<string, string | null> = {};
  const enFleur: Record<string, boolean> = {};
  for (const f of floraisons) {
    if (!f.typeMiel) continue;
    potentiel[f.typeMiel] = Number(f.potentielProductionKgRuche ?? 10) || 10;
    emoji[f.typeMiel] = f.emoji;
    enFleur[f.typeMiel] = moisFiltre == null || moisEnFleur(f).includes(moisFiltre);
  }

  // dept → typeMiel → poids
  const acc: Record<string, Record<string, number>> = {};
  for (const [typeMiel, depts] of Object.entries(MIEL_ZONES)) {
    // Filtre mois : on ignore les miels hors floraison (et ceux sans période connue).
    if (moisFiltre != null && !enFleur[typeMiel]) continue;
    const p = potentiel[typeMiel] ?? 10;
    for (const [dept, intensite] of Object.entries(depts)) {
      (acc[dept] ??= {})[typeMiel] = intensite * p;
    }
  }

  const zones: Record<string, DeptBreakdown> = {};
  let maxRichesse = 0;
  for (const [dept, poids] of Object.entries(acc)) {
    const total = Object.values(poids).reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    const types: TypePresence[] = Object.entries(poids)
      .map(([typeMiel, p]) => ({
        typeMiel,
        pct: Math.round((p / total) * 100),
        couleur: couleurMiel(typeMiel),
        emoji: emoji[typeMiel] ?? null,
      }))
      .sort((a, b) => b.pct - a.pct);
    const dominant = types[0]!;
    zones[dept] = {
      types,
      dominant: dominant.typeMiel,
      couleur: dominant.couleur,
      richesse: total,
    };
    if (total > maxRichesse) maxRichesse = total;
  }
  return { zones, maxRichesse };
}

/** Opacité de remplissage d'une zone selon sa richesse mellifère (0.35 → 0.8). */
export function opaciteRichesse(richesse: number, maxRichesse: number): number {
  if (maxRichesse <= 0) return 0.5;
  return 0.35 + 0.45 * Math.min(1, richesse / maxRichesse);
}
