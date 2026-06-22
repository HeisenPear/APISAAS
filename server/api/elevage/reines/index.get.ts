import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { reinesElevage, lignees } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  ligneeId: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, active, ligneeId } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(reinesElevage.userId, user.id)];
  if (active !== undefined) conditions.push(eq(reinesElevage.estActive, active));
  if (ligneeId) conditions.push(eq(reinesElevage.ligneeId, ligneeId));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db
      .select({
        reine: reinesElevage,
        ligneeNom: lignees.nom,
        ligneeRace: lignees.race,
      })
      .from(reinesElevage)
      .leftJoin(lignees, eq(reinesElevage.ligneeId, lignees.id))
      .where(where)
      .orderBy(desc(reinesElevage.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reinesElevage)
      .where(where),
  ]);

  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
