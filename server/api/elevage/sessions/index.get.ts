import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { sessionsGreffage } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  terminee: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, terminee } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(sessionsGreffage.userId, ownerId)];
  if (terminee !== undefined) conditions.push(eq(sessionsGreffage.estTerminee, terminee));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db
      .select()
      .from(sessionsGreffage)
      .where(where)
      .orderBy(desc(sessionsGreffage.dateGreffage))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessionsGreffage)
      .where(where),
  ]);
  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
