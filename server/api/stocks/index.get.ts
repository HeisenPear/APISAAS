import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { stocks } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  categorie: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, categorie } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(stocks.userId, ownerId)];

  if (categorie) {
    conditions.push(
      eq(stocks.categorie, categorie as (typeof stocks.categorie.enumValues)[number]),
    );
  }

  if (search) {
    const escaped = '%' + escapeIlike(search) + '%';
    conditions.push(
      sql`(${stocks.nom} ILIKE ${escaped} OR ${stocks.fournisseur} ILIKE ${escaped})`,
    );
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select()
      .from(stocks)
      .where(where)
      .orderBy(desc(stocks.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(stocks)
      .where(where),
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
