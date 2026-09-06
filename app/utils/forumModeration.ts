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
 * `uniq_abus_message_auteur` empêche un même compte de signaler deux fois ;
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
/**
 * ⚠️ PRÉFIXÉS `FORUM_`, ET PAS PAR COQUETTERIE. `MAX_SIGNALEMENTS_PAR_JOUR`
 * existait déjà dans `app/utils/frelonFiabilite.ts`, avec la même valeur mais
 * un tout autre sujet (les signalements de NIDS). Nuxt auto-importe par NOM :
 * il en retient un, ignore l'autre, et le dit dans un avertissement de build
 * que personne ne lit. Le forum aurait donc plafonné sur la constante du
 * frelon — invisible tant que les deux valent 10, faux le jour où l'une bouge.
 *
 * `tests/unit/server/collisionsAutoImport.test.ts` a fait rougir exactement ce
 * cas ; ces trois noms sont désormais sans ambiguïté à la lecture.
 */
export const FORUM_MAX_SUJETS_PAR_JOUR = 5;
export const FORUM_MAX_MESSAGES_PAR_JOUR = 30;
export const FORUM_MAX_SIGNALEMENTS_PAR_JOUR = 10;

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

/**
 * Le refus d'anti-flood nomme le CHIFFRE et l'OBJET, pas un identifiant
 * technique. « Limite de FORUM_MAX_SUJETS_PAR_JOUR atteinte » ne veut rien dire
 * pour quelqu'un qui voulait juste poser une question.
 *
 * ⚠️ UN VERBE PAR OBJET, ET PAS UNE PHRASE RETOUCHÉE À L'ARRIVÉE. La première
 * version de la route des sujets réutilisait la phrase des messages en y
 * remplaçant « publié » par « ouvert » — un `String.replace` sur du texte
 * d'interface, qui rend silencieusement la phrase inchangée dès qu'on retouche
 * un mot ici. Le verbe fait partie de la règle, il vit donc avec elle.
 */
export type ObjetPlafonne = 'sujets' | 'messages' | 'signalements';

const VERBE_DU_PLAFOND: Record<ObjetPlafonne, string> = {
  sujets: 'ouvert',
  messages: 'publié',
  signalements: 'envoyé',
};

export function refusPlafondQuotidien(max: number, objet: ObjetPlafonne): string {
  return (
    `Vous avez ${VERBE_DU_PLAFOND[objet]} ${max} ${objet} aujourd’hui, c’est la limite ` +
    'quotidienne. Revenez demain — elle est là pour que le forum reste lisible.'
  );
}

/** Le cas des messages, gardé nommé parce que c'est le plus fréquent. */
export function refusTropDeMessages(max: number): string {
  return refusPlafondQuotidien(max, 'messages');
}
