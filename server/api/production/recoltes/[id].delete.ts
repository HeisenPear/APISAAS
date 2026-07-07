import { eq, and } from 'drizzle-orm';
import { recoltes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [deleted] = await db
    .delete(recoltes)
    .where(and(eq(recoltes.id, id), eq(recoltes.userId, ownerId)))
    .returning({ id: recoltes.id });

  if (!deleted) notFound('Recolte introuvable');

  return { data: { id: deleted.id } };
});
