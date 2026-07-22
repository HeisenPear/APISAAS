import { eq, and } from 'drizzle-orm';
import { receptricesGreffage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const sessionId = getRouterParam(event, 'id');
  const recId = getRouterParam(event, 'recId');
  if (!sessionId || !recId) badRequest('ID manquant');
  uuidSchema.parse(sessionId);
  uuidSchema.parse(recId);

  const [deleted] = await db
    .delete(receptricesGreffage)
    .where(
      and(
        eq(receptricesGreffage.id, recId!),
        eq(receptricesGreffage.sessionId, sessionId!),
        eq(receptricesGreffage.userId, ownerId),
      ),
    )
    .returning({ id: receptricesGreffage.id });
  if (!deleted) notFound('Récepteur introuvable');
  return { data: { id: deleted.id } };
});
