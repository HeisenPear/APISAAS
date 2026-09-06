// ═══════════════════════════════════════════════════════════════════════════
// LE SILENCE N'EST PAS UNE PANNE — une seule règle, pour les DEUX écouteurs.
//
// ⚠️ CE FICHIER NAÎT D'UNE RÈGLE ÉCRITE UNE FOIS SUR DEUX.
//
// L'écoute continue du navigateur se referme d'elle-même à chaque silence un
// peu long : c'est son fonctionnement NORMAL, pas un incident. Compter ces
// fermetures comme des échecs éteint l'écoute au bout de quelques respirations.
//
// `useDictee` l'avait appris — et corrigé chez elle seule. `useReveilMaya`, qui
// a exactement le même `onend` et exactement le même compteur, ne l'a jamais su.
// Résultat, sur un rucher où l'on travaille en silence : douze fermetures et le
// réveil s'espace sans rien dire, quatre cycles et il se déclare en panne avec
// un message qui accuse une AUTRE application de tenir le micro. Personne ne le
// tenait. L'apiculteur se taisait, et « Salut Maya » n'écoutait plus.
//
// C'est le défaut nº 1 de ce dépôt dans sa forme la plus pure : deux tables qui
// décrivent la même règle finissent toujours par diverger, et c'est la
// divergence qui ouvre le trou. La règle vit donc ICI, PURE, et les deux
// lecteurs l'appellent.
//
// ⚠️ ELLE REND LE COMPTEUR, PAS UN BOOLÉEN. Un prédicat laisserait chaque
// appelant recoller lui-même « si saine alors 0 sinon +1 » — c'est-à-dire
// remettre en place, à deux endroits, la moitié de la règle qui avait divergé.
// En rendant la valeur suivante du compteur, il n'y a plus rien à recoller.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Durée en deçà de laquelle une session est dite MORT-NÉE.
 *
 * Une session qui a obtenu le micro et vécu près d'une seconde avant de se
 * refermer sur un silence fonctionne. Une session qui meurt en quelques
 * dizaines de millisecondes dit qu'on ne nous laisse pas le micro — et c'est
 * celle-là, seule, qu'il faut compter.
 */
export const DUREE_SESSION_SAINE_MS = 700;

/** Ce qu'on sait d'une session de reconnaissance qui vient de se fermer. */
export interface SessionFermee {
  /** Le micro a-t-il été réellement obtenu ? (`onstart` a-t-il été appelé ?) */
  aDemarre: boolean;
  /** Combien de temps elle a vécu, en millisecondes. */
  vecuMs: number;
}

/** La session a-t-elle VÉCU ? (micro obtenu ET durée franche) */
export function sessionSaine(session: SessionFermee): boolean {
  /**
   * ⚠️ UNE DURÉE ILLISIBLE NE VAUT PAS « SAINE ». `performance.now()` n'existe
   * pas au rendu serveur : `vecuMs` peut arriver `NaN`. Une comparaison avec
   * `NaN` est fausse, donc la session serait comptée — c'est le bon sens de la
   * règle du dépôt (« inconnu ne vaut jamais laisse-passer »), mais on l'écrit
   * plutôt que de le laisser dépendre d'un accident de sémantique.
   */
  if (!Number.isFinite(session.vecuMs)) return false;
  return session.aDemarre && session.vecuMs >= DUREE_SESSION_SAINE_MS;
}

/**
 * Le compteur de fermetures à vide, APRÈS cette session.
 *
 * Une session saine le remet à zéro — l'écoute fonctionne, le silence n'est
 * qu'un silence. Une session mort-née l'incrémente : c'est celle-là qui dit
 * qu'un tiers tient le micro.
 */
export function compteurApresSession(precedent: number, session: SessionFermee): number {
  return sessionSaine(session) ? 0 : precedent + 1;
}
