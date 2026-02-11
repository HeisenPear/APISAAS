import { eq, and, sql, gte } from 'drizzle-orm';
import { ruchers, ruches, inspections, recoltes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Verify ownership
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, user.id)))
    .limit(1);

  if (!rucher) notFound('Rucher introuvable');

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [ruchesStats, derniereVisiteResult, productionResult] = await Promise.all([
    // Ruches count + actives
    db
      .select({
        total: sql<number>`count(*)::int`,
        actives: sql<number>`count(*) filter (where ${ruches.statut} = 'active')::int`,
      })
      .from(ruches)
      .where(and(eq(ruches.rucherId, id), eq(ruches.userId, user.id))),

    // Derniere visite
    db
      .select({ date: sql<string>`max(${inspections.dateVisite})` })
      .from(inspections)
      .innerJoin(ruches, eq(inspections.rucheId, ruches.id))
      .where(and(eq(ruches.rucherId, id), eq(inspections.userId, user.id))),

    // Production saison
    db
      .select({
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .innerJoin(ruches, eq(recoltes.rucheId, ruches.id))
      .where(
        and(
          eq(ruches.rucherId, id),
          eq(recoltes.userId, user.id),
          gte(recoltes.dateRecolte, startOfYear),
        ),
      ),
  ]);

  return {
    data: {
      totalRuches: ruchesStats[0]?.total ?? 0,
      ruchesActives: ruchesStats[0]?.actives ?? 0,
      derniereVisite: derniereVisiteResult[0]?.date ?? null,
      productionSaison: productionResult[0]?.total ?? 0,
    },
  };
});
