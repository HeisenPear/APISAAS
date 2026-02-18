import { eq, and } from 'drizzle-orm';
import { inspections } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(inspections)
    .where(and(eq(inspections.id, id), eq(inspections.userId, user.id)))
    .returning({ id: inspections.id });

  if (!deleted) return notFound('Intervention introuvable');

  return { data: { success: true } };
});
