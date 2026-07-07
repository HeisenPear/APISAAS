import { eq, and } from 'drizzle-orm';
import { visitesSanitaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');

  const [deleted] = await db
    .delete(visitesSanitaires)
    .where(and(eq(visitesSanitaires.id, id!), eq(visitesSanitaires.userId, ownerId)))
    .returning({ id: visitesSanitaires.id });

  if (!deleted) throw createError({ statusCode: 404, message: 'Visite non trouvée' });
  return { success: true };
});
