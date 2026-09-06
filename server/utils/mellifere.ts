/**
 * Moteur mellifère — pondération des cultures RPG et score d'un emplacement.
 *
 * Principe (inspiré de BeeGIS/ITSAP, réimplémenté en interne) : les parcelles
 * du Registre Parcellaire Graphique autour d'un point sont pondérées par leur
 * intérêt nectarifère/pollinifère et leur distance, puis agrégées en un score
 * 0-100 et un calendrier de floraisons prévisionnel.
 *
 * Coefficients nectar/pollen 0-5 : synthèse des références apicoles usuelles
 * (ITSAP, ADA) — volontairement prudents. Les codes cultures suivent la
 * codification TELEPAC du RPG ; tout code inconnu retombe sur un groupe
 * neutre « Autres cultures ».
 */

export interface CultureInfo {
  label: string;
  groupe: string;
  nectar: number; // 0-5
  pollen: number; // 0-5
  /** Fenêtre de floraison [mois début, mois fin] (1-12), null si sans intérêt */
  floraison: [number, number] | null;
}

const AUTRE: CultureInfo = {
  label: 'Autres cultures',
  groupe: 'autre',
  nectar: 1,
  pollen: 1,
  floraison: null,
};

/** Codes cultures RPG (TELEPAC) → intérêt apicole */
export const CULTURES_RPG: Record<string, CultureInfo> = {
  // Oléagineux mellifères majeurs
  CZH: { label: "Colza d'hiver", groupe: 'colza', nectar: 5, pollen: 4, floraison: [4, 5] },
  CZP: { label: 'Colza de printemps', groupe: 'colza', nectar: 5, pollen: 4, floraison: [5, 6] },
  TRN: { label: 'Tournesol', groupe: 'tournesol', nectar: 4, pollen: 3, floraison: [7, 8] },
  SOJ: { label: 'Soja', groupe: 'legumineuse', nectar: 2, pollen: 2, floraison: [7, 8] },

  // Légumineuses fourragères
  LUZ: { label: 'Luzerne', groupe: 'legumineuse', nectar: 4, pollen: 3, floraison: [6, 9] },
  TRE: { label: 'Trèfle', groupe: 'legumineuse', nectar: 4, pollen: 4, floraison: [6, 9] },
  FVL: { label: 'Féverole', groupe: 'legumineuse', nectar: 3, pollen: 4, floraison: [5, 6] },
  SNE: { label: 'Sainfoin', groupe: 'legumineuse', nectar: 5, pollen: 4, floraison: [5, 7] },

  // Cultures spéciales très mellifères
  SRS: { label: 'Sarrasin', groupe: 'sarrasin', nectar: 4, pollen: 2, floraison: [7, 9] },
  LAV: { label: 'Lavande / lavandin', groupe: 'lavande', nectar: 5, pollen: 2, floraison: [6, 7] },
  PHI: { label: 'Phacélie', groupe: 'phacelie', nectar: 5, pollen: 4, floraison: [6, 8] },

  // Jachères
  J5M: {
    label: 'Jachère mellifère (5 ans -)',
    groupe: 'jachere_mellifere',
    nectar: 5,
    pollen: 5,
    floraison: [6, 8],
  },
  J6M: {
    label: 'Jachère mellifère (6 ans +)',
    groupe: 'jachere_mellifere',
    nectar: 5,
    pollen: 5,
    floraison: [6, 8],
  },
  J5S: { label: 'Jachère (5 ans -)', groupe: 'jachere', nectar: 2, pollen: 2, floraison: [5, 8] },
  J6S: { label: 'Jachère (6 ans +)', groupe: 'jachere', nectar: 2, pollen: 2, floraison: [5, 8] },
  J6P: { label: 'Jachère (6 ans +)', groupe: 'jachere', nectar: 2, pollen: 2, floraison: [5, 8] },

  // Prairies
  PPH: { label: 'Prairie permanente', groupe: 'prairie', nectar: 3, pollen: 3, floraison: [5, 9] },
  PRL: {
    label: 'Prairie en rotation longue',
    groupe: 'prairie',
    nectar: 3,
    pollen: 3,
    floraison: [5, 9],
  },
  PTR: { label: 'Prairie temporaire', groupe: 'prairie', nectar: 2, pollen: 3, floraison: [5, 9] },
  SPH: {
    label: 'Surface pastorale (herbe)',
    groupe: 'prairie',
    nectar: 2,
    pollen: 2,
    floraison: [5, 8],
  },
  SPL: {
    label: 'Surface pastorale (ligneux)',
    groupe: 'prairie',
    nectar: 3,
    pollen: 3,
    floraison: [4, 8],
  },

  // Vergers & fruits
  VRG: { label: 'Verger', groupe: 'verger', nectar: 4, pollen: 4, floraison: [4, 4] },
  PFR: { label: 'Petits fruits', groupe: 'verger', nectar: 3, pollen: 3, floraison: [4, 6] },
  AGR: { label: 'Agrumes', groupe: 'verger', nectar: 4, pollen: 3, floraison: [4, 5] },
  CTG: { label: 'Châtaigneraie', groupe: 'chataignier', nectar: 4, pollen: 4, floraison: [6, 7] },
  NOS: { label: 'Noisetiers', groupe: 'verger', nectar: 0, pollen: 4, floraison: [2, 3] },
  VRC: { label: 'Vigne (raisin de cuve)', groupe: 'vigne', nectar: 0, pollen: 1, floraison: null },
  VRT: { label: 'Vigne (raisin de table)', groupe: 'vigne', nectar: 0, pollen: 1, floraison: null },

  // Céréales & autres grandes cultures (pollen surtout, peu de nectar)
  MIS: { label: 'Maïs', groupe: 'cereale', nectar: 0, pollen: 2, floraison: [7, 8] },
  MIE: { label: 'Maïs ensilage', groupe: 'cereale', nectar: 0, pollen: 2, floraison: [7, 8] },
  BTH: { label: 'Blé tendre d’hiver', groupe: 'cereale', nectar: 0, pollen: 0, floraison: null },
  BTP: {
    label: 'Blé tendre de printemps',
    groupe: 'cereale',
    nectar: 0,
    pollen: 0,
    floraison: null,
  },
  BDH: { label: 'Blé dur d’hiver', groupe: 'cereale', nectar: 0, pollen: 0, floraison: null },
  ORH: { label: 'Orge d’hiver', groupe: 'cereale', nectar: 0, pollen: 0, floraison: null },
  ORP: { label: 'Orge de printemps', groupe: 'cereale', nectar: 0, pollen: 0, floraison: null },
  AVH: { label: 'Avoine d’hiver', groupe: 'cereale', nectar: 0, pollen: 0, floraison: null },
  CHV: { label: 'Chanvre', groupe: 'cereale', nectar: 0, pollen: 3, floraison: [7, 8] },

  // Bois & landes (codes RPG « surfaces boisées »)
  BOP: { label: 'Bois pâturé', groupe: 'foret', nectar: 3, pollen: 3, floraison: [4, 7] },
  BTA: {
    label: 'Taillis à courte rotation',
    groupe: 'foret',
    nectar: 2,
    pollen: 2,
    floraison: [4, 6],
  },
  LDS: { label: 'Landes et parcours', groupe: 'lande', nectar: 3, pollen: 3, floraison: [4, 9] },
};

export function cultureInfo(code: string | null | undefined): CultureInfo {
  if (!code) return AUTRE;
  const c = CULTURES_RPG[code.toUpperCase()];
  if (c) return c;
  // Familles par préfixe quand le code exact n'est pas répertorié
  const up = code.toUpperCase();
  if (up.startsWith('PP') || up.startsWith('PR') || up.startsWith('PT'))
    return {
      ...AUTRE,
      label: `Prairie (${up})`,
      groupe: 'prairie',
      nectar: 2,
      pollen: 3,
      floraison: [5, 9],
    };
  if (up.startsWith('J'))
    return {
      ...AUTRE,
      label: `Jachère (${up})`,
      groupe: 'jachere',
      nectar: 2,
      pollen: 2,
      floraison: [5, 8],
    };
  return { ...AUTRE, label: `Culture ${up}` };
}

// ─── Agrégation & score ──────────────────────────────────────────────────────

export interface ParcelleMellifere {
  code: string;
  surfaceHa: number;
  distanceM: number;
}

export interface CultureAgg {
  code: string;
  label: string;
  groupe: string;
  surfaceHa: number;
  nectar: number;
  pollen: number;
  floraison: [number, number] | null;
  poids: number;
}

export interface AnalyseMellifere {
  score: number;
  surfaceTotaleHa: number;
  surfaceUtileHa: number;
  nbParcelles: number;
  cultures: CultureAgg[];
  calendrier: { mois: number; intensite: number; cultures: string[] }[];
}

const MOIS_RANGE = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function analyserParcelles(parcelles: ParcelleMellifere[]): AnalyseMellifere {
  const parCode = new Map<string, CultureAgg>();
  let surfaceTotale = 0;
  let poidsTotal = 0;

  for (const p of parcelles) {
    const info = cultureInfo(p.code);
    surfaceTotale += p.surfaceHa;
    // Pleine valeur ≤ 1,5 km (zone de butinage privilégiée), demi-valeur au-delà
    const facteurDistance = p.distanceM <= 1500 ? 1 : 0.5;
    const poids = p.surfaceHa * (info.nectar * 0.6 + info.pollen * 0.4) * facteurDistance;
    poidsTotal += poids;

    const agg = parCode.get(p.code.toUpperCase()) ?? {
      code: p.code.toUpperCase(),
      label: info.label,
      groupe: info.groupe,
      surfaceHa: 0,
      nectar: info.nectar,
      pollen: info.pollen,
      floraison: info.floraison,
      poids: 0,
    };
    agg.surfaceHa += p.surfaceHa;
    agg.poids += poids;
    parCode.set(agg.code, agg);
  }

  const cultures = [...parCode.values()].sort(
    (a, b) => b.poids - a.poids || b.surfaceHa - a.surfaceHa,
  );
  const surfaceUtile = cultures
    .filter((c) => c.nectar + c.pollen >= 3)
    .reduce((s, c) => s + c.surfaceHa, 0);

  // Saturation douce : ~120 « points-hectares » ≈ environnement très favorable
  const score = Math.round(100 * (poidsTotal / (poidsTotal + 120)));

  // Calendrier prévisionnel : intensité relative par mois selon les floraisons présentes
  const intensites = MOIS_RANGE.map((mois) => {
    const actives = cultures.filter(
      (c) => c.floraison && mois >= c.floraison[0] && mois <= c.floraison[1] && c.nectar >= 2,
    );
    return {
      mois,
      brut: actives.reduce((s, c) => s + c.poids, 0),
      cultures: actives.slice(0, 4).map((c) => c.label),
    };
  });
  const maxBrut = Math.max(1, ...intensites.map((i) => i.brut));
  const calendrier = intensites.map((i) => ({
    mois: i.mois,
    intensite: Math.round((i.brut / maxBrut) * 100),
    cultures: i.cultures,
  }));

  return {
    score,
    surfaceTotaleHa: Math.round(surfaceTotale * 10) / 10,
    surfaceUtileHa: Math.round(surfaceUtile * 10) / 10,
    nbParcelles: parcelles.length,
    cultures: cultures.slice(0, 12).map((c) => ({
      ...c,
      surfaceHa: Math.round(c.surfaceHa * 10) / 10,
      poids: Math.round(c.poids),
    })),
    calendrier,
  };
}
