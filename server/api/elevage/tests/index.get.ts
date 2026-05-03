import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { testsPerformance } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  reineId: z.string().uuid().optional(),
  saison: z.coerce.number().int().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, reineId, saison } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(testsPerformance.userId, user.id)];
  if (reineId) conditions.push(eq(testsPerformance.reineId, reineId));
  if (saison) conditions.push(eq(testsPerformance.saison, saison));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db.select().from(testsPerformance).where(where).orderBy(desc(testsPerformance.dateEvaluation)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(testsPerformance).where(where),
  ]);
  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
