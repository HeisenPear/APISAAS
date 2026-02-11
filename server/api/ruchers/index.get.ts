import { z } from 'zod';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  actif: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, actif } = query;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(ruchers.userId, user.id)];

  if (actif !== undefined) {
    conditions.push(eq(ruchers.actif, actif));
  }

  if (search) {
    conditions.push(ilike(ruchers.nom, `%${search}%`));
  }

  const where = and(...conditions);

  // Run data query and count query in parallel
  const [data, [countResult]] = await Promise.all([
    db.select().from(ruchers).where(where).orderBy(ruchers.nom).limit(limit).offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruchers)
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
