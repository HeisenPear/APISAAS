import { eq, and } from 'drizzle-orm';
import { ordonnances } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');

  const [deleted] = await db
    .delete(ordonnances)
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, user.id)))
    .returning({ id: ordonnances.id });

  if (!deleted) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { success: true };
});
