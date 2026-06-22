import { z } from 'zod';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { lignees } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, active } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(lignees.userId, user.id)];
  if (active !== undefined) conditions.push(eq(lignees.estActive, active));
  if (search) conditions.push(ilike(lignees.nom, `%${escapeIlike(search)}%`));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db
      .select()
      .from(lignees)
      .where(where)
      .orderBy(desc(lignees.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(lignees)
      .where(where),
  ]);
  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
