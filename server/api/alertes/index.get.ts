import { eq, and, desc, sql } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  lue: z.enum(['true', 'false', 'all']).default('all'),
  priorite: z.enum(['critique', 'haute', 'moyenne', 'basse', 'all']).default('all'),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const q = querySchema.parse(getQuery(event));

  const conditions = [eq(alertes.userId, user.id)];
  if (q.lue !== 'all') conditions.push(eq(alertes.lue, q.lue === 'true'));
  if (q.priorite !== 'all') conditions.push(eq(alertes.priorite, q.priorite));

  const where = and(...conditions);
  const offset = (q.page - 1) * q.limit;

  const [data, [countRow]] = await Promise.all([
    db
      .select()
      .from(alertes)
      .where(where)
      .orderBy(desc(alertes.createdAt))
      .limit(q.limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(alertes)
      .where(where),
  ]);

  const total = countRow?.total ?? 0;

  return {
    data,
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
    },
  };
});
