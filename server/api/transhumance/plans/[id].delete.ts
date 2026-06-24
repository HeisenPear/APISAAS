import { eq, and } from 'drizzle-orm';
import { plansTranshumance } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(plansTranshumance)
    .where(and(eq(plansTranshumance.id, id!), eq(plansTranshumance.userId, ownerId)))
    .returning({ id: plansTranshumance.id });
  if (!deleted) notFound('Plan introuvable');
  return { data: { id: deleted.id } };
});
