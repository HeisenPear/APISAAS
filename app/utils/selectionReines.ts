/**
 * Index de sélection des reines — évaluation objective multi-critères.
 *
 * v1 (ici) : **index phénotypique pondéré**. Chaque trait mesuré est normalisé
 * sur une échelle 0–100 « plus c'est haut, mieux c'est », puis on fait une
 * moyenne pondérée des traits réellement renseignés (les traits manquants ne
 * pénalisent pas — les poids sont renormalisés sur les traits présents).
 *
 * Évolution vers un vrai BLUP (v2) : le BLUP estime une *valeur génétique*
 * (breeding value) en standardisant chaque trait contre son **groupe de
 * contemporains** (z-score intra-saison/cheptel) puis en remontant le
 * **pedigree** (`reineMereId`) pour séparer génétique et environnement.
 * Les données nécessaires existent déjà en base (saison, reineMereId, lignée).
 * La fonction accepte donc dès maintenant un `population` optionnel (moyenne +
 * écart-type par trait) : c'est le point d'accroche où la normalisation à
 * échelle fixe sera remplacée par une standardisation contre le groupe de
 * contemporains. Tant qu'il n'est pas fourni, on reste sur l'index phénotypique.
 */

export type TraitKey =
  | 'productiviteMielKg'
  | 'resistanceVarroaPctInfestation'
  | 'hygienismePinTestPct'
  | 'douceur'
  | 'tenueCadre'
  | 'tendanceEssaimage'
  | 'hivernage'
  | 'vigueurPrintemps'
  | 'ponteQualite';

export type TraitScale =
  | { kind: 'bounded'; min: number; max: number }
  /** Trait ouvert (sans plafond naturel) normalisé contre une référence « top exploitation ». */
  | { kind: 'open'; reference: number };

export interface TraitDefinition {
  key: TraitKey;
  label: string;
  shortLabel: string;
  unit: string;
  /** Sens d'amélioration : pour `lower`, une valeur basse est meilleure (varroa, essaimage). */
  direction: 'higher' | 'lower';
  scale: TraitScale;
  /** Poids par défaut dans l'index (la somme des poids vaut 1). */
  weight: number;
}

/**
 * Définition des traits + poids de sélection par défaut.
 * Priorités : production & résistance varroa en tête (enjeux économique et
 * sanitaire), puis comportement (douceur, hygiène), puis conduite (essaimage,
 * hivernage, vigueur, ponte). Somme des poids = 1.00.
 */
export const TRAIT_DEFINITIONS: readonly TraitDefinition[] = [
  {
    key: 'productiviteMielKg',
    label: 'Production de miel',
    shortLabel: 'Production',
    unit: 'kg',
    direction: 'higher',
    scale: { kind: 'open', reference: 40 },
    weight: 0.25,
  },
  {
    key: 'resistanceVarroaPctInfestation',
    label: 'Résistance au varroa',
    shortLabel: 'Varroa',
    unit: '% infestation',
    direction: 'lower',
    scale: { kind: 'bounded', min: 0, max: 100 },
    weight: 0.2,
  },
  {
    key: 'hygienismePinTestPct',
    label: 'Comportement hygiénique (test pin / VSH)',
    shortLabel: 'Hygiène',
    unit: '%',
    direction: 'higher',
    scale: { kind: 'bounded', min: 0, max: 100 },
    weight: 0.12,
  },
  {
    key: 'douceur',
    label: 'Douceur',
    shortLabel: 'Douceur',
    unit: '/10',
    direction: 'higher',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.12,
  },
  {
    key: 'tenueCadre',
    label: 'Tenue au cadre',
    shortLabel: 'Tenue cadre',
    unit: '/10',
    direction: 'higher',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.07,
  },
  {
    key: 'tendanceEssaimage',
    label: 'Non-essaimage',
    shortLabel: 'Essaimage',
    unit: '/10',
    direction: 'lower',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.08,
  },
  {
    key: 'hivernage',
    label: 'Hivernage',
    shortLabel: 'Hivernage',
    unit: '/10',
    direction: 'higher',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.08,
  },
  {
    key: 'vigueurPrintemps',
    label: 'Vigueur de printemps',
    shortLabel: 'Vigueur',
    unit: '/10',
    direction: 'higher',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.05,
  },
  {
    key: 'ponteQualite',
    label: 'Qualité de ponte',
    shortLabel: 'Ponte',
    unit: '/10',
    direction: 'higher',
    scale: { kind: 'bounded', min: 1, max: 10 },
    weight: 0.03,
  },
] as const;

/** Valeurs de traits en entrée (toutes optionnelles — on évalue ce qui est saisi). */
export type TraitValues = Partial<Record<TraitKey, number | null | undefined>>;

export interface SelectionIndexOptions {
  /** Surcharge ponctuelle des poids (par ex. un éleveur qui priorise le varroa). */
  weights?: Partial<Record<TraitKey, number>>;
  /** Référence « top » pour la production (kg) si différente du défaut (40). */
  productiviteReferenceKg?: number;
  /**
   * Point d'accroche BLUP (v2) — statistiques du groupe de contemporains par
   * trait. Quand fourni, la normalisation passe en z-score standardisé contre
   * la population au lieu de l'échelle fixe. Non utilisé en v1 si absent.
   */
  population?: Partial<Record<TraitKey, { mean: number; sd: number }>>;
}

export interface TraitContribution {
  key: TraitKey;
  label: string;
  shortLabel: string;
  unit: string;
  rawValue: number;
  /** Valeur normalisée 0–100 (plus haut = mieux), arrondie. */
  normalized: number;
  /** Poids effectif après renormalisation sur les traits présents (0–1). */
  weightShare: number;
  /** Points apportés à l'index final (= normalized × weightShare). */
  points: number;
}

export interface SelectionIndexResult {
  /** Index 0–100, ou null si aucun trait n'est renseigné. */
  index: number | null;
  /** Part du modèle couverte par les traits saisis (0–1) — fiabilité de l'index. */
  completeness: number;
  contributions: TraitContribution[];
  traitsMissing: { key: TraitKey; label: string }[];
}

const DEF_BY_KEY: Record<TraitKey, TraitDefinition> = Object.fromEntries(
  TRAIT_DEFINITIONS.map((d) => [d.key, d]),
) as Record<TraitKey, TraitDefinition>;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Convertit une valeur brute de trait en score 0–100 « plus haut = mieux ».
 * Retourne null si la valeur est absente / non finie.
 */
export function normalizeTraitValue(
  def: TraitDefinition,
  value: number | null | undefined,
  options: SelectionIndexOptions = {},
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;

  // Seam BLUP : standardisation z-score contre le groupe de contemporains.
  const pop = options.population?.[def.key];
  if (pop && pop.sd > 0) {
    const z = (value - pop.mean) / pop.sd;
    const oriented = def.direction === 'lower' ? -z : z;
    // ±2,5 σ → 0–100, centré sur 50 (≈ percentile lissé).
    return round2(clamp(50 + oriented * 20, 0, 100));
  }

  if (def.scale.kind === 'open') {
    const reference =
      def.key === 'productiviteMielKg' && options.productiviteReferenceKg
        ? options.productiviteReferenceKg
        : def.scale.reference;
    const ratio = reference > 0 ? clamp(value / reference, 0, 1) : 0;
    return round2(ratio * 100);
  }

  const { min, max } = def.scale;
  const span = max - min;
  if (span <= 0) return null;
  const clamped = clamp(value, min, max);
  const ratio = def.direction === 'lower' ? (max - clamped) / span : (clamped - min) / span;
  return round2(ratio * 100);
}

/**
 * Calcule l'index de sélection d'un test de performance.
 * Moyenne pondérée des traits renseignés, poids renormalisés sur les présents.
 */
export function computeSelectionIndex(
  traits: TraitValues,
  options: SelectionIndexOptions = {},
): SelectionIndexResult {
  const present: { def: TraitDefinition; raw: number; normalized: number; weight: number }[] = [];
  const traitsMissing: { key: TraitKey; label: string }[] = [];
  let totalWeight = 0;
  let presentWeight = 0;

  for (const def of TRAIT_DEFINITIONS) {
    const weight = options.weights?.[def.key] ?? def.weight;
    totalWeight += weight;
    const normalized = normalizeTraitValue(def, traits[def.key], options);
    if (normalized === null) {
      traitsMissing.push({ key: def.key, label: def.label });
      continue;
    }
    present.push({ def, raw: Number(traits[def.key]), normalized, weight });
    presentWeight += weight;
  }

  if (present.length === 0 || presentWeight === 0) {
    return { index: null, completeness: 0, contributions: [], traitsMissing };
  }

  // Index calculé sur les parts de poids EXACTES ; l'arrondi n'intervient que
  // sur les champs d'affichage (weightShare, points) pour ne pas dériver.
  const index = round2(
    present.reduce((sum, { normalized, weight }) => sum + normalized * (weight / presentWeight), 0),
  );

  const contributions: TraitContribution[] = present.map(({ def, raw, normalized, weight }) => {
    const weightShare = weight / presentWeight;
    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      unit: def.unit,
      rawValue: raw,
      normalized,
      weightShare: round2(weightShare),
      points: round2(normalized * weightShare),
    };
  });
  const completeness = totalWeight > 0 ? round2(presentWeight / totalWeight) : 0;

  return { index, completeness, contributions, traitsMissing };
}

export interface IndexTier {
  key: 'elite' | 'tres-bonne' | 'bonne' | 'moyenne' | 'reforme';
  label: string;
  /** Token de couleur CSS du design system. */
  color: string;
}

/** Qualifie un index 0–100 en palier lisible (avec couleur du design system). */
export function indexTier(index: number | null): IndexTier | null {
  if (index === null) return null;
  if (index >= 80) return { key: 'elite', label: 'Élite', color: 'var(--honey-deep)' };
  if (index >= 65) return { key: 'tres-bonne', label: 'Très bonne', color: 'var(--sage-deep)' };
  if (index >= 50) return { key: 'bonne', label: 'Bonne', color: 'var(--sage)' };
  if (index >= 35) return { key: 'moyenne', label: 'Moyenne', color: 'var(--clay)' };
  return { key: 'reforme', label: 'À réformer', color: 'var(--clay-deep)' };
}

/** Définition d'un trait par sa clé (helper UI). */
export function getTraitDefinition(key: TraitKey): TraitDefinition {
  return DEF_BY_KEY[key];
}

// ─── Sélection AVANCÉE (Expert) : standardisation population + classement lignées ──

/** Nombre minimal de mesures pour qu'un trait puisse être standardisé. */
export const MIN_CONTEMPORAINS = 3;

/**
 * Statistiques (moyenne, écart-type) par trait sur le groupe de contemporains
 * (= tous les tests du cheptel). Alimente le seam BLUP de `computeSelectionIndex`
 * (`options.population`) : la valeur génétique est alors standardisée (z-score)
 * contre VOS reines plutôt que contre une échelle fixe. Un trait n'est retenu
 * que s'il a au moins `MIN_CONTEMPORAINS` mesures et un écart-type non nul.
 */
export function statistiquesPopulation(
  tests: TraitValues[],
): Partial<Record<TraitKey, { mean: number; sd: number }>> {
  const out: Partial<Record<TraitKey, { mean: number; sd: number }>> = {};
  for (const def of TRAIT_DEFINITIONS) {
    const vals = tests
      .map((t) => t[def.key])
      .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
    if (vals.length < MIN_CONTEMPORAINS) continue;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const sd = Math.sqrt(variance);
    if (sd > 0) out[def.key] = { mean: round2(mean), sd: round2(sd) };
  }
  return out;
}

export interface LigneeClassement {
  ligneeId: string | null;
  nom: string;
  race: string | null;
  /** Index de sélection moyen de la lignée (0–100). */
  indexMoyen: number;
  meilleurIndex: number;
  nbReines: number;
}

/**
 * Classe les lignées par valeur génétique moyenne — « quelles lignées valent
 * le plus », l'argument de vente d'un éleveur. Les reines sans lignée sont
 * regroupées à part.
 */
export function classementLignees(
  reines: {
    ligneeId: string | null;
    ligneeNom: string | null;
    ligneeRace: string | null;
    index: number;
  }[],
): LigneeClassement[] {
  const groups = new Map<
    string,
    { ligneeId: string | null; nom: string; race: string | null; indices: number[] }
  >();
  for (const r of reines) {
    const key = r.ligneeId ?? '__sans__';
    const g = groups.get(key) ?? {
      ligneeId: r.ligneeId,
      nom: r.ligneeNom ?? 'Sans lignée',
      race: r.ligneeRace,
      indices: [],
    };
    g.indices.push(r.index);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({
      ligneeId: g.ligneeId,
      nom: g.nom,
      race: g.race,
      indexMoyen: round2(g.indices.reduce((s, v) => s + v, 0) / g.indices.length),
      meilleurIndex: Math.max(...g.indices),
      nbReines: g.indices.length,
    }))
    .sort((a, b) => b.indexMoyen - a.indexMoyen);
}
