import { and, eq, ne, sql } from 'drizzle-orm';
import { messagesForum, profils, signalementsAbus, sujetsForum } from '~~/server/database/schema';
import { statutMessage } from '~~/app/utils/forumModeration';

/**
 * Les compteurs du forum — RECALCULÉS, JAMAIS INCRÉMENTÉS.
 *
 * ⚠️ C'EST LA MÊME DÉCISION QUE `server/utils/frelonVote.ts`, ET POUR LA MÊME
 * RAISON. Un `set({ signalements: sql\`signalements + 1\` })` a l'air plus
 * simple et plus rapide ; il diverge au premier accident. Un échec au milieu
 * d'une séquence, une double soumission, une ligne supprimée en base à la main,
 * un arbitrage qui retire un signalement — et le compteur ne correspond plus à
 * ce que la table contient. Or ce compteur DÉCIDE du masquage : une dérive de
 * +2 masque un message que personne n'a signalé trois fois, et une dérive de −2
 * laisse visible un message qui aurait dû être relu.
 *
 * La table des signalements est la seule source de vérité. Ces fonctions la
 * relisent entièrement à chaque fois. Le coût est un `count(*)` sur un index —
 * négligeable devant une donnée fausse qui ne se répare jamais toute seule.
 */

/**
 * Recalcule les signalements d'un message et en dérive son statut.
 *
 * Rend le nombre de signalements comptés, et non `void` : « le message a N
 * signalements » doit être MESURÉ, pas promis. Le catalogue de CLAUDE.md
 * appelle ça « le chiffre promis, pas mesuré » — une fonction qui ne rend rien
 * ne peut pas être prise en défaut par un banc.
 *
 * ⚠️ NE TOUCHE PAS À `supprime`. Une suppression est le geste de l'auteur ou de
 * l'administrateur ; la recompter à partir des signalements la ferait sauter au
 * premier signalement retiré. On lit le statut courant pour savoir si le
 * message est supprimé, et `statutMessage` fait primer cette suppression.
 */
export async function recomputerMessage(messageId: string): Promise<number> {
  const [message] = await db
    .select({ statut: messagesForum.statut, sujetId: messagesForum.sujetId })
    .from(messagesForum)
    .where(eq(messagesForum.id, messageId))
    .limit(1);
  if (!message) return 0;

  /**
   * ⚠️ UN SIGNALEMENT RÉTABLI NE COMPTE PLUS, ET C'EST TOUT L'INTÉRÊT DE
   * L'ARBITRAGE. S'il continuait d'être compté, `arbitrer.post.ts` pourrait
   * rendre son verdict, l'écrire, l'afficher dans la file — et le message
   * resterait masqué pour tout le monde. L'administration croirait avoir
   * réparé ; le forum public montrerait le contraire. Le défaut ne se voit
   * PAS depuis l'écran d'administration, seulement depuis le forum.
   *
   * La ligne rétablie reste en base : elle porte le tort de son auteur, que
   * `recomputerTortsAuteur` relit. On la retire du dénombrement, pas du
   * dossier.
   */
  const [compte] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signalementsAbus)
    .where(
      and(eq(signalementsAbus.messageId, messageId), ne(signalementsAbus.arbitrage, 'retabli')),
    );

  const signalements = compte?.n ?? 0;
  const statut = statutMessage({
    signalements,
    supprime: message.statut === 'supprime',
  });

  await db
    .update(messagesForum)
    .set({ signalements, statut, updatedAt: new Date() })
    .where(eq(messagesForum.id, messageId));

  await recomputerSujet(message.sujetId);
  return signalements;
}

/**
 * Recalcule les compteurs d'un sujet depuis ses messages.
 *
 * ⚠️ `messages` NE COMPTE QUE CE QUI EST VISIBLE, et c'est ce que le lecteur
 * voit. Un fil annoncé « 12 réponses » qui en montre 9 parce que trois sont
 * masquées fait chercher les trois manquantes — on soupçonne un bug, ou une
 * censure. Le masquage laisse déjà une trace dans le fil
 * (`TEXTE_MESSAGE_MASQUE`) : le compteur, lui, annonce ce qui se lit.
 *
 * ⚠️ `dernierMessageLe` SUIT LA MÊME RÈGLE. Un fil remonté en tête de liste par
 * un message masqué serait remonté par un spam — exactement le contraire de ce
 * que le masquage doit produire.
 */
export async function recomputerSujet(sujetId: string): Promise<number> {
  const [compte] = await db
    .select({
      messages: sql<number>`count(*)::int`,
      dernier: sql<string | null>`max(${messagesForum.createdAt})`,
    })
    .from(messagesForum)
    .where(and(eq(messagesForum.sujetId, sujetId), eq(messagesForum.statut, 'visible')));

  // Même règle qu'au message : un signalement rétabli sort du dénombrement.
  const [abus] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signalementsAbus)
    .innerJoin(messagesForum, eq(signalementsAbus.messageId, messagesForum.id))
    .where(and(eq(messagesForum.sujetId, sujetId), ne(signalementsAbus.arbitrage, 'retabli')));

  const messages = compte?.messages ?? 0;
  await db
    .update(sujetsForum)
    .set({
      messages,
      signalements: abus?.n ?? 0,
      dernierMessageLe: compte?.dernier ? new Date(compte.dernier) : null,
      updatedAt: new Date(),
    })
    .where(eq(sujetsForum.id, sujetId));

  return messages;
}

/**
 * Recalcule les torts d'un compte : combien de SES signalements ont été
 * rétablis à l'arbitrage.
 *
 * ⚠️ CE COMPTEUR MÈNE À UNE SUSPENSION DÉFINITIVE — c'est le plus dangereux du
 * dépôt à laisser dériver. Un incrément sauté rendrait la sanction inatteignable
 * ; un incrément de trop la déclencherait sur quelqu'un qui n'a eu tort que deux
 * fois, et il faudrait alors un geste humain pour la lever. On recompte.
 *
 * ⚠️ ET ON NE TOUCHE PAS À `forumSuspensionLevee`. Une levée est une décision de
 * l'apiculteur : la recalculer, sous quelque forme que ce soit, reviendrait à la
 * défaire. Un compte levé qui se ferait rétablir un quatrième signalement voit
 * son compteur monter — et reste levé. C'est voulu : la levée dit « je prends la
 * responsabilité de ce compte », pas « remets le compteur à zéro ».
 */
export async function recomputerTortsAuteur(auteurId: string): Promise<number> {
  const [compte] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signalementsAbus)
    .where(and(eq(signalementsAbus.auteurId, auteurId), eq(signalementsAbus.arbitrage, 'retabli')));

  const torts = compte?.n ?? 0;
  await db
    .update(profils)
    .set({ forumSignalementsRetablis: torts })
    .where(eq(profils.id, auteurId));

  return torts;
}
