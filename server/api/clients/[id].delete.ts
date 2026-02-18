import { eq, and } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
    .limit(1);

  if (!existing) notFound('Client introuvable');

  await db.delete(clients).where(eq(clients.id, id));

  return { success: true };
});
