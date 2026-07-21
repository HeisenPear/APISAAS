import { eq, and } from 'drizzle-orm';
import { sessionsGreffage, receptricesGreffage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const sessionId = getRouterParam(event, 'id');
  if (!sessionId) badRequest('ID manquant');
  uuidSchema.parse(sessionId);

  const [session] = await db
    .select({ id: sessionsGreffage.id })
    .from(sessionsGreffage)
    .where(and(eq(sessionsGreffage.id, sessionId!), eq(sessionsGreffage.userId, ownerId)))
    .limit(1);
  if (!session) notFound('Session introuvable');

  const rows = await db
    .select()
    .from(receptricesGreffage)
    .where(
      and(eq(receptricesGreffage.sessionId, sessionId!), eq(receptricesGreffage.userId, ownerId)),
    )
    .orderBy(receptricesGreffage.createdAt);

  return { data: rows };
});
