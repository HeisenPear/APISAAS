/**
 * Score de santé d'une colonie (0–100) — moteur prédictif.
 *
 * Le score combine :
 *   1. Les CONSTANTES VITALES du dernier contrôle (reine/ponte, population,
 *      couvain, réserves, varroa, comportement) — pondérées selon leur poids
 *      réel sur la survie de la colonie (littérature apicole, seuils ITSAP).
 *   2. Des PÉNALITÉS sanitaires (maladies, signes d'essaimage).
 *   3. Des ÉVÉNEMENTS récents (chaque intervention a une incidence) : un
 *      essaimage ou une perte de reine effondre le score, mais un
 *      ré-encagement / une reprise de ponte le fait remonter ; un traitement
 *      varroa ou un nourrissement améliorent la trajectoire.
 *   4. Des SURCHARGES d'état (colonie morte = 0, orpheline/essaimée plafonnée
 *      tant que la reine n'est pas rétablie).
 *   5. Une DÉCOTE de fraîcheur : une donnée ancienne est moins fiable.
 *
 * Barème des constantes vitales (somme = 100 sur une colonie idéale) :
 *   reine & ponte 24 · population 22 · couvain 16 · réserves 14 · varroa 18 ·
 *   comportement 6.
 */

// ── Pondérations des constantes vitales ───────────────────────────────────────
const W_REINE = 24;
const W_FORCE = 22;
const W_COUVAIN = 16;
const W_RESERVES = 14;
const W_VARROA = 18;
const W_COMPORTEMENT = 6;

// ── Fenêtres temporelles des événements (jours) ───────────────────────────────
const FENETRE_REPRISE = 45; // requeening / reprise de ponte pris en compte
const FENETRE_TRAITEMENT = 42; // efficacité d'un traitement varroa
const FENETRE_NOURRISSEMENT = 21;
const FENETRE_DIVISION = 21;
const FENETRE_TRANSVASEMENT = 14;

// ── Plafonds d'état (tant que la reine n'est pas rétablie) ─────────────────────
const PLAFOND_ESSAIMEE = 30;
const PLAFOND_ORPHELINE = 30;
const PLAFOND_REPRISE = 60; // reine réintroduite mais ponte non confirmée

export interface InspectionRow {
  rucheId: string;
  numero: string;
  rucherId: string;
  statut: string;
  qualiteReine: string | null;
  dateVisite: Date | string | null;
  forceColonie: number | null;
  couvain: number | null;
  reserves: number | null;
  reineVue: boolean | null;
  varroa: number | null;
  comportement: string | null;
  signeEssaimage: boolean | null;
  maladieObservee: string | null;
  // Optionnels (ignorés par le modèle simple, utilisés par le modèle enrichi)
  rucherNom?: string | null;
  celluleRoyale?: boolean | null;
}

/** Événement récent ayant une incidence sur l'état de la colonie. */
export interface EvenementSante {
  /** type d'intervention ou d'événement reine */
  type: string;
  date: Date | string;
  /** ponte / couvain frais constaté (reprise) */
  ponteConfirmee?: boolean;
  /** événement de mortalité (sanitaire) */
  mortalite?: boolean;
  /** sévérité 0..1 pour un événement sanitaire */
  severite?: number;
}

export interface HiveScoreInput extends InspectionRow {
  evenements?: EvenementSante[];
  /** date de référence (tests) */
  aujourdhui?: Date;
}

export interface HiveScoreResult {
  /** null = ruche non comptabilisée (vendue / fusionnée) */
  score: number | null;
  niveau: string;
  couleur: string;
  confiance: 'haute' | 'moyenne' | 'faible';
  raisons: string[];
}

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}
function joursEntre(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}
function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Composante varroa (% phorétique). Seuils ITSAP : 1 % bas, 3 % traitement, 5 % critique. */
function composanteVarroa(pct: number): number {
  if (pct <= 1) return W_VARROA;
  if (pct <= 2) return W_VARROA * 0.85;
  if (pct <= 3) return W_VARROA * 0.6;
  if (pct <= 5) return W_VARROA * 0.33;
  return 0;
}

/** Qualité de reine (0..1) à partir du champ ruche + observations. */
function scoreReine(row: InspectionRow): number {
  const map: Record<string, number> = {
    excellente: 1,
    bonne: 0.85,
    moyenne: 0.6,
    faible: 0.35,
    absente: 0,
  };
  let s = row.qualiteReine && row.qualiteReine in map ? map[row.qualiteReine]! : -1;
  // Inconnue → on déduit des observations
  if (s < 0) {
    if (row.reineVue) s = 0.75;
    else if (row.couvain != null && row.couvain >= 2)
      s = 0.7; // couvain frais = reine pondeuse
    else s = 0.45;
  } else {
    // Le couvain frais confirme une reine pondeuse (relève le plancher)
    if (row.couvain != null && row.couvain >= 3) s = Math.max(s, 0.8);
    if (row.reineVue) s = Math.max(s, 0.7);
  }
  return s;
}

/** Pénalité maladie selon le libellé observé. */
function penaliteMaladie(maladie: string | null): { pts: number; raison?: string } {
  if (!maladie || maladie.trim() === '') return { pts: 0 };
  const m = maladie.toLowerCase();
  if (m.includes('loque')) return { pts: 45, raison: 'Loque détectée (maladie à déclaration)' };
  if (m.includes('nosem') || m.includes('nosém')) return { pts: 18, raison: 'Nosémose' };
  if (m.includes('paralys') || m.includes('virus'))
    return { pts: 15, raison: 'Virose / paralysie' };
  if (m.includes('mycos') || m.includes('plâtr') || m.includes('platr') || m.includes('ascos'))
    return { pts: 10, raison: 'Couvain plâtré (mycose)' };
  if (m.includes('varroos')) return { pts: 12, raison: 'Varroose clinique' };
  return { pts: 20, raison: `Maladie observée : ${maladie}` };
}

const TYPES_REQUEENAGE = ['introduction', 'remplacement', 'reine', 'transvasement', 'division'];

/**
 * Calcul complet et explicable du score d'une colonie.
 */
export function computeHiveScore(input: HiveScoreInput): HiveScoreResult {
  const now = input.aujourdhui ?? new Date();
  const raisons: string[] = [];

  // 1) Surcharges d'état terminales
  if (input.statut === 'morte') {
    return {
      score: 0,
      niveau: 'Critique',
      couleur: scoreColor(0),
      confiance: 'haute',
      raisons: ['Colonie morte'],
    };
  }
  if (input.statut === 'vendue' || input.statut === 'fusionnee') {
    return {
      score: null,
      niveau: '—',
      couleur: '#A8A29E',
      confiance: 'haute',
      raisons: ['Ruche non comptabilisée'],
    };
  }

  const evs = (input.evenements ?? [])
    .map((e) => ({ ...e, j: joursEntre(now, toDate(e.date)) }))
    .filter((e) => e.j >= 0);

  const recent = (types: string[], fenetre: number) =>
    evs.some((e) => types.includes(e.type) && e.j <= fenetre);

  const traitementRecent = recent(['varroa', 'traitement'], FENETRE_TRAITEMENT);
  const nourriRecent = recent(['nourrissement'], FENETRE_NOURRISSEMENT);
  const divisionRecente = recent(['division'], FENETRE_DIVISION);
  const transvasementRecent = recent(['transvasement'], FENETRE_TRANSVASEMENT);
  const sanitaireMortalite = evs.find((e) => e.type === 'sanitaire' && e.mortalite && e.j <= 60);
  const requeenRecent = evs.some(
    (e) => TYPES_REQUEENAGE.includes(e.type) && e.j <= FENETRE_REPRISE,
  );
  const ponteReprise =
    evs.some((e) => (e.ponteConfirmee || e.type === 'ponte_vue') && e.j <= FENETRE_REPRISE) ||
    (input.couvain != null && input.couvain >= 3);
  const essaimageRecent = recent(['essaimage'], FENETRE_REPRISE);
  const perteReineRecente = recent(['perte'], FENETRE_REPRISE);

  const aControle = !!input.dateVisite;
  let base: number;
  let confiance: HiveScoreResult['confiance'] = 'haute';

  if (!aControle) {
    // Aucun contrôle saisi → estimation prudente selon l'état déclaré
    const fallback: Record<string, number> = {
      active: 60,
      faible: 30,
      orpheline: 22,
      essaimee: 18,
    };
    base = fallback[input.statut] ?? 50;
    confiance = 'faible';
    raisons.push('Aucun contrôle saisi — estimation à confirmer');
  } else {
    // 2) Constantes vitales
    const reine = scoreReine(input) * W_REINE;
    // Force saisie sur 1→4 (validation controleSchema + UI « 4 = très forte »),
    // stockée brute → échelle /4 (et non /5, qui plafonnait toute colonie saine à 80 %).
    const force =
      input.forceColonie != null ? (clamp(input.forceColonie, 1, 4) / 4) * W_FORCE : W_FORCE * 0.5;
    const couvain =
      input.couvain != null ? (clamp(input.couvain, 0, 5) / 5) * W_COUVAIN : W_COUVAIN * 0.5;
    let reserves =
      input.reserves != null ? (clamp(input.reserves, 1, 5) / 5) * W_RESERVES : W_RESERVES * 0.5;
    if (nourriRecent) {
      reserves = Math.max(reserves, W_RESERVES * 0.6); // nourrissement = réserves sécurisées
      raisons.push('Nourrissement récent');
    }
    let varroa = input.varroa != null ? composanteVarroa(input.varroa) : W_VARROA * 0.6;
    if (traitementRecent && input.varroa != null && input.varroa > 1) {
      varroa = Math.min(W_VARROA, varroa + W_VARROA * 0.4); // traitement en cours = pression qui baisse
      raisons.push('Traitement varroa en cours');
    }
    const comp: Record<string, number> = {
      calme: W_COMPORTEMENT,
      normale: W_COMPORTEMENT * 0.85,
      nerveuse: W_COMPORTEMENT * 0.5,
      agitee: W_COMPORTEMENT * 0.5,
      agressive: W_COMPORTEMENT * 0.17,
    };
    const comportement =
      input.comportement && input.comportement in comp
        ? comp[input.comportement]!
        : W_COMPORTEMENT * 0.7;

    base = reine + force + couvain + reserves + varroa + comportement;

    // 3) Pénalités sanitaires
    if (input.varroa != null && input.varroa > 5) raisons.push('Infestation varroa critique');
    const mal = penaliteMaladie(input.maladieObservee);
    if (mal.pts > 0) {
      base -= mal.pts;
      if (mal.raison) raisons.push(mal.raison);
    }
    if (input.signeEssaimage) {
      base -= 10;
      raisons.push("Signes d'essaimage");
    }
    // Cellules royales : risque d'essaimage hors contexte orphelin
    if (input.celluleRoyale && input.statut !== 'orpheline') base -= 5;
  }

  // 4) Incidences des événements
  if (divisionRecente) {
    base -= 8;
    raisons.push('Division récente (population réduite)');
  }
  if (transvasementRecent) base -= 5;
  if (sanitaireMortalite) {
    base -= Math.round(25 + (sanitaireMortalite.severite ?? 0.4) * 20);
    raisons.push('Mortalité constatée');
  }

  // 5) Plafonds d'état (reine non rétablie)
  let plafond = 100;
  const essaimee = input.statut === 'essaimee' || essaimageRecent;
  const orpheline = input.statut === 'orpheline' || perteReineRecente;
  if (essaimee || orpheline) {
    if (ponteReprise) {
      raisons.push('Reprise de ponte confirmée');
    } else if (requeenRecent) {
      plafond = PLAFOND_REPRISE;
      raisons.push('Reine réintroduite — reprise en cours');
    } else {
      plafond = essaimee ? PLAFOND_ESSAIMEE : PLAFOND_ORPHELINE;
      raisons.push(
        essaimee ? 'Essaimage récent — colonie à reconstituer' : 'Colonie orpheline — sans reine',
      );
    }
  }

  // 6) Décote de fraîcheur
  if (aControle && input.dateVisite) {
    const jours = joursEntre(now, toDate(input.dateVisite));
    if (jours > 30) {
      base -= Math.min(15, ((jours - 30) / 7) * 2);
      confiance = jours > 60 ? 'faible' : 'moyenne';
      raisons.push(`Dernier contrôle il y a ${jours} jours`);
    }
  }

  const score = clamp(Math.round(Math.min(base, plafond)));
  if (raisons.length === 0) raisons.push('Colonie en bon état');

  return { score, niveau: scoreLabel(score), couleur: scoreColor(score), confiance, raisons };
}

/**
 * Rétro-compatible : renvoie le score numérique (0 si non comptabilisée).
 * Utilisé par les listes / dashboard qui ne disposent que du snapshot.
 */
export function computeScore(row: InspectionRow): number {
  return computeHiveScore(row).score ?? 0;
}

/**
 * Santé d'un rucher = état global de ses ruches comptabilisées.
 * Moyenne des scores (les ruches mortes comptent 0 ; vendues/fusionnées exclues).
 */
export function computeRucherScore(hives: { score: number | null; statut?: string }[]): {
  score: number | null;
  nbRuches: number;
  nbCritiques: number;
} {
  const comptees = hives.filter((h) => h.score != null) as { score: number; statut?: string }[];
  if (comptees.length === 0) return { score: null, nbRuches: 0, nbCritiques: 0 };
  const somme = comptees.reduce((a, h) => a + h.score, 0);
  const nbCritiques = comptees.filter((h) => h.score < 40).length;
  return {
    score: Math.round(somme / comptees.length),
    nbRuches: comptees.length,
    nbCritiques,
  };
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Correct';
  if (score >= 20) return 'Fragile';
  return 'Critique';
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#9a8536';
  if (score >= 40) return '#F5A623';
  return '#D93025';
}
