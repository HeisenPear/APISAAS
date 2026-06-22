import { eq, and } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(alertes)
    .where(and(eq(alertes.id, id), eq(alertes.userId, user.id)))
    .returning({ id: alertes.id });

  if (!deleted) notFound('Alerte introuvable');

  return { success: true };
});
