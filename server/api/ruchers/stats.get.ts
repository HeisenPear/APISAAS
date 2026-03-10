import { eq, and, sql } from 'drizzle-orm';
import { ruchers, ruches, recoltes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const [ruchersCount, ruchesStats, productionResult] = await Promise.all([
    // Total ruchers
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruchers)
      .where(eq(ruchers.userId, user.id)),
    // Ruches stats
    db
      .select({
        total: sql<number>`count(*)::int`,
        actives: sql<number>`count(*) filter (where ${ruches.statut} = 'active')::int`,
      })
      .from(ruches)
      .where(eq(ruches.userId, user.id)),
    // Production saison (current year)
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
  ]);

  return {
    data: {
      totalRuchers: ruchersCount[0]?.total ?? 0,
      totalRuches: ruchesStats[0]?.total ?? 0,
      ruchesActives: ruchesStats[0]?.actives ?? 0,
      productionSaison: Number(productionResult[0]?.total ?? 0),
    },
  };
});
