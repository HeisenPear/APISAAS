import { eq, and, sql, gte } from 'drizzle-orm';
import { ruchers, ruches, interventions, recoltes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Verify ownership
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, ownerId)))
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
      .where(and(eq(ruches.rucherId, id), eq(ruches.userId, ownerId))),

    // Derniere visite
    db
      .select({ date: sql<string>`max(${interventions.dateVisite})` })
      .from(interventions)
      .innerJoin(ruches, eq(interventions.rucheId, ruches.id))
      .where(and(eq(ruches.rucherId, id), eq(interventions.userId, ownerId))),

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
          eq(recoltes.userId, ownerId),
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
