import { eq, and } from 'drizzle-orm';
import { hausses } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(hausses)
    .where(and(eq(hausses.id, id), eq(hausses.userId, user.id)))
    .returning({ id: hausses.id });

  if (!deleted) return notFound('Hausse introuvable');

  return { data: { success: true } };
});
