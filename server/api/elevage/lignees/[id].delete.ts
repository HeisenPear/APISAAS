import { eq, and } from 'drizzle-orm';
import { lignees } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(lignees)
    .where(and(eq(lignees.id, id!), eq(lignees.userId, ownerId)))
    .returning({ id: lignees.id });
  if (!deleted) notFound('Lignée introuvable');
  return { data: { id: deleted.id } };
});
