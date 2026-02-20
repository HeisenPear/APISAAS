import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { ruches, recoltes, transactions, alertes, inspections } from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';

interface InspectionRow {
  rucheId: string;
  numero: string;
  rucherId: string;
  rucherNom: string;
  statut: string;
  qualiteReine: string | null;
  dateVisite: Date | string | null;
  forceColonie: number | null;
  couvain: number | null;
  reserves: number | null;
  reineVue: boolean | null;
  varroa: number | null;
  comportement: string | null;
  signeEssaimage: boolean | null;
  maladieObservee: string | null;
}

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
    ruchesAvecInspectionsResult,
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
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, startOfYear))),

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
          gte(transactions.dateTransaction, startOfYear),
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
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, startOfYear)))
      .groupBy(sql`extract(month from ${recoltes.dateRecolte})`)
      .orderBy(sql`extract(month from ${recoltes.dateRecolte})`),

    // j. Ruches with latest inspection (for health score)
    db.execute(sql`
      SELECT
        r.id AS ruche_id,
        r.numero,
        r.rucher_id,
        rc.nom AS rucher_nom,
        r.statut,
        r.qualite_reine,
        li.date_visite,
        li.force_colonie,
        li.couvain,
        li.reserves,
        li.reine_vue,
        li.varroa,
        li.comportement,
        li.signe_essaimage,
        li.maladie_observee
      FROM ruches r
      JOIN ruchers rc ON rc.id = r.rucher_id
      LEFT JOIN LATERAL (
        SELECT i.date_visite, i.force_colonie, i.couvain, i.reserves,
               i.reine_vue, i.varroa, i.comportement, i.signe_essaimage, i.maladie_observee
        FROM inspections i
        WHERE i.ruche_id = r.id
        ORDER BY i.date_visite DESC
        LIMIT 1
      ) li ON true
      WHERE r.user_id = ${userId}
    `),
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

  // --- Compute health scores ---
  interface RucheInspRow {
    ruche_id: string;
    numero: string;
    rucher_id: string;
    rucher_nom: string;
    statut: string;
    qualite_reine: string | null;
    date_visite: string | null;
    force_colonie: number | null;
    couvain: number | null;
    reserves: number | null;
    reine_vue: boolean | null;
    varroa: number | null;
    comportement: string | null;
    signe_essaimage: boolean | null;
    maladie_observee: string | null;
  }
  const rows = ruchesAvecInspectionsResult as unknown as RucheInspRow[];
  const rucheScores = rows.map((row) => {
    const mapped: InspectionRow = {
      rucheId: row.ruche_id,
      numero: row.numero,
      rucherId: row.rucher_id,
      rucherNom: row.rucher_nom,
      statut: row.statut,
      qualiteReine: row.qualite_reine,
      dateVisite: row.date_visite,
      forceColonie: row.force_colonie,
      couvain: row.couvain,
      reserves: row.reserves,
      reineVue: row.reine_vue,
      varroa: row.varroa,
      comportement: row.comportement,
      signeEssaimage: row.signe_essaimage,
      maladieObservee: row.maladie_observee,
    };
    return {
      rucheId: mapped.rucheId,
      numero: mapped.numero,
      rucherId: mapped.rucherId,
      score: computeScore(mapped),
      dernierControle: mapped.dateVisite ? String(mapped.dateVisite) : null,
      statut: mapped.statut,
    };
  });

  // Score par rucher
  const rucherMap = new Map<string, { nom: string; scores: number[] }>();
  for (const r of rows) {
    if (!rucherMap.has(r.rucher_id)) {
      rucherMap.set(r.rucher_id, { nom: r.rucher_nom, scores: [] });
    }
  }
  for (const rs of rucheScores) {
    const entry = rucherMap.get(rs.rucherId);
    if (entry) entry.scores.push(rs.score);
  }
  const parRucher = Array.from(rucherMap.entries()).map(([rucherId, { nom, scores }]) => ({
    rucherId,
    nom,
    score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    nbRuches: scores.length,
  }));

  // Score global (mean of all active hive scores)
  const activeScores = rucheScores.filter((r) => r.statut === 'active');
  const global =
    activeScores.length > 0
      ? Math.round(activeScores.reduce((a, b) => a + b.score, 0) / activeScores.length)
      : 0;

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
      scoreSante: {
        global,
        parRucher,
        parRuche: rucheScores,
      },
    },
  };
});
