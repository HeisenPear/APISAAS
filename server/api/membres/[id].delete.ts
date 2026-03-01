import { eq, and } from 'drizzle-orm';
import { membres } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(membres)
    .where(and(eq(membres.id, id), eq(membres.ownerId, user.id)))
    .returning({ id: membres.id });

  if (!deleted) return notFound('Membre introuvable');

  return { data: { success: true } };
});
