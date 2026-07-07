import { eq, and } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.userId, ownerId)))
    .returning({ id: interventions.id });

  if (!deleted) return notFound('Intervention introuvable');

  return { data: { success: true } };
});
