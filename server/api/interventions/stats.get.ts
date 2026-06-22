import { eq, and, sql, gte } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const conditions = [eq(interventions.userId, user.id), sql`${interventions.donnees} IS NOT NULL`];

  // Stats par type
  const parType = await db
    .select({
      type: interventions.type,
      count: sql<number>`count(*)::int`,
    })
    .from(interventions)
    .where(and(...conditions, gte(interventions.dateVisite, startOfYear)))
    .groupBy(interventions.type);

  // Total annee
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(interventions)
    .where(and(...conditions, gte(interventions.dateVisite, startOfYear)));

  // Par mois (annee en cours)
  const parMois = await db
    .select({
      mois: sql<number>`EXTRACT(MONTH FROM ${interventions.dateVisite})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(interventions)
    .where(and(...conditions, gte(interventions.dateVisite, startOfYear)))
    .groupBy(sql`EXTRACT(MONTH FROM ${interventions.dateVisite})`);

  return {
    data: {
      annee: now.getFullYear(),
      total: totals?.total ?? 0,
      parType,
      parMois,
    },
  };
});
