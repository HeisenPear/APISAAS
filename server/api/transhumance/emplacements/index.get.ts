import { z } from 'zod';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { emplacements } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  actif: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, actif } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(emplacements.userId, user.id)];
  if (actif !== undefined) conditions.push(eq(emplacements.estActif, actif));
  if (search) conditions.push(ilike(emplacements.nom, `%${escapeIlike(search)}%`));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db.select().from(emplacements).where(where).orderBy(desc(emplacements.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(emplacements).where(where),
  ]);

  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
