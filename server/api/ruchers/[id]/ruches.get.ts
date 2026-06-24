import { eq, and, sql } from 'drizzle-orm';
import { ruchers, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Verify rucher ownership
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, ownerId)))
    .limit(1);

  if (!rucher) notFound('Rucher introuvable');

  const [data, [countResult]] = await Promise.all([
    db
      .select()
      .from(ruches)
      .where(and(eq(ruches.rucherId, id), eq(ruches.userId, ownerId)))
      .orderBy(ruches.numero)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruches)
      .where(and(eq(ruches.rucherId, id), eq(ruches.userId, ownerId))),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total: countResult?.total ?? 0,
      totalPages: Math.ceil((countResult?.total ?? 0) / limit),
    },
  };
});
