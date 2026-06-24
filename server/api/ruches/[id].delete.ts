import { eq, and } from 'drizzle-orm';
import { ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, ownerId)))
    .returning({ id: ruches.id });

  if (!deleted) notFound('Ruche introuvable');

  return { data: { success: true } };
});
