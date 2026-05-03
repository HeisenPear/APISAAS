import { eq, and } from 'drizzle-orm';
import { reinesElevage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db.delete(reinesElevage)
    .where(and(eq(reinesElevage.id, id!), eq(reinesElevage.userId, user.id))).returning({ id: reinesElevage.id });
  if (!deleted) notFound('Reine introuvable');
  return { data: { id: deleted.id } };
});
