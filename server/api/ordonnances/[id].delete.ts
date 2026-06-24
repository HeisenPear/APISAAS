import { eq, and } from 'drizzle-orm';
import { ordonnances } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');

  const [deleted] = await db
    .delete(ordonnances)
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, ownerId)))
    .returning({ id: ordonnances.id });

  if (!deleted) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { success: true };
});
