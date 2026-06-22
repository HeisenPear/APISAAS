import { eq, and } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');

  const [deleted] = await db
    .delete(veterinaires)
    .where(and(eq(veterinaires.id, id!), eq(veterinaires.userId, user.id)))
    .returning({ id: veterinaires.id });

  if (!deleted) throw createError({ statusCode: 404, message: 'Vétérinaire non trouvé' });
  return { success: true };
});
