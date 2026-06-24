import { eq, and } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');

  const [deleted] = await db
    .delete(veterinaires)
    .where(and(eq(veterinaires.id, id!), eq(veterinaires.userId, ownerId)))
    .returning({ id: veterinaires.id });

  if (!deleted) throw createError({ statusCode: 404, message: 'Vétérinaire non trouvé' });
  return { success: true };
});
