import { eq, and, sql, gte, lte, notInArray } from 'drizzle-orm';
import { transactions, ruches, recoltes } from '~~/server/database/schema';
import { anneeParis, jourUtc } from '~~/server/utils/horloge';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const now = new Date();
  // L'année se lit à PARIS : `getFullYear()` répond dans le fuseau du serveur,
  // UTC sur Vercel. Le 1er janvier à 00 h 30 chez l'apiculteur, il est encore
  // 23 h 30 le 31 décembre pour la lambda — l'exercice affiché était l'ANCIEN.
  const annee = anneeParis(now);
  // Les bornes restent en UTC — `dateTransaction` est une date-seule stockée à
  // minuit UTC. `new Date(a, 0, 1)` construisait dans le fuseau de la MACHINE :
  // juste sur Vercel, faux sur un poste réglé à Paris. `jourUtc` le dit.
  const debutAnnee = jourUtc(annee, 1, 1);
  const finAnnee = new Date(jourUtc(annee, 12, 31).getTime() + 86_399_000);

  const userId = ownerId;

  // All financial queries in parallel
  const [ventesResult, achatsResult, ventesParMois, achatsParMois, ruchesCount, productionTotal] =
    await Promise.all([
      // Total ventes this year
      db
        .select({
          total: sql<string>`coalesce(sum(${transactions.total}::numeric), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            notInArray(transactions.statut, ['brouillon', 'annulee']),
            gte(transactions.dateTransaction, debutAnnee),
            lte(transactions.dateTransaction, finAnnee),
          ),
        ),
      // Total achats this year
      db
        .select({
          total: sql<string>`coalesce(sum(${transactions.total}::numeric), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'achat'),
            notInArray(transactions.statut, ['brouillon', 'annulee']),
            gte(transactions.dateTransaction, debutAnnee),
            lte(transactions.dateTransaction, finAnnee),
          ),
        ),
      // Ventes par mois
      db
        .select({
          mois: sql<number>`extract(month from ${transactions.dateTransaction})::int`,
          total: sql<string>`coalesce(sum(${transactions.total}::numeric), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            notInArray(transactions.statut, ['brouillon', 'annulee']),
            gte(transactions.dateTransaction, debutAnnee),
            lte(transactions.dateTransaction, finAnnee),
          ),
        )
        .groupBy(sql`extract(month from ${transactions.dateTransaction})`),
      // Achats par mois
      db
        .select({
          mois: sql<number>`extract(month from ${transactions.dateTransaction})::int`,
          total: sql<string>`coalesce(sum(${transactions.total}::numeric), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'achat'),
            notInArray(transactions.statut, ['brouillon', 'annulee']),
            gte(transactions.dateTransaction, debutAnnee),
            lte(transactions.dateTransaction, finAnnee),
          ),
        )
        .groupBy(sql`extract(month from ${transactions.dateTransaction})`),
      // Count ruches actives
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(ruches)
        .where(and(eq(ruches.userId, userId), eq(ruches.statut, 'active'))),
      // Production totale this year
      db
        .select({
          total: sql<string>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)`,
        })
        .from(recoltes)
        .where(
          and(
            eq(recoltes.userId, userId),
            gte(recoltes.dateRecolte, debutAnnee),
            lte(recoltes.dateRecolte, finAnnee),
          ),
        ),
    ]);

  const ca = Number(ventesResult[0]?.total ?? 0);
  const charges = Number(achatsResult[0]?.total ?? 0);
  const resultat = Math.round((ca - charges) * 100) / 100;
  const nbRuches = ruchesCount[0]?.count ?? 0;
  const productionKg = Number(productionTotal[0]?.total ?? 0);
  const rentabiliteParRuche = nbRuches > 0 ? Math.round((resultat / nbRuches) * 100) / 100 : 0;
  const coutParKg = productionKg > 0 ? Math.round((charges / productionKg) * 100) / 100 : 0;

  // Build monthly arrays (12 months)
  const ventesParMoisMap = new Map(ventesParMois.map((v) => [v.mois, Number(v.total)]));
  const achatsParMoisMap = new Map(achatsParMois.map((a) => [a.mois, Number(a.total)]));
  const moisLabels = [
    'Jan',
    'Fev',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aou',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const ventesData = moisLabels.map((_, i) => ventesParMoisMap.get(i + 1) ?? 0);
  const achatsData = moisLabels.map((_, i) => achatsParMoisMap.get(i + 1) ?? 0);

  return {
    data: {
      ca,
      charges,
      resultat,
      nbVentes: ventesResult[0]?.count ?? 0,
      nbAchats: achatsResult[0]?.count ?? 0,
      rentabiliteParRuche,
      coutParKg,
      productionKg,
      nbRuches,
      graphique: {
        labels: moisLabels,
        ventes: ventesData,
        achats: achatsData,
      },
    },
  };
});
