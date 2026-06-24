import { eq, and } from 'drizzle-orm';
import { produitsCatalogue } from '~~/server/database/schema';

/** Supprime un preset de catalogue. */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');

  const [deleted] = await db
    .delete(produitsCatalogue)
    .where(and(eq(produitsCatalogue.id, id), eq(produitsCatalogue.userId, ownerId)))
    .returning({ id: produitsCatalogue.id });

  if (!deleted) notFound('Preset introuvable');
  return { success: true };
});
