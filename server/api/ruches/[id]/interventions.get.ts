import { eq, and, desc, sql } from 'drizzle-orm';
import { ruches, interventions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, ownerId)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  const [data, [countResult]] = await Promise.all([
    db
      .select()
      .from(interventions)
      .where(and(eq(interventions.rucheId, id), eq(interventions.userId, ownerId)))
      .orderBy(desc(interventions.dateVisite))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(interventions)
      .where(and(eq(interventions.rucheId, id), eq(interventions.userId, ownerId))),
  ]);

  const total = countResult?.total ?? 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
