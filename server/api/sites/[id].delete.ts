import { eq, and } from 'drizzle-orm';
import { sites } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Les ruchers rattachés sont automatiquement détachés (FK ON DELETE SET NULL).
  const [deleted] = await db
    .delete(sites)
    .where(and(eq(sites.id, id), eq(sites.userId, user.id)))
    .returning();

  if (!deleted) notFound('Site introuvable');

  return { data: { id: deleted.id } };
});
