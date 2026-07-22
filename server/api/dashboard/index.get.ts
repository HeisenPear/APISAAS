import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { ruches, recoltes, transactions, alertes, interventions } from '~~/server/database/schema';
import { computeHiveScore, computeRucherScore } from '~~/server/utils/santeScore';

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
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

  // Run all aggregate queries in parallel
  const runQueries = () =>
    Promise.all([
      // c. Ruches par statut (donut) — sert AUSSI à dériver « ruches actives » et « total »
      // en JS, ce qui évite 2 COUNT redondants sur la même table.
      db
        .select({
          statut: ruches.statut,
          count: sql<number>`count(*)::int`,
        })
        .from(ruches)
        .where(eq(ruches.userId, ownerId))
        .groupBy(ruches.statut),

      // d. Production saison: sum of quantiteKg for current year
      db
        .select({
          total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
        })
        .from(recoltes)
        .where(and(eq(recoltes.userId, ownerId), gte(recoltes.dateRecolte, startOfYear))),

      // e. CA total: sum of transactions.total where type='vente' for current year
      db
        .select({
          total: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ownerId),
            eq(transactions.type, 'vente'),
            gte(transactions.dateTransaction, startOfYear),
          ),
        ),

      // g. Alertes actives (non lues)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(alertes)
        .where(and(eq(alertes.userId, ownerId), eq(alertes.lue, false))),

      // h-1. Dernieres interventions (for activity feed)
      db
        .select({
          id: interventions.id,
          type: interventions.type,
          date: interventions.dateVisite,
          description: sql<string>`initcap(COALESCE(${interventions.type}, 'intervention')) || ' — ' || to_char(${interventions.dateVisite}, 'DD/MM/YYYY')`,
          metadata: sql<string>`json_build_object('type', ${interventions.type}, 'rucheId', ${interventions.rucheId})`,
        })
        .from(interventions)
        .where(eq(interventions.userId, ownerId))
        .orderBy(desc(interventions.dateVisite))
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
        .where(eq(recoltes.userId, ownerId))
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
        .where(eq(transactions.userId, ownerId))
        .orderBy(desc(transactions.dateTransaction))
        .limit(10),

      // i. Production mensuelle for current year (area chart)
      db
        .select({
          mois: sql<number>`extract(month from ${recoltes.dateRecolte})::int`,
          total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
        })
        .from(recoltes)
        .where(and(eq(recoltes.userId, ownerId), gte(recoltes.dateRecolte, startOfYear)))
        .groupBy(sql`extract(month from ${recoltes.dateRecolte})`)
        .orderBy(sql`extract(month from ${recoltes.dateRecolte})`),

      // j. Ruches with latest controle inspection (for health score)
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
        SELECT
          i.date_visite,
          COALESCE((i.donnees->>'force_colonie')::int, i.force_colonie) AS force_colonie,
          CASE WHEN i.donnees->>'reine_vue' IS NOT NULL THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
          CASE WHEN i.donnees->>'couvain_present' IS NOT NULL THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
          CASE WHEN i.donnees->>'reserves_presentes' IS NOT NULL THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
          COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
          i.varroa, i.signe_essaimage, i.maladie_observee
        FROM interventions i
        WHERE i.ruche_id = r.id
          AND i.type = 'controle'
        ORDER BY i.date_visite DESC
        LIMIT 1
      ) li ON true
      WHERE r.user_id = ${ownerId}
      LIMIT 1000
    `),

      // k. Top 5 alertes non lues récentes
      db
        .select({
          id: alertes.id,
          type: alertes.type,
          titre: alertes.titre,
          message: alertes.message,
          priorite: alertes.priorite,
          actionUrl: alertes.actionUrl,
        })
        .from(alertes)
        .where(and(eq(alertes.userId, ownerId), eq(alertes.lue, false)))
        .orderBy(desc(alertes.createdAt))
        .limit(5),
    ]);

  // Watchdog + une relance : si le pool de la lambda est empoisonné (sockets
  // morts après gel — cf. resetDb), la 1re tentative pend ou échoue avec une
  // connexion morte (CONNECTION_DESTROYED etc.), le watchdog recycle le pool
  // dans les deux cas (cf. isDeadConnectionError), et la relance aboutit sur
  // des connexions neuves. L'utilisateur reçoit ses données dans la MÊME
  // requête au lieu d'un 504/500 après 30 s.
  const results = await withDbRetry(runQueries, 'dashboard', 9_000);

  const [
    ruchesByStatutResult,
    productionSaisonResult,
    caTotalResult,
    alertesActivesResult,
    dernieresInspectionsResult,
    dernieresRecoltesResult,
    dernieresTransactionsResult,
    productionMensuelleResult,
    ruchesAvecInspectionsResult,
    alertesRecentesResult,
  ] = results;

  // Ruches actives + total dérivés du groupBy par statut (pas de requête dédiée).
  const totalRuches = ruchesByStatutResult.reduce((s, r) => s + r.count, 0);
  const ruchesActives = ruchesByStatutResult.find((r) => r.statut === 'active')?.count ?? 0;

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
      score: computeHiveScore(mapped).score,
      dernierControle: mapped.dateVisite ? String(mapped.dateVisite) : null,
      statut: mapped.statut,
    };
  });

  // Score par rucher — état global de ses ruches comptabilisées
  const rucherMap = new Map<
    string,
    { nom: string; hives: { score: number | null; statut: string }[] }
  >();
  for (const r of rows) {
    if (!rucherMap.has(r.rucher_id)) rucherMap.set(r.rucher_id, { nom: r.rucher_nom, hives: [] });
  }
  for (const rs of rucheScores) {
    rucherMap.get(rs.rucherId)?.hives.push({ score: rs.score, statut: rs.statut });
  }
  const parRucher = Array.from(rucherMap.entries()).map(([rucherId, { nom, hives }]) => {
    const agg = computeRucherScore(hives);
    return { rucherId, nom, score: agg.score ?? 0, nbRuches: agg.nbRuches };
  });

  // Score global = état global de toutes les ruches comptabilisées
  const global = computeRucherScore(rucheScores).score ?? 0;

  return {
    data: {
      kpis: {
        ruchesActives,
        totalRuches,
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
        parRuche: rucheScores.map((r) => ({ ...r, score: r.score ?? 0 })),
      },
      alertesRecentes: alertesRecentesResult,
    },
  };
});
