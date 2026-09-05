// Modération du forum communautaire — logique PURE et testable.
//
// Modelé sur `app/utils/frelonFiabilite.ts` : chaque seuil est une constante
// NOMMÉE et exportée, importée par le serveur ET par l'écran. Un nombre écrit
// deux fois finit par diverger, et c'est alors l'écran qui ment sur ce que le
// serveur fera.

import type { StatutMessageForum } from '~/config/forum';

/**
 * ⚠️ COMBIEN DE COMPTES DISTINCTS MASQUENT UN MESSAGE — CHIFFRE DE L'APICULTEUR.
 *
 * Trois, et le raisonnement qui l'a fait retenir : assez bas pour agir vite sur
 * une communauté encore petite, assez haut pour qu'un règlement de comptes à
 * deux ne suffise pas à faire taire quelqu'un. Le masquage est RÉVERSIBLE et
 * signalé : rien n'est supprimé, l'arbitrage se fait après.
 *
 * ⚠️ DISTINCTS, ET C'EST L'INDEX UNIQUE QUI LE GARANTIT — pas ce nombre.
 * `uniq_abus_message_user` empêche un même compte de signaler deux fois ;
 * compter les lignes revient donc à compter les personnes. Sans cet index, une
 * seule personne atteindrait le seuil en cliquant trois fois.
 */
export const SEUIL_MASQUAGE = 3;

/**
 * ⚠️ QUAND LE DROIT DE SIGNALER SE PERD — ET IL SE PERD DÉFINITIVEMENT.
 *
 * Choix de l'apiculteur : la suspension ne s'éteint pas toute seule, il la
 * lève. C'est le plus protecteur pour le forum, et ça n'a de sens QUE parce
 * qu'un écran d'administration permet de la lever — sans lui, la décision
 * serait irréversible en pratique, ce qui n'est pas ce qui a été demandé.
 *
 * Trois signalements RÉTABLIS, pas trois signalements : on ne punit pas
 * quelqu'un qui signale de bonne foi et se trompe une fois. Il faut que
 * l'arbitrage lui ait donné tort trois fois.
 *
 * ⚠️ ET ÇA NE TOUCHE QUE LE BOUTON SIGNALER. Lire et écrire restent intacts :
 * retirer la parole à quelqu'un parce qu'il a mal signalé serait une sanction
 * sans rapport avec la faute.
 */
export const SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION = 3;

/**
 * Anti-flood, par COMPTE et sur 24 h — comptés en base, jamais en mémoire.
 *
 * ⚠️ UN COMPTEUR EN MÉMOIRE NE SURVIT PAS À UNE LAMBDA. Vercel en démarre
 * plusieurs et les recycle : un plafond gardé en RAM se réinitialise sans
 * prévenir, et ne plafonne donc rien. Le throttle par IP en mémoire garde son
 * utilité — il coupe la rafale — mais c'est le compte en base qui tient le
 * chiffre du jour.
 */
export const MAX_SUJETS_PAR_JOUR = 5;
export const MAX_MESSAGES_PAR_JOUR = 30;
export const MAX_SIGNALEMENTS_PAR_JOUR = 10;

/** Ce qu'on sait d'un message au moment de décider de son sort. */
export interface CompteurSignalements {
  /** Lignes de la table de signalements — donc comptes DISTINCTS, par construction. */
  signalements: number;
  /** L'auteur ou un administrateur l'a retiré. Prime sur tout le reste. */
  supprime?: boolean;
}

/**
 * L'état d'un message, dérivé de ses signalements. Fonction PURE.
 *
 * ⚠️ LA SUPPRESSION PRIME, ET CE N'EST PAS UN DÉTAIL D'ORDRE. Un message
 * retiré par son auteur puis signalé trois fois repasserait « masqué » si on
 * regardait les signalements d'abord — donc réapparaîtrait dans les écrans qui
 * filtrent sur `masque` en attendant un arbitrage, alors que son auteur l'a
 * explicitement retiré. On ne ressuscite pas ce que quelqu'un a effacé.
 */
export function statutMessage(c: CompteurSignalements): StatutMessageForum {
  if (c.supprime) return 'supprime';
  return c.signalements >= SEUIL_MASQUAGE ? 'masque' : 'visible';
}

/**
 * Ce compte a-t-il encore le droit de signaler ?
 *
 * ⚠️ ON PASSE LA LEVÉE EXPLICITEMENT, on ne la déduit pas d'une date. La
 * suspension étant définitive, il n'existe aucun instant où elle s'éteint
 * d'elle-même : seul un geste d'administration la lève, et ce geste doit être
 * visible dans la donnée. Une expiration implicite rendrait la décision de
 * l'apiculteur inopérante sans que personne ne s'en aperçoive.
 */
export function peutSignaler(compte: {
  signalementsRetablis: number;
  suspensionLevee?: boolean;
}): boolean {
  if (compte.suspensionLevee) return true;
  return compte.signalementsRetablis < SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION;
}

/**
 * Le refus est une PHRASE, jamais un code — et il nomme ce qui débloque.
 *
 * Ici, ce qui débloque n'est pas une formule payante mais une décision humaine :
 * la phrase doit donc dire à qui s'adresser, sinon elle laisse l'apiculteur
 * devant un mur. C'est la même règle que les refus de plan, appliquée à une
 * porte qui n'est pas commerciale.
 */
export const REFUS_SIGNALEMENT_SUSPENDU =
  'Votre droit de signaler a été suspendu après plusieurs signalements non retenus. ' +
  'Écrivez-nous depuis Réglages › Aide si vous pensez que c’est une erreur.';

/** Le refus d'anti-flood nomme le chiffre, pas un identifiant technique. */
export function refusTropDeMessages(max: number): string {
  return (
    `Vous avez publié ${max} messages aujourd’hui, c’est la limite quotidienne. ` +
    'Revenez demain — elle est là pour que le forum reste lisible.'
  );
}
