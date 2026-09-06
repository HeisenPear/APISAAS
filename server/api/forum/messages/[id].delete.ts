import { and, eq } from 'drizzle-orm';
import { messagesForum } from '~~/server/database/schema';
import { recomputerSujet } from '~~/server/utils/forumSignalement';
import { uuidSchema } from '~~/server/utils/validators';

/**
 * DELETE /api/forum/messages/[id] — l'auteur retire son propre message.
 *
 * ⚠️ LE CONTRÔLE ET L'ÉCRITURE SONT LE MÊME ORDRE SQL. Lire le message, vérifier
 * qu'il appartient à la personne, puis écrire par un second ordre filtré sur le
 * seul identifiant, c'est la forme qui a déjà laissé passer une invitation
 * révoquée entre les deux (`membres/accepter.post.ts`). Ici le `where` EST le
 * contrôle : `auteurId` en fait partie.
 *
 * ⚠️ ET C'EST UN CHANGEMENT DE STATUT, PAS UN `delete`. Supprimer la ligne
 * emporterait aussi ses signalements (`ON DELETE CASCADE`) : un message
 * insultant signalé trois fois, effacé par son auteur, effacerait du même coup
 * la trace de ce qui lui était reproché — et remettrait son compteur de torts à
 * zéro. On garde la ligne, on retire le contenu de la lecture publique.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [modifie] = await db
    .update(messagesForum)
    .set({ statut: 'supprime', updatedAt: new Date() })
    .where(and(eq(messagesForum.id, id), eq(messagesForum.auteurId, user.id)))
    .returning({ sujetId: messagesForum.sujetId });

  if (!modifie) {
    throw createError({
      statusCode: 404,
      message: 'Ce message n’existe pas, ou n’est pas le vôtre.',
    });
  }

  await recomputerSujet(modifie.sujetId);
  return { data: { id } };
});
