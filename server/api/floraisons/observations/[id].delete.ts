import { eq, and } from 'drizzle-orm';
import { observationsFloraison } from '~~/server/database/schema';

/**
 * DELETE /api/floraisons/observations/:id — retire SA propre observation.
 * Le filtre sur `auteurId` est la garantie d'isolation : personne ne peut
 * supprimer l'observation d'un autre apiculteur, même en devinant l'id.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant' });
  }

  const [supprime] = await db
    .delete(observationsFloraison)
    .where(and(eq(observationsFloraison.id, id), eq(observationsFloraison.auteurId, user.id)))
    .returning({ id: observationsFloraison.id });

  if (!supprime) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Introuvable',
      message: "Cette observation n'existe pas ou ne vous appartient pas.",
    });
  }

  return { data: { id: supprime.id } };
});
