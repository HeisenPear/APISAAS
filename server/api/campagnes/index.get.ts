import { eq, sql, ilike, and } from 'drizzle-orm';
import { organisations, campagnesCommande, commandesGroupees } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);

  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  // Find user's organisation
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, ownerId))
    .limit(1);

  if (!org) {
    return {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  // Build conditions
  const conditions = [eq(campagnesCommande.organisationId, org.id)];
  if (search) {
    conditions.push(ilike(campagnesCommande.nom, `%${escapeIlike(search)}%`));
  }

  const where = and(...conditions);

  // Fetch campagnes + count in parallel
  const [rawData, [countResult]] = await Promise.all([
    db
      .select()
      .from(campagnesCommande)
      .where(where)
      .orderBy(campagnesCommande.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(campagnesCommande)
      .where(where),
  ]);

  const total = countResult?.total ?? 0;

  // Count commandes per campagne
  const campagneIds = rawData.map((c) => c.id);
  let commandesCountMap: Record<string, number> = {};

  if (campagneIds.length > 0) {
    const countRows = await db
      .select({
        campagneId: commandesGroupees.campagneId,
        count: sql<number>`count(*)::int`,
      })
      .from(commandesGroupees)
      .where(sql`${commandesGroupees.campagneId} = ANY(${campagneIds})`)
      .groupBy(commandesGroupees.campagneId);

    commandesCountMap = Object.fromEntries(countRows.map((r) => [r.campagneId, r.count]));
  }

  const data = rawData.map((c) => ({
    ...c,
    commandesCount: commandesCountMap[c.id] ?? 0,
  }));

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
