import { eq, and } from 'drizzle-orm';
import { sessionsGreffage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(sessionsGreffage)
    .where(and(eq(sessionsGreffage.id, id!), eq(sessionsGreffage.userId, user.id)))
    .returning({ id: sessionsGreffage.id });
  if (!deleted) notFound('Session introuvable');
  return { data: { id: deleted.id } };
});
