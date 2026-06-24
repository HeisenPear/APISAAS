import { eq, and } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Client introuvable');

  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, ownerId)));

  return { success: true };
});
