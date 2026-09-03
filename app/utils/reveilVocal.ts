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

// ═══════════════════════════════════════════════════════════════════════════
// LE DÉTECTEUR — ouvrir VITE sans perdre la phrase qui suit.
//
// ⚠️ CE N'EST PAS UN RÉGLAGE DE CONFORT : LES DEUX BESOINS SE CONTREDISENT.
//
// Le réveil n'écoutait que les résultats FINAUX. Or un résultat final n'arrive
// qu'après un silence — le moteur attend d'être sûr. « Salut Maya » mettait donc
// une à deux secondes à ouvrir la bulle : une éternité quand on a les mains dans
// une ruche et qu'on ne sait pas si on a été entendu.
//
// Lire les résultats INTERMÉDIAIRES ouvre en deux à quatre dixièmes. Mais un
// intermédiaire se RÉVISE : « salut maya » devient « salut mais y a ». Et
// surtout, s'il servait aussi de commande, on enverrait un moignon — au moment
// où l'apiculteur dit « salut maya comment vont mes… », l'intermédiaire qui
// contient le réveil ne contient encore rien de sa question.
//
// D'où la séparation en DEUX temps, et c'est toute l'idée :
//
//   1. `ouvrir`  — un intermédiaire confirmé fait apparaître la bulle. Rien
//                  n'est envoyé. Le micro N'EST PAS RENDU.
//   2. `livrer`  — le résultat final, lui, porte la phrase entière. C'est
//                  seulement là qu'on remet la commande et qu'on lâche le micro.
//
// La confirmation d'un intermédiaire est soit un SECOND intermédiaire qui dit
// encore réveil (une révision ne survit pas à deux tours), soit l'expiration
// d'un court délai que l'appelant tient — la partie « temps » reste dehors, et
// ce détecteur reste PUR.
// ═══════════════════════════════════════════════════════════════════════════

export type DecisionReveil =
  | { action: 'rien' }
  /** Un intermédiaire dit réveil, mais une seule fois : armer le délai de confirmation. */
  | { action: 'patienter' }
  /** Ouvrir la bulle MAINTENANT, et garder le micro : la phrase n'est pas finie. */
  | { action: 'ouvrir'; commande: string }
  /** L'énoncé est terminé : voici la commande complète, le micro peut passer la main. */
  | { action: 'livrer'; commande: string };

export interface DetecteurReveil {
  /** Analyse un transcript (intermédiaire ou final) et dit quoi faire. */
  observer(transcript: string, final: boolean): DecisionReveil;
  /** Appelé quand le délai de confirmation expire sans avoir été contredit. */
  confirmer(): DecisionReveil;
  /** Repart de zéro (fin de session, ou transfert terminé). */
  reinitialiser(): void;
}

/**
 * Crée un détecteur à deux temps. Aucune horloge, aucun minuteur : c'est
 * l'appelant qui tient le délai et rappelle `confirmer()`. Le détecteur ne
 * dépend que de ce qu'il a vu, ce qui le rend rejouable à l'identique dans un
 * banc — le comportement micro, lui, ne se teste pas hors navigateur.
 */
export function creerDetecteurReveil(): DetecteurReveil {
  /** Un intermédiaire a dit réveil, et attend sa confirmation. */
  let arme = false;
  /** La bulle a déjà été ouverte : on ne fait plus qu'attendre le final. */
  let ouvert = false;
  /** Le dernier réveil vu, pour que la confirmation par délai sache quoi dire. */
  let derniere = '';

  return {
    observer(transcript, final) {
      const { reveil, commande } = analyserReveil(transcript ?? '');

      if (ouvert) {
        // La bulle est ouverte, on tient encore le micro : seul le FINAL compte,
        // c'est lui qui porte la phrase entière.
        if (!final) return { action: 'rien' };
        /**
         * ⚠️ SI LE FINAL NE DIT PLUS RÉVEIL, LA COMMANDE EST VIDE — pas le
         * transcript brut. Le moteur a révisé : « salut maya note ça » est
         * devenu « salut mais y a note ça ». Envoyer ce qui reste ferait poser
         * à Maya une question que personne n'a posée. On rend la main sans
         * commande ; la bulle est ouverte, la dictée prend le relais, et
         * l'apiculteur répète.
         */
        return { action: 'livrer', commande: reveil ? commande : '' };
      }

      if (!reveil) {
        // Une révision a effacé le réveil : on désarme. C'est exactement le cas
        // que la confirmation existe pour attraper.
        arme = false;
        return { action: 'rien' };
      }

      derniere = commande;

      // Un FINAL est déjà sûr : rien à confirmer, et il porte toute la phrase.
      if (final) {
        ouvert = true;
        return { action: 'livrer', commande };
      }

      if (!arme) {
        arme = true;
        return { action: 'patienter' };
      }

      // Deuxième intermédiaire consécutif qui dit réveil : une révision n'aurait
      // pas survécu à deux tours.
      ouvert = true;
      return { action: 'ouvrir', commande };
    },

    confirmer() {
      if (!arme || ouvert) return { action: 'rien' };
      ouvert = true;
      return { action: 'ouvrir', commande: derniere };
    },

    reinitialiser() {
      arme = false;
      ouvert = false;
      derniere = '';
    },
  };
}
