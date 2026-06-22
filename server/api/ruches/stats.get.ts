import { eq, and, sql } from 'drizzle-orm';
import { ruches, recoltes, interventions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const [ruchesStats, productionResult, interventionsResult] = await Promise.all([
    // Ruches by status
    db
      .select({
        total: sql<number>`count(*)::int`,
        actives: sql<number>`count(*) filter (where ${ruches.statut} = 'active')::int`,
        faibles: sql<number>`count(*) filter (where ${ruches.statut} = 'faible')::int`,
      })
      .from(ruches)
      .where(eq(ruches.userId, user.id)),
    // Total production
    db
      .select({
        total: sql<string>`coalesce(sum(${recoltes.quantiteKg}), 0)`,
      })
      .from(recoltes)
      .where(
        and(
          eq(recoltes.userId, user.id),
          sql`extract(year from ${recoltes.dateRecolte}) = extract(year from now())`,
        ),
      ),
    // Interventions this month
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(interventions)
      .where(
        and(
          eq(interventions.userId, user.id),
          sql`${interventions.dateVisite} >= date_trunc('month', now())`,
        ),
      ),
  ]);

  return {
    data: {
      totalRuches: ruchesStats[0]?.total ?? 0,
      actives: ruchesStats[0]?.actives ?? 0,
      faibles: ruchesStats[0]?.faibles ?? 0,
      productionTotale: Number(productionResult[0]?.total ?? 0),
      interventionsMois: interventionsResult[0]?.total ?? 0,
    },
  };
});
