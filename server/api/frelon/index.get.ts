import { eq, desc } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

/** GET /api/frelon — signalements de frelons de l'exploitation. */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const rows = await db
    .select()
    .from(signalementsFrelon)
    .where(eq(signalementsFrelon.userId, ownerId))
    .orderBy(desc(signalementsFrelon.dateObservation));

  return { data: rows };
});
