import { z } from 'zod';
import { eq, and, ilike, sql, inArray } from 'drizzle-orm';
import { ruchers, ruches, emplacements } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  actif: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, actif } = query;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(ruchers.userId, ownerId)];

  if (actif !== undefined) {
    conditions.push(eq(ruchers.actif, actif));
  }

  if (search) {
    conditions.push(ilike(ruchers.nom, `%${escapeIlike(search)}%`));
  }

  const where = and(...conditions);

  // Run data query and count query in parallel
  const [rawData, [countResult]] = await Promise.all([
    db
      .select({
        rucher: ruchers,
        // Emplacement où le rucher est posé (null s'il est à une position libre)
        emplacementNom: emplacements.nom,
        emplacementCommune: emplacements.commune,
      })
      .from(ruchers)
      .leftJoin(emplacements, eq(ruchers.emplacementId, emplacements.id))
      .where(where)
      .orderBy(ruchers.nom)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruchers)
      .where(where),
  ]);

  const total = countResult?.total ?? 0;

  // Fetch ruches count per rucher in a single query
  const rucherIds = rawData.map((r) => r.rucher.id);
  let ruchesCountMap: Record<string, number> = {};

  if (rucherIds.length > 0) {
    const ruchesCountRows = await db
      .select({
        rucherId: ruches.rucherId,
        count: sql<number>`count(*)::int`,
      })
      .from(ruches)
      .where(and(inArray(ruches.rucherId, rucherIds), eq(ruches.userId, ownerId)))
      .groupBy(ruches.rucherId);

    ruchesCountMap = Object.fromEntries(ruchesCountRows.map((r) => [r.rucherId, r.count]));
  }

  const data = rawData.map((r) => ({
    ...r.rucher,
    emplacementNom: r.emplacementNom,
    emplacementCommune: r.emplacementCommune,
    ruchesCount: ruchesCountMap[r.rucher.id] ?? 0,
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
