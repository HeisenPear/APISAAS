import { eq, and, sql, gte } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import { anneeParis, jourUtc } from '~~/server/utils/horloge';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const now = new Date();
  // L'année se lit à PARIS : `getFullYear()` répond dans le fuseau du serveur,
  // UTC sur Vercel. Le 1er janvier à 00 h 30 chez l'apiculteur, il est encore
  // 23 h 30 le 31 décembre pour la lambda — l'exercice affiché était l'ANCIEN.
  const startOfYear = jourUtc(anneeParis(now), 1, 1);

  const conditions = [eq(interventions.userId, ownerId), sql`${interventions.donnees} IS NOT NULL`];

  // 3 agrégations indépendantes → en parallèle (fluidité, aucune dépendance entre elles).
  const [parType, totalsRows, parMois] = await Promise.all([
    // Stats par type
    db
      .select({ type: interventions.type, count: sql<number>`count(*)::int` })
      .from(interventions)
      .where(and(...conditions, gte(interventions.dateVisite, startOfYear)))
      .groupBy(interventions.type),
    // Total annee
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(interventions)
      .where(and(...conditions, gte(interventions.dateVisite, startOfYear))),
    // Par mois (annee en cours)
    db
      .select({
        mois: sql<number>`EXTRACT(MONTH FROM ${interventions.dateVisite})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(interventions)
      .where(and(...conditions, gte(interventions.dateVisite, startOfYear)))
      .groupBy(sql`EXTRACT(MONTH FROM ${interventions.dateVisite})`),
  ]);
  const totals = totalsRows[0];

  return {
    data: {
      annee: anneeParis(now),
      total: totals?.total ?? 0,
      parType,
      parMois,
    },
  };
});
