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
