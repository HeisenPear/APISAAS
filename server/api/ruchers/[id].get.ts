import { eq, and, sql } from 'drizzle-orm';
import { ruchers, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    badRequest('ID manquant');
  }

  uuidSchema.parse(id);

  // Fetch rucher and count of ruches in parallel
  const [[rucher], [countResult]] = await Promise.all([
    db
      .select()
      .from(ruchers)
      .where(and(eq(ruchers.id, id), eq(ruchers.userId, ownerId)))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ruches)
      .where(and(eq(ruches.rucherId, id), eq(ruches.userId, ownerId))),
  ]);

  if (!rucher) {
    notFound('Rucher introuvable');
  }

  return {
    data: {
      ...rucher,
      ruchesCount: countResult?.count ?? 0,
    },
  };
});
