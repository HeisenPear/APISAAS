// ═══════════════════════════════════════════════════════════════════════════
// CORRECTION ORTHOGRAPHIQUE des mots LOGIQUES (déterministe, zéro LLM).
//
// Objectif : qu'une faute sur un mot qui porte le SENS (« oksalique », « varoa »,
// « apivare », « rucher » mal tapé) n'empêche pas Maya de comprendre. On corrige
// AVANT la classification, donc le bénéfice profite aux intentions, au LOT et au
// savoir d'un coup.
//
// Deux barrières, appliquées UNIQUEMENT contre un LEXIQUE CURÉ (mots apicoles +
// mots logiques) → un mot légitime hors lexique n'est JAMAIS transformé, et une
// correction ne peut mener qu'à un mot connu :
//   A. code PHONÉTIQUE FR identique (attrape « oksalique → oxalique », « ks ↔ x »)
//   B. distance d'édition ≤ 1 (attrape la faute d'une lettre « varoa → varroa »)
// + garde-fous : token ≥ 5 lettres, même 1re lettre, écart de longueur borné,
//   nombres et tokens alphanumériques intacts. Module AUTONOME, sans aucun import
//   (le lexique est 100 % CURÉ ci-dessous — on n'aspire PAS les mots-clés du
//   savoir, qui contiennent des verbes courants « utiliser/choisir/comment » et
//   provoqueraient des sur-corrections ; le savoir a sa PROPRE tolérance aux
//   fautes dans rechercherArticles).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vocabulaire logique/commande (racines ≥ 5 lettres) sur lequel la correction est
 * autorisée. Dupliqué volontairement ici (petite liste stable) pour garder ce
 * module autonome — on n'importe pas les registres privés du moteur.
 */
const MOTS_LOGIQUES = [
  'rucher',
  'ruchers',
  'ruche',
  'ruches',
  'colonie',
  'colonies',
  'toutes',
  'controle',
  'controler',
  'comportement',
  'force',
  'faible',
  'faibles',
  'reserves',
  'couvain',
  'reine',
  // « ma ruche est orfeline » : même code phonétique qu'« orpheline » (ph → f),
  // mais le mot manquait au lexique, donc la correction ne pouvait pas aboutir.
  // C'est une des toutes premières inquiétudes d'un débutant (corpus Maya).
  'orphelin',
  'orpheline',
  'visite',
  'visiter',
  'nourrissement',
  'nourrir',
  'nourri',
  'recolte',
  'recolter',
  'traitement',
  'traiter',
  'intervention',
  'pesee',
  'peser',
  'varroa',
  'stock',
  'stocks',
  'facture',
  'factures',
  'finances',
  'meteo',
  'alerte',
  'alertes',
  'rentabilite',
  'transhumance',
  'hausse',
  'hausses',
  'essaim',
  'essaimage',
  'ordonnance',
  'client',
  'clients',
  'apiculture',
  'apprendre',
];

/**
 * Produits / molécules / matériel apicoles (usuels et souvent mal orthographiés).
 * Cœur de la décision produit « focus produits ».
 */
const PRODUITS = [
  'apivar',
  'amitraze',
  'apitraz',
  'apistan',
  'fluvalinate',
  'oxalique',
  'formique',
  'thymol',
  'apiguard',
  'apilifevar',
  'oxybee',
  'varromed',
  'candi',
  'sirop',
  'proteique',
  'pollen',
  'partition',
  'nourrisseur',
  'enfumoir',
  'lanieres',
  'sublimation',
  'degouttement',
  'dadant',
  'langstroth',
  'warre',
  'kenyane',
];

/** Code phonétique FR déterministe (approximatif, suffisant avec la 2e barrière). */
export function codePhonetique(mot: string): string {
  let s = mot;
  s = s.replace(/x/g, 'ks'); // oxalique → oksalique
  s = s.replace(/ph/g, 'f');
  s = s.replace(/qu/g, 'k').replace(/q/g, 'k');
  s = s.replace(/ch/g, 'C'); // son « ch » (placeholder majuscule, stable)
  s = s.replace(/gn/g, 'N'); // son « gn »
  s = s.replace(/eau/g, 'o').replace(/au/g, 'o');
  s = s.replace(/ai/g, 'e').replace(/ei/g, 'e');
  s = s.replace(/ou/g, 'u');
  s = s.replace(/c([eiy])/g, 's$1').replace(/c/g, 'k'); // c doux / dur
  s = s.replace(/g([eiy])/g, 'j$1'); // g doux
  // Déduplication AVANT la règle du s intervocalique : sinon « nourrissement »
  // (ss sourd) et sa faute « nourisement » (s sonore) reçoivent deux codes
  // différents, alors que c'est la MÊME intention. On préfère rapprocher.
  s = s.replace(/(.)\1+/g, '$1');
  s = s.replace(/([aeiou])s([aeiou])/g, '$1z$2'); // s intervocalique → z
  s = s.replace(/y/g, 'i');
  s = s.replace(/h/g, ''); // h muet (ch/ph déjà traités)
  s = s.replace(/[est]$/, ''); // consonne/e muette finale
  s = s.replace(/(.)\1+/g, '$1'); // dédup lettres consécutives (varroa → varoa)
  return s;
}

/** Distance d'édition ≤ 1 (insertion/suppression/substitution). Court-circuite vite. */
function distanceMax1(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
}

// Construction paresseuse (SAVOIR pleinement chargé au 1er appel).
let _lexique: Set<string> | null = null;
let _index: Map<string, string[]> | null = null;

function construire(): { lex: Set<string>; index: Map<string, string[]> } {
  const lex = new Set<string>();
  const ajouter = (mot: string) => {
    if (mot.length >= 5 && /^[a-z]+$/.test(mot)) lex.add(mot);
  };
  // Lexique 100 % curé (aucune aspiration du savoir → aucune sur-correction).
  for (const m of [...MOTS_LOGIQUES, ...PRODUITS]) ajouter(m);
  const index = new Map<string, string[]>();
  for (const mot of lex) {
    const code = codePhonetique(mot);
    const liste = index.get(code);
    if (liste) liste.push(mot);
    else index.set(code, [mot]);
  }
  return { lex, index };
}

function getLexique(): Set<string> {
  if (!_lexique) ({ lex: _lexique, index: _index } = construire());
  return _lexique;
}
function getIndex(): Map<string, string[]> {
  if (!_index) ({ lex: _lexique, index: _index } = construire());
  return _index;
}

/** Choisit le meilleur candidat de correction (déterministe : + court, puis alpha). */
function meilleur(candidats: string[], token: string): string | null {
  let best: string | null = null;
  for (const c of candidats) {
    if (c === token || c[0] !== token[0]) continue;
    if (Math.abs(c.length - token.length) > 2) continue;
    if (!best || c.length < best.length || (c.length === best.length && c < best)) best = c;
  }
  return best;
}

/**
 * Corrige un token isolé s'il est une faute évidente d'un mot du lexique. Sinon
 * le renvoie tel quel. Zéro correction hors lexique, ni sur mots courts/nombres.
 */
export function corrigerToken(token: string): string {
  // Seuil à 4 et non 5 : le lexique ne contient QUE des mots ≥ 5 lettres, donc un
  // token de 4 ne peut y correspondre que par INSERTION d'une lettre
  // (« stok → stock », « ruch → ruche »). La substitution — le cas réellement
  // dangereux, qui transforme un mot en un AUTRE mot — reste impossible ici, et
  // demeure bloquée plus bas sous 7 lettres.
  if (token.length < 4 || /[0-9]/.test(token)) return token;
  const lex = getLexique();
  if (lex.has(token)) return token; // mot légitime connu → intact
  // Pluriel d'un mot connu (« varroas » = « varroa » + s) → légitime, on n'y touche pas.
  if (token.endsWith('s') && lex.has(token.slice(0, -1))) return token;

  // Barrière A — code phonétique identique, RÉSERVÉE aux mots longs (≥ 7) : sur un
  // mot court la réduction phonétique est trop lossy (« filles » ~ « filet ») et
  // risquerait une fausse correction. Sur un mot long, une collision est rare.
  if (token.length >= 7) {
    const phon = meilleur(getIndex().get(codePhonetique(token)) ?? [], token);
    if (phon) return phon;
  }

  // Barrière B — distance d'édition ≤ 1. On distingue :
  //  • insertion/suppression (longueurs différentes) : faute typique et SÛRE dès 5
  //    lettres (« varoa → varroa », « apivare → apivar ») ;
  //  • substitution (même longueur) : dangereuse sur un mot court car une voyelle
  //    changée donne souvent un AUTRE mot (« poser → peser ») → réservée aux ≥ 7.
  const proches: string[] = [];
  for (const cand of lex) {
    if (cand[0] !== token[0]) continue;
    const dl = Math.abs(cand.length - token.length);
    if (dl > 1) continue;
    if (dl === 0 && token.length < 7) continue; // substitution sur mot court : trop risqué
    if (distanceMax1(token, cand)) proches.push(cand);
  }
  return meilleur(proches, token) ?? token;
}

/**
 * Corrige mot à mot une chaîne DÉJÀ normalisée (cf. `normaliser`). Idempotent :
 * l'appliquer deux fois donne le même résultat. Préserve les nombres et la
 * structure (espaces).
 */
export function corrigerTexte(norm: string): string {
  if (!norm) return norm;
  return norm
    .split(' ')
    .map((t) => (t ? corrigerToken(t) : t))
    .join(' ');
}
