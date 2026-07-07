import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { organisations, campagnesCommande, commandesGroupees } from '~~/server/database/schema';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const query = await getValidatedQuery(event, querySchema.parse);

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, ownerId)));

  if (!campagne) throw notFound('Campagne introuvable');

  const offset = (query.page - 1) * query.limit;

  const [commandes, countRows] = await Promise.all([
    db
      .select()
      .from(commandesGroupees)
      .where(eq(commandesGroupees.campagneId, campagneId))
      .orderBy(desc(commandesGroupees.createdAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(commandesGroupees)
      .where(eq(commandesGroupees.campagneId, campagneId)),
  ]);

  const total = countRows[0]?.total ?? 0;

  return {
    data: commandes,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
});
