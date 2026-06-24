import { eq, and } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, ownerId)))
    .returning();

  if (!deleted) notFound('Rucher introuvable');

  return { data: { success: true } };
});
