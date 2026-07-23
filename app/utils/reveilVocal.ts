// ═══════════════════════════════════════════════════════════════════════════
// RÉVEIL VOCAL « Salut Maya » — détection PURE et testable de la phrase de
// réveil dans un transcript, et extraction de la commande qui suit.
//
// Principe anti-faux-positif : on n'accepte le nom « maya » QUE s'il est en tête
// de phrase OU précédé d'une salutation (« salut maya », « ok maya »). Un « maya »
// perdu au milieu d'une phrase ne réveille PAS (« je pense que maya se trompe »).
// On tolère les variantes que la reconnaissance vocale produit (maïa, maja…).
// ═══════════════════════════════════════════════════════════════════════════

/** Variantes du nom telles que l'ASR peut les transcrire. */
const NOMS = new Set(['maya', 'maia', 'maja', 'malia', 'mya']);

/** Salutations acceptées juste avant le nom. */
const SALUTS = new Set([
  'salut',
  'coucou',
  'bonjour',
  'bonsoir',
  'hey',
  'he',
  'eh',
  'ok',
  'okay',
  'allo',
  'allô',
  'dis',
  'dit',
  'oui',
  'yo',
  'hello',
]);

/** Minuscule + sans accents + ponctuation → espace + espaces compactés. */
function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export interface ResultatReveil {
  /** Vrai si la phrase de réveil est reconnue. */
  reveil: boolean;
  /** Ce qui suit le réveil, normalisé (« salut maya comment vont mes ruches » → « comment vont mes ruches »). */
  commande: string;
}

/**
 * Analyse un transcript : réveil ? et si oui, quelle commande suit ?
 *
 * Le nom doit être en position 0, OU précédé d'une salutation, et dans les
 * premiers mots (on tolère un filler « euh » en tête, pas un nom noyé au milieu).
 */
export function analyserReveil(texte: string): ResultatReveil {
  const mots = normaliser(texte ?? '')
    .split(' ')
    .filter(Boolean);
  const LIMITE = 4; // le réveil se dit en tête ; au-delà, c'est du bavardage
  for (let i = 0; i < mots.length && i < LIMITE; i++) {
    const mot = mots[i];
    if (!mot || !NOMS.has(mot)) continue;
    const enTete = i === 0;
    const precedeSalut = i > 0 && SALUTS.has(mots[i - 1] ?? '');
    if (enTete || precedeSalut) {
      return {
        reveil: true,
        commande: mots
          .slice(i + 1)
          .join(' ')
          .trim(),
      };
    }
  }
  return { reveil: false, commande: '' };
}
