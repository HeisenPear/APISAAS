import { eq, and, sql, gte } from 'drizzle-orm';
import { inspections } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const conditions = [eq(inspections.userId, user.id), sql`${inspections.donnees} IS NOT NULL`];

  // Stats par type
  const parType = await db
    .select({
      type: inspections.type,
      count: sql<number>`count(*)::int`,
    })
    .from(inspections)
    .where(and(...conditions, gte(inspections.dateVisite, startOfYear)))
    .groupBy(inspections.type);

  // Total annee
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(inspections)
    .where(and(...conditions, gte(inspections.dateVisite, startOfYear)));

  // Par mois (annee en cours)
  const parMois = await db
    .select({
      mois: sql<number>`EXTRACT(MONTH FROM ${inspections.dateVisite})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(inspections)
    .where(and(...conditions, gte(inspections.dateVisite, startOfYear)))
    .groupBy(sql`EXTRACT(MONTH FROM ${inspections.dateVisite})`);

  return {
    data: {
      annee: now.getFullYear(),
      total: totals?.total ?? 0,
      parType,
      parMois,
    },
  };
});
