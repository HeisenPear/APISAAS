import { normaliser, convertirNombres } from '~~/server/utils/copilote-local';
import { extraireRucherSeul } from '~~/server/utils/copilote-actions';

/**
 * Sélecteur de CIBLES multiples — le déblocage n°1 du moteur de tâches de Maya :
 * reconnaître qu'une commande vise PLUSIEURS ruches (« toutes mes ruches », « les
 * ruches du rucher Nord », « les 3, 5 et 7 », « ruches 1 à 5 », « les ruches
 * faibles »). 100 % déterministe et pur (aucun accès base) : la résolution en
 * ruches concrètes vit dans copilote-executeur (resoudreCibles), qui interroge
 * les données. Ici on ne fait QUE comprendre la portée de la demande.
 */

/** Critère de santé/état servant à cibler un sous-ensemble de ruches. */
export type CritereRuche = 'faible' | 'retard' | 'varroa' | 'malade';

/** Portée d'une commande en lot, résolue plus tard en liste de ruches concrètes. */
export type CibleRuches =
  | { mode: 'toutes' }
  | { mode: 'rucher'; rucher: string }
  | { mode: 'liste'; numeros: string[] }
  | { mode: 'plage'; de: number; a: number }
  | { mode: 'critere'; critere: CritereRuche };

/** Verbes de LECTURE : « montre/liste/combien… » ne sont JAMAIS des écritures en lot. */
const VERBE_LECTURE_LOT =
  /\b(montre|montrer|affiche|afficher|liste|lister|voir|consulte|consulter|combien|quels?|quelles?|lesquelles?|ou\s+sont|resume|recap)\b/;

/** Signal d'ÉCRITURE d'intervention (verbe, geste ou observation) légitimant un lot. */
const SIGNAL_ECRITURE_LOT =
  /\b(note|noter|enregistre|enregistrer|marque|marquer|consigne|consigner|inscris|inscrire|ajoute|ajouter|mets|mettre|fais|faire|nourri\w*|sirop|candi|pate\s+proteique|recolt\w*|extrai\w*|pese\w*|poids|varroa\w*|acarien\w*|traite\w*|traitement|controle|visite|inspection|reine|couvain|reserves?|ras)\b/;

/** Adjectifs/expressions de critère → catégorie de ciblage. */
const CRITERES: { re: RegExp; critere: CritereRuche }[] = [
  { re: /\b(faibles?|chetives?|petites?|populeuses?\s+faibles?)\b/, critere: 'faible' },
  {
    re: /\b(en\s+retard|pas\s+(?:encore\s+)?visitees?|non\s+visitees?|a\s+visiter|jamais\s+visitees?)\b/,
    critere: 'retard',
  },
  { re: /\b(varroa\w*|acarien\w*|infestees?)\b/, critere: 'varroa' },
  { re: /\b(malades?|sanitaires?|a\s+surveiller|problematiques?)\b/, critere: 'malade' },
];

/** Contexte collectif de ruches (pluriel ou quantificateur). */
const COLLECTIF = /\b(toutes?|tous|ruches|colonies|rucher|ruchers)\b/;

/**
 * Extrait la portée d'une commande. Renvoie null si la demande vise UNE seule
 * ruche (ou aucune) — le flux d'intervention normal (mono-ruche) prend alors le
 * relais. Ordre : critère → plage → liste → rucher → toutes (du plus spécifique
 * au plus large). Pur.
 */
export function extraireCibles(brut: string): CibleRuches | null {
  const norm = convertirNombres(normaliser(brut));

  // 1. Critère (« les ruches faibles », « celles en retard »). Exige un contexte
  //    collectif OU l'article « les » pour éviter « la reine est faible » (mono).
  if (/\b(ruches|colonies|celles|les)\b/.test(norm)) {
    for (const { re, critere } of CRITERES) {
      if (re.test(norm)) return { mode: 'critere', critere };
    }
  }

  // À partir d'ici, il faut un contexte collectif de ruches.
  if (!COLLECTIF.test(norm)) return null;

  // 2. Plage (« ruches 1 à 5 », « de la 1 à la 10 »). « a » = « à » normalisé.
  const plage =
    /\bruches?\s+(?:de\s+(?:la\s+)?)?(\d+)\s+a\s+(?:la\s+)?(\d+)\b/.exec(norm) ??
    /\bde\s+la\s+(\d+)\s+a\s+la\s+(\d+)\b/.exec(norm);
  if (plage?.[1] && plage[2]) {
    const de = Number(plage[1]);
    const a = Number(plage[2]);
    if (de > 0 && a >= de) return { mode: 'plage', de, a };
  }

  // 3. Liste explicite (« ruches 3, 5 et 7 », « les 3, 5 et 7 »). ≥ 2 numéros.
  //    `normaliser` a déjà transformé les virgules en espaces → on tolère les
  //    séparateurs espace / « et » entre des numéros consécutifs après « ruches/les ».
  const liste = /\b(?:ruches?|les)\s+(\d+(?:\s*(?:,|et)?\s*\d+)+)\b/.exec(norm);
  if (liste?.[1]) {
    const numeros = liste[1].match(/\d+/g) ?? [];
    if (numeros.length >= 2) return { mode: 'liste', numeros };
  }

  // 4. Rucher nommé collectif (« toutes les ruches du rucher Nord », « sur le
  //    rucher des Tilleuls »). Exige un pluriel/quantificateur pour ne pas voler
  //    « ruche 3 du rucher Nord » (mono-ruche, géré par le flux normal).
  const rucher = extraireRucherSeul(brut);
  if (rucher && (/\bruches\b/.test(norm) || /\btoutes?\b/.test(norm) || /\btout\s+le\s+rucher\b/.test(norm))) {
    return { mode: 'rucher', rucher };
  }

  // 5. Toutes les ruches (« toutes mes ruches », « toutes les colonies »).
  if (/\b(toutes?|tous)\s+(?:mes\s+|les\s+)?(ruches?|colonies?)\b/.test(norm)) {
    return { mode: 'toutes' };
  }
  if (/\btout\s+le\s+(?:rucher|cheptel)\b/.test(norm) && !rucher) {
    return { mode: 'toutes' };
  }

  return null;
}

/**
 * Vrai si le message est une commande d'ÉCRITURE EN LOT (portée multiple + signal
 * d'écriture, hors lecture). Sert de garde dans le classifieur : on ne bascule en
 * plan que pour un ORDRE visant plusieurs ruches — jamais pour « montre les
 * ruches faibles » (lecture) ni « comment vont mes ruches ? » (question).
 */
export function estCommandeLotEcriture(brut: string): boolean {
  const norm = normaliser(brut);
  if (VERBE_LECTURE_LOT.test(norm)) return false;
  if (!SIGNAL_ECRITURE_LOT.test(norm)) return false;
  return extraireCibles(brut) !== null;
}

/** Libellé lisible d'une cible (pour l'aperçu du plan). */
export function libelleCible(cible: CibleRuches): string {
  switch (cible.mode) {
    case 'toutes':
      return 'toutes vos ruches';
    case 'rucher':
      return `le rucher ${cible.rucher}`;
    case 'liste':
      return `les ruches ${cible.numeros.join(', ')}`;
    case 'plage':
      return `les ruches ${cible.de} à ${cible.a}`;
    case 'critere':
      return {
        faible: 'les ruches faibles',
        retard: 'les ruches en retard de visite',
        varroa: 'les ruches touchées par le varroa',
        malade: 'les ruches à surveiller (sanitaire)',
      }[cible.critere];
  }
}
