// ═══════════════════════════════════════════════════════════════════════════
// RECOMMANDATION DE PRODUITS — calcul déterministe, zéro LLM, zéro suggestion.
//
// La fiche comparative existante DÉFINIT (un tableau : voici les produits).
// Ici on DÉCIDE : à partir des contraintes lisibles dans la question de
// l'apiculteur, on élimine ce qui ne convient pas et on classe le reste.
//
// Trois principes, dans cet ordre :
//
//  1. ON N'INVENTE RIEN. Chaque produit porte des critères factuels (période,
//     présence de couvain, températures, hausses posées, compatibilité bio).
//     Le calcul ne fait que les confronter à la situation décrite.
//
//  2. ON DIT POURQUOI. Toute réponse expose les critères qui ont tranché ET ce
//     qui a été écarté, avec le motif. Une recommandation qu'on ne peut pas
//     contester est une boîte noire — l'inverse de ce qu'on veut vendre.
//
//  3. ON NE TRANCHE PAS SANS CRITÈRE. Sans contrainte lisible dans la question,
//     on ne renvoie RIEN : le comparatif statique répond mieux qu'un classement
//     arbitraire déguisé en conseil.
//
// Module PUR : aucune I/O, aucun accès base. Testable seul.
// ═══════════════════════════════════════════════════════════════════════════

/** Famille chimique — l'alternance d'une année sur l'autre évite les résistances. */
export type FamilleVarroacide = 'amitraze' | 'fluvalinate' | 'oxalique' | 'formique' | 'thymol';

export interface ProduitVarroa {
  id: string;
  nom: string;
  molecule: string;
  famille: FamilleVarroacide;
  /** Mois (1-12) où l'application est pertinente. */
  mois: number[];
  /** Exige l'ABSENCE de couvain (l'acide oxalique), ou s'en accommode. */
  couvain: 'sans' | 'indifferent';
  /** Bornes de température extérieure, quand le produit y est sensible. */
  tempMin?: number;
  tempMax?: number;
  /** Utilisable en apiculture biologique. */
  bio: boolean;
  /** Applicable HAUSSES POSÉES — non pour tout ce qui passe dans le miel. */
  haussesPosees: boolean;
  /** Ce qu'il faut savoir avant de l'employer. */
  remarque: string;
}

/**
 * Base des varroacides courants en France. Volontairement RESTREINTE aux
 * produits sous AMM : recommander un traitement non autorisé exposerait
 * l'apiculteur, en plus d'être faux.
 */
export const VARROACIDES: ProduitVarroa[] = [
  {
    id: 'apivar',
    nom: 'Apivar / Apitraz',
    molecule: 'amitraze',
    famille: 'amitraze',
    mois: [7, 8, 9],
    couvain: 'indifferent',
    bio: false,
    haussesPosees: false,
    remarque:
      'lanières posées 6 à 10 semaines après la récolte — la référence en France. À RETIRER en fin de traitement.',
  },
  {
    id: 'apistan',
    nom: 'Apistan',
    molecule: 'fluvalinate',
    famille: 'fluvalinate',
    mois: [7, 8, 9],
    couvain: 'indifferent',
    bio: false,
    haussesPosees: false,
    remarque: 'résistances fréquentes : à éviter en usage répété.',
  },
  {
    id: 'oxalique',
    nom: 'Acide oxalique',
    molecule: 'acide oxalique',
    famille: 'oxalique',
    mois: [11, 12, 1],
    couvain: 'sans',
    bio: true,
    haussesPosees: false,
    remarque:
      'très efficace en UN passage bien placé, hors couvain. Le complément idéal du traitement de fin d’été.',
  },
  {
    id: 'formique',
    nom: 'Acide formique (MAQS…)',
    molecule: 'acide formique',
    famille: 'formique',
    mois: [7, 8, 9],
    couvain: 'indifferent',
    tempMin: 10,
    tempMax: 29,
    bio: true,
    haussesPosees: true,
    remarque:
      'seul à agir DANS le couvain operculé. Action « flash », mais sensible à la chaleur — au-delà de 29 °C, risque pour la reine.',
  },
  {
    id: 'thymol',
    nom: 'Thymol (Apiguard, Apilife Var…)',
    molecule: 'thymol',
    famille: 'thymol',
    mois: [8, 9],
    couvain: 'indifferent',
    tempMin: 15,
    bio: true,
    haussesPosees: false,
    remarque: 'doux, mais son efficacité dépend étroitement de la température.',
  },
];

/** Situation décrite par l'apiculteur. Tout est optionnel : on ne devine pas. */
export interface Criteres {
  mois?: number;
  /** L'apiculteur signale une colonie sans couvain (hiver, blocage de ponte). */
  sansCouvain?: boolean;
  temperature?: number;
  bio?: boolean;
  haussesPosees?: boolean;
}

export interface Ecarte {
  produit: ProduitVarroa;
  /** Le critère qui l'élimine, en clair — jamais un code. */
  motif: string;
}

export interface Recommandation {
  retenus: ProduitVarroa[];
  ecartes: Ecarte[];
  /** Les critères effectivement lus dans la question, en clair. */
  criteresLus: string[];
}

const MOIS_NOM = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/**
 * Confronte la base aux critères. PURE et totalement explicable : chaque
 * élimination porte son motif, et l'ordre des retenus est stable (ordre de la
 * base), jamais un score opaque.
 *
 * Retourne `null` si AUCUN critère n'est exploitable — on préfère alors laisser
 * répondre le comparatif statique plutôt que de maquiller un tri en conseil.
 */
export function recommanderVarroacide(c: Criteres): Recommandation | null {
  const criteresLus: string[] = [];
  if (c.mois) criteresLus.push(`saison : ${MOIS_NOM[c.mois - 1]}`);
  if (c.sansCouvain) criteresLus.push('colonie sans couvain');
  if (c.temperature !== undefined) criteresLus.push(`${c.temperature} °C`);
  if (c.bio) criteresLus.push('conduite biologique');
  if (c.haussesPosees) criteresLus.push('hausses encore posées');
  if (criteresLus.length === 0) return null;

  const retenus: ProduitVarroa[] = [];
  const ecartes: Ecarte[] = [];

  for (const p of VARROACIDES) {
    let motif: string | null = null;

    if (c.bio && !p.bio) {
      motif = 'non utilisable en apiculture biologique';
    } else if (c.haussesPosees && !p.haussesPosees) {
      motif = 'interdit hausses posées — la molécule passerait dans le miel';
    } else if (c.sansCouvain === false && p.couvain === 'sans') {
      motif = 'exige une colonie sans couvain';
    } else if (c.mois && !p.mois.includes(c.mois)) {
      motif = `hors période (plutôt ${p.mois.map((m) => MOIS_NOM[m - 1]).join(', ')})`;
    } else if (
      c.temperature !== undefined &&
      p.tempMin !== undefined &&
      c.temperature < p.tempMin
    ) {
      motif = `demande au moins ${p.tempMin} °C`;
    } else if (
      c.temperature !== undefined &&
      p.tempMax !== undefined &&
      c.temperature > p.tempMax
    ) {
      motif = `à éviter au-delà de ${p.tempMax} °C`;
    }

    if (motif) ecartes.push({ produit: p, motif });
    else retenus.push(p);
  }

  return { retenus, ecartes, criteresLus };
}

/**
 * Met la recommandation en français. Le format expose TOUJOURS les critères lus
 * et les motifs d'exclusion : c'est ce qui distingue un calcul d'une opinion.
 */
export function rendreRecommandation(r: Recommandation): string {
  const lignes: string[] = [
    `**Ce que je lis dans ta situation** : ${r.criteresLus.join(' · ')}.`,
    '',
  ];

  if (r.retenus.length === 0) {
    lignes.push(
      "Avec ces contraintes, **aucun varroacide de ma base ne convient**. Je préfère te le dire plutôt que d'en pousser un à côté de la plaque — revois la période, ou attends une fenêtre de température.",
    );
  } else {
    lignes.push(
      r.retenus.length === 1
        ? '**Ce qui convient ici :**'
        : '**Ce qui convient ici**, dans l’ordre :',
    );
    for (const p of r.retenus) lignes.push(`- **${p.nom}** (${p.molecule}) — ${p.remarque}`);
  }

  if (r.ecartes.length > 0) {
    lignes.push('', '**Écartés, et pourquoi :**');
    for (const e of r.ecartes) lignes.push(`- ${e.produit.nom} — ${e.motif}`);
  }

  lignes.push(
    '',
    "_Repéré par mes règles, pas par une intuition._ Deux constantes quoi qu'il arrive : uniquement des produits avec **AMM**, et **alterner les familles** d'une année sur l'autre pour éviter les résistances.",
  );
  return lignes.join('\n');
}

// ─── Lecture des critères dans la question ──────────────────────────────────

const MOIS_MOTS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

/** Saisons nommées → mois représentatif, quand l'apiculteur ne date pas précisément. */
const SAISONS: Array<[RegExp, number]> = [
  [/\bapres (la )?recolte\b|\bfin d ?ete\b|\bfin ete\b/, 8],
  [/\bhiver\b|\bhivernage\b/, 12],
  [/\bprintemps\b/, 4],
  [/\bete\b/, 7],
  [/\bautomne\b/, 10],
];

/**
 * Extrait les contraintes d'une question DÉJÀ normalisée. Ne devine JAMAIS :
 * un critère absent reste absent, et c'est ce qui permet à
 * `recommanderVarroacide` de refuser de trancher.
 */
export function lireCriteres(norm: string, moisCourant?: number): Criteres {
  const c: Criteres = {};

  for (const [mot, m] of Object.entries(MOIS_MOTS)) {
    // Bornes de mot OBLIGATOIRES : en simple `includes`, « MAIntenant »
    // contient « mai » et datait la question de mai. Même piège que le
    // déclencheur « vent » qui attrapait « vente ».
    if (new RegExp(`\\b${mot}\\b`).test(norm)) {
      c.mois = m;
      break;
    }
  }
  if (c.mois === undefined) {
    for (const [re, m] of SAISONS) {
      if (re.test(norm)) {
        c.mois = m;
        break;
      }
    }
  }
  // « maintenant », « en ce moment » → le mois réel, fourni par l'appelant.
  if (
    c.mois === undefined &&
    moisCourant &&
    /\bmaintenant\b|\ben ce moment\b|\baujourd hui\b/.test(norm)
  ) {
    c.mois = moisCourant;
  }

  if (/\bsans couvain\b|\bhors couvain\b|\bpas de couvain\b/.test(norm)) c.sansCouvain = true;
  else if (/\bavec couvain\b|\bil y a du couvain\b|\ben pleine ponte\b/.test(norm))
    c.sansCouvain = false;

  // « il fait 12 degrés », « 12 °C », « 12 degres »
  const temp = norm.match(/(-?\d{1,2})\s*(?:degres?|deg|c)\b/);
  if (temp?.[1]) c.temperature = Number(temp[1]);

  if (/\bbio\b|\bbiologique\b|\bnaturel\b/.test(norm)) c.bio = true;
  if (/\bhausses? (encore )?pose/.test(norm) || /\bavec les hausses\b/.test(norm)) {
    c.haussesPosees = true;
  }

  return c;
}

/** La question porte-t-elle sur le CHOIX d'un varroacide ? */
export function viseVarroacide(norm: string): boolean {
  const parleVarroa = /\bvarroa/.test(norm) || VARROACIDES.some((p) => norm.includes(p.id));
  // « quoi » NU est trop large : « le varroa c'est quoi » est une DEMANDE DE
  // DÉFINITION, pas de conseil. On exige une formulation de choix.
  const demandeChoix =
    /\bquel\b|\bconseil|\bpreconis|\brecommand/.test(norm) ||
    /\bje traite\b|\btraiter\b|\btraitement\b/.test(norm) ||
    /\bavec quoi\b|\bquoi utiliser\b/.test(norm);
  return parleVarroa && demandeChoix;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOURRISSEMENT — même patron : des critères factuels, un calcul, une explication.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que l'apiculteur cherche à obtenir. C'est le critère qui tranche vraiment. */
export type ButNourrissement = 'stimuler' | 'reserves' | 'depanner';

export interface ProduitNourrissement {
  id: string;
  nom: string;
  mois: number[];
  buts: ButNourrissement[];
  /** En dessous, les abeilles ne descendent plus prendre un liquide. */
  tempMin?: number;
  remarque: string;
}

export const NOURRISSEMENTS: ProduitNourrissement[] = [
  {
    id: 'sirop-leger',
    nom: 'Sirop léger (50/50)',
    mois: [2, 3, 4, 5],
    buts: ['stimuler'],
    tempMin: 12,
    remarque:
      'imite une miellée et relance la ponte au printemps. À doses modérées : trop de sirop bloque la place du couvain.',
  },
  {
    id: 'sirop-lourd',
    nom: 'Sirop lourd (70/30)',
    mois: [8, 9, 10],
    buts: ['reserves'],
    tempMin: 12,
    remarque:
      'peu d’eau à évaporer : les abeilles le stockent vite, c’est le nourrissement d’automne pour passer l’hiver.',
  },
  {
    id: 'candi',
    nom: 'Candi (pâte sucrée)',
    mois: [11, 12, 1, 2],
    buts: ['depanner'],
    remarque:
      'solide, consommable par temps froid quand la grappe ne descend plus. Le secours d’hiver, pas une méthode de constitution de réserves.',
  },
  {
    id: 'pate-proteinee',
    nom: 'Pâte protéinée (substitut de pollen)',
    mois: [2, 3, 4],
    buts: ['stimuler'],
    remarque:
      'apporte les protéines qui manquent quand le pollen tarde — c’est le couvain qu’on nourrit, pas les réserves.',
  },
];

export interface CriteresNourrissement {
  mois?: number;
  but?: ButNourrissement;
  temperature?: number;
}

export interface RecommandationNourrissement {
  retenus: ProduitNourrissement[];
  ecartes: Array<{ produit: ProduitNourrissement; motif: string }>;
  criteresLus: string[];
}

const BUT_LIBELLE: Record<ButNourrissement, string> = {
  stimuler: 'stimuler la ponte',
  reserves: 'constituer les réserves d’hiver',
  depanner: 'dépanner une colonie à court',
};

/** Même contrat que pour les varroacides : `null` si rien n'est exploitable. */
export function recommanderNourrissement(
  c: CriteresNourrissement,
): RecommandationNourrissement | null {
  const criteresLus: string[] = [];
  if (c.mois) criteresLus.push(`saison : ${MOIS_NOM[c.mois - 1]}`);
  if (c.but) criteresLus.push(`objectif : ${BUT_LIBELLE[c.but]}`);
  if (c.temperature !== undefined) criteresLus.push(`${c.temperature} °C`);
  if (criteresLus.length === 0) return null;

  const retenus: ProduitNourrissement[] = [];
  const ecartes: Array<{ produit: ProduitNourrissement; motif: string }> = [];

  for (const p of NOURRISSEMENTS) {
    let motif: string | null = null;
    if (c.but && !p.buts.includes(c.but)) {
      motif = `sert plutôt à ${p.buts.map((b) => BUT_LIBELLE[b]).join(' ou ')}`;
    } else if (c.mois && !p.mois.includes(c.mois)) {
      motif = `hors saison (plutôt ${p.mois.map((m) => MOIS_NOM[m - 1]).join(', ')})`;
    } else if (
      c.temperature !== undefined &&
      p.tempMin !== undefined &&
      c.temperature < p.tempMin
    ) {
      motif = `liquide : en dessous de ${p.tempMin} °C les abeilles ne descendent plus le prendre`;
    }
    if (motif) ecartes.push({ produit: p, motif });
    else retenus.push(p);
  }
  return { retenus, ecartes, criteresLus };
}

/** Lit l'objectif de nourrissement. N'invente rien si la question ne le dit pas. */
export function lireCriteresNourrissement(
  norm: string,
  moisCourant?: number,
): CriteresNourrissement {
  const base = lireCriteres(norm, moisCourant);
  const c: CriteresNourrissement = { mois: base.mois, temperature: base.temperature };
  if (/\bstimul|\brelancer\b|\bponte\b|\bdemarrage\b/.test(norm)) c.but = 'stimuler';
  else if (/\breserve|\bhivernage\b|\bpasser l hiver\b|\bavant l hiver\b/.test(norm))
    c.but = 'reserves';
  else if (/\bdepann|\ba court\b|\bfamine\b|\bplus rien\b|\burgence\b/.test(norm))
    c.but = 'depanner';
  return c;
}

/** La question porte-t-elle sur le CHOIX d'un nourrissement ? */
export function viseNourrissement(norm: string): boolean {
  const parle = /\bnourri|\bnourrissement\b|\bsirop\b|\bcandi\b/.test(norm);
  const choix =
    /\bquel\b|\bconseil|\bpreconis|\brecommand|\bdifference\b|\bou\b/.test(norm) ||
    /\bje nourris\b|\bnourrir\b/.test(norm);
  return parle && choix;
}

export function rendreRecommandationNourrissement(r: RecommandationNourrissement): string {
  const lignes = [`**Ce que je lis dans ta situation** : ${r.criteresLus.join(' · ')}.`, ''];
  if (r.retenus.length === 0) {
    lignes.push(
      'Avec ces contraintes, **rien ne convient vraiment** dans ce que je connais. Dis-m’en un peu plus sur ce que tu cherches à obtenir.',
    );
  } else {
    lignes.push('**Ce qui convient ici :**');
    for (const p of r.retenus) lignes.push(`- **${p.nom}** — ${p.remarque}`);
  }
  if (r.ecartes.length > 0) {
    lignes.push('', '**Écartés, et pourquoi :**');
    for (const e of r.ecartes) lignes.push(`- ${e.produit.nom} — ${e.motif}`);
  }
  lignes.push('', '_Repéré par mes règles, pas par une intuition._');
  return lignes.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES DE RUCHES — le choix se fait sur l'USAGE, jamais sur une préférence.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que l'apiculteur veut en faire. C'est cela qui départage, pas la mode. */
export type UsageRuche = 'production' | 'transhumance' | 'naturel' | 'menager-le-dos' | 'debuter';

export interface TypeRuche {
  id: string;
  nom: string;
  usages: UsageRuche[];
  /** Ce qui la disqualifie ailleurs — dit franchement. */
  limite: string;
  remarque: string;
}

export const TYPES_RUCHES: TypeRuche[] = [
  {
    id: 'dadant',
    nom: 'Dadant 10 cadres',
    usages: ['production', 'debuter'],
    limite: 'corps lourd et hausses pleines à porter',
    remarque:
      'la référence en France : matériel, cadres et cire se trouvent partout, et tout le voisinage saura t’aider.',
  },
  {
    id: 'langstroth',
    nom: 'Langstroth',
    usages: ['production', 'transhumance'],
    limite: 'moins répandue en France que la Dadant',
    remarque:
      'éléments interchangeables corps/hausse et standard mondial : c’est ce qui la rend commode à déplacer et à manipuler en nombre.',
  },
  {
    id: 'warre',
    nom: 'Warré',
    usages: ['naturel'],
    limite: 'récoltes plus faibles et suivi sanitaire malaisé',
    remarque:
      'conduite proche du naturel, peu d’interventions, on ajoute par le bas. Séduisante, mais elle complique le contrôle du varroa.',
  },
  {
    id: 'kenyane',
    nom: 'Kenyane (ruche horizontale)',
    usages: ['naturel', 'menager-le-dos'],
    limite: 'peu de matériel du commerce, récolte modeste',
    remarque:
      'tout est à hauteur, rien de lourd à soulever : c’est LE choix quand le dos ne suit plus.',
  },
  {
    id: 'voirnot',
    nom: 'Voirnot',
    usages: ['production'],
    limite: 'moins courante, matériel plus rare',
    remarque: 'corps carré qui hiverne bien en région froide, grappe mieux ramassée.',
  },
];

export interface RecommandationRuche {
  retenus: TypeRuche[];
  ecartes: Array<{ produit: TypeRuche; motif: string }>;
  criteresLus: string[];
}

const USAGE_LIBELLE: Record<UsageRuche, string> = {
  production: 'produire du miel',
  transhumance: 'transhumer',
  naturel: 'une conduite proche du naturel',
  'menager-le-dos': 'ménager ton dos',
  debuter: 'débuter',
};

export function recommanderRuche(usage?: UsageRuche): RecommandationRuche | null {
  if (!usage) return null;
  const retenus: TypeRuche[] = [];
  const ecartes: Array<{ produit: TypeRuche; motif: string }> = [];
  for (const r of TYPES_RUCHES) {
    if (r.usages.includes(usage)) retenus.push(r);
    else ecartes.push({ produit: r, motif: r.limite });
  }
  return { retenus, ecartes, criteresLus: [`usage : ${USAGE_LIBELLE[usage]}`] };
}

/** Lit l'usage visé. Sans usage explicite, on ne recommande pas — on définit. */
export function lireUsageRuche(norm: string): UsageRuche | undefined {
  if (/\btranshum/.test(norm)) return 'transhumance';
  if (/\bmon dos\b|\bmal au dos\b|\bporter\b|\bsoulever\b|\blourd\b/.test(norm))
    return 'menager-le-dos';
  if (/\bnaturel|\bbio\b|\bsans intervention\b/.test(norm)) return 'naturel';
  if (/\bdebut|\bcommence|\bpremiere ruche\b/.test(norm)) return 'debuter';
  if (/\bproduction\b|\bproduire\b|\brendement\b|\bmiel\b/.test(norm)) return 'production';
  return undefined;
}

export function viseTypeRuche(norm: string): boolean {
  const parle =
    /\bquel(le)? (type de )?ruche\b|\bmodele de ruche\b/.test(norm) ||
    TYPES_RUCHES.some((r) => norm.includes(r.id));
  return parle && /\bquel|\bconseil|\bpreconis|\brecommand|\bou\b|\bpour\b/.test(norm);
}

export function rendreRecommandationRuche(r: RecommandationRuche): string {
  const lignes = [`**Ce que je lis dans ta situation** : ${r.criteresLus.join(' · ')}.`, ''];
  lignes.push(r.retenus.length === 1 ? '**Ce qui convient ici :**' : '**Ce qui convient ici :**');
  for (const p of r.retenus) lignes.push(`- **${p.nom}** — ${p.remarque}`);
  if (r.ecartes.length > 0) {
    lignes.push('', '**Moins indiquées pour cet usage :**');
    for (const e of r.ecartes) lignes.push(`- ${e.produit.nom} — ${e.motif}`);
  }
  lignes.push(
    '',
    '_Repéré par mes règles, pas par une intuition._ Le vrai critère, c’est ce que tu veux en faire — pas la mode.',
  );
  return lignes.join('\n');
}
