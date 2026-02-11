import { eq, and, sql, desc } from 'drizzle-orm';
import { ruches, recoltes, transactions, alertes, inspections } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const userId = user.id;

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

  // Run all aggregate queries in parallel
  const [
    ruchesActiveResult,
    totalRuchesResult,
    ruchesByStatutResult,
    productionSaisonResult,
    caTotalResult,
    alertesActivesResult,
    dernieresInspectionsResult,
    dernieresRecoltesResult,
    dernieresTransactionsResult,
    productionMensuelleResult,
  ] = await Promise.all([
    // a. Ruches actives
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ruches)
      .where(and(eq(ruches.userId, userId), eq(ruches.statut, 'active'))),

    // b. Total ruches
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ruches)
      .where(eq(ruches.userId, userId)),

    // c. Ruches count by statut (for donut chart)
    db
      .select({
        statut: ruches.statut,
        count: sql<number>`count(*)::int`,
      })
      .from(ruches)
      .where(eq(ruches.userId, userId))
      .groupBy(ruches.statut),

    // d. Production saison: sum of quantiteKg for current year
    db
      .select({
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), sql`${recoltes.dateRecolte} >= ${startOfYear}`)),

    // e. CA total: sum of transactions.total where type='vente' for current year
    db
      .select({
        total: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'vente'),
          sql`${transactions.dateTransaction} >= ${startOfYear}`,
        ),
      ),

    // g. Alertes actives (non lues)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(alertes)
      .where(and(eq(alertes.userId, userId), eq(alertes.lue, false))),

    // h-1. Dernieres inspections (for activity feed)
    db
      .select({
        id: inspections.id,
        type: sql<string>`'inspection'`,
        date: inspections.dateVisite,
        description: sql<string>`'Inspection du ' || to_char(${inspections.dateVisite}, 'DD/MM/YYYY')`,
        metadata: sql<string>`json_build_object('type', ${inspections.type}, 'rucheId', ${inspections.rucheId})`,
      })
      .from(inspections)
      .where(eq(inspections.userId, userId))
      .orderBy(desc(inspections.dateVisite))
      .limit(10),

    // h-2. Dernieres recoltes (for activity feed)
    db
      .select({
        id: recoltes.id,
        type: sql<string>`'recolte'`,
        date: recoltes.dateRecolte,
        description: sql<string>`'Recolte de ' || coalesce(${recoltes.quantiteKg}, '0') || ' kg'`,
        metadata: sql<string>`json_build_object('typeMiel', ${recoltes.typeMiel}, 'quantiteKg', ${recoltes.quantiteKg})`,
      })
      .from(recoltes)
      .where(eq(recoltes.userId, userId))
      .orderBy(desc(recoltes.dateRecolte))
      .limit(10),

    // h-3. Dernieres transactions (for activity feed)
    db
      .select({
        id: transactions.id,
        type: sql<string>`'transaction'`,
        date: transactions.dateTransaction,
        description: sql<string>`case when ${transactions.type} = 'vente' then 'Vente' else 'Achat' end || ' - ' || coalesce(${transactions.total}, '0') || ' EUR'`,
        metadata: sql<string>`json_build_object('type', ${transactions.type}, 'total', ${transactions.total}, 'statut', ${transactions.statut})`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.dateTransaction))
      .limit(10),

    // i. Production mensuelle for current year (area chart)
    db
      .select({
        mois: sql<number>`extract(month from ${recoltes.dateRecolte})::int`,
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), sql`${recoltes.dateRecolte} >= ${startOfYear}`))
      .groupBy(sql`extract(month from ${recoltes.dateRecolte})`)
      .orderBy(sql`extract(month from ${recoltes.dateRecolte})`),
  ]);

  // Merge and sort activity feed (top 10 most recent across all types)
  const activiteRecente = [
    ...dernieresInspectionsResult,
    ...dernieresRecoltesResult,
    ...dernieresTransactionsResult,
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Build full month array (1-12) with zero-fill for missing months
  const productionByMonth = new Map(productionMensuelleResult.map((r) => [r.mois, r.total]));
  const productionMensuelle = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    total: productionByMonth.get(i + 1) ?? 0,
  }));

  return {
    data: {
      kpis: {
        ruchesActives: ruchesActiveResult[0]?.count ?? 0,
        totalRuches: totalRuchesResult[0]?.count ?? 0,
        productionSaison: productionSaisonResult[0]?.total ?? 0,
        caTotal: caTotalResult[0]?.total ?? 0,
        alertesActives: alertesActivesResult[0]?.count ?? 0,
      },
      santeColonies: ruchesByStatutResult,
      productionMensuelle,
      activiteRecente,
    },
  };
});
