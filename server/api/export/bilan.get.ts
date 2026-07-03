import { z } from 'zod';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { ruchers, ruches, interventions, recoltes, transactions } from '~~/server/database/schema';

const querySchema = z.object({
  year: z.coerce.number().min(2000).max(2100).default(new Date().getFullYear()),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const yearStart = new Date(`${query.year}-01-01`);
  const yearEnd = new Date(`${query.year}-12-31T23:59:59`);

  // 7 agrégations indépendantes → en parallèle, sous watchdog (route lourde :
  // évite un 504 si le pool est empoisonné, échec rapide + recyclage comme le dashboard).
  const [
    ruchersRows,
    ruchesRows,
    interventionsRows,
    recoltesRows,
    typesMielRows,
    ventesRows,
    achatsRows,
  ] = await dbWatchdog(
    Promise.all([
      db.select({ value: count() }).from(ruchers).where(eq(ruchers.userId, ownerId)),
      db
        .select({ value: count() })
        .from(ruches)
        .where(and(eq(ruches.userId, ownerId), eq(ruches.statut, 'active'))),
      db
        .select({ value: count() })
        .from(interventions)
        .where(
          and(
            eq(interventions.userId, ownerId),
            gte(interventions.dateVisite, yearStart),
            lte(interventions.dateVisite, yearEnd),
          ),
        ),
      db
        .select({ count: count(), totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}), 0)` })
        .from(recoltes)
        .where(
          and(
            eq(recoltes.userId, ownerId),
            gte(recoltes.dateRecolte, yearStart),
            lte(recoltes.dateRecolte, yearEnd),
          ),
        ),
      db
        .select({ type: recoltes.typeMiel, quantite: sql<string>`SUM(${recoltes.quantiteKg})` })
        .from(recoltes)
        .where(
          and(
            eq(recoltes.userId, ownerId),
            gte(recoltes.dateRecolte, yearStart),
            lte(recoltes.dateRecolte, yearEnd),
          ),
        )
        .groupBy(recoltes.typeMiel),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.total}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ownerId),
            eq(transactions.type, 'vente'),
            gte(transactions.dateTransaction, yearStart),
            lte(transactions.dateTransaction, yearEnd),
          ),
        ),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.total}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ownerId),
            eq(transactions.type, 'achat'),
            gte(transactions.dateTransaction, yearStart),
            lte(transactions.dateTransaction, yearEnd),
          ),
        ),
    ]),
    'export/bilan',
    9_000,
  );

  const nbRuchesActives = ruchesRows[0]?.value ?? 0;
  const nbRecoltes = recoltesRows[0]?.count ?? 0;
  const productionTotaleKg = Number(recoltesRows[0]?.totalKg ?? 0);
  const productionParRuche = nbRuchesActives > 0 ? productionTotaleKg / nbRuchesActives : 0;
  const typesMiel = typesMielRows.map((r) => ({
    type: r.type ?? 'Autre',
    quantite: Number(r.quantite ?? 0),
  }));
  const ca = Number(ventesRows[0]?.total ?? 0);
  const charges = Number(achatsRows[0]?.total ?? 0);

  return {
    data: {
      nbRuchers: ruchersRows[0]?.value ?? 0,
      nbRuchesActives,
      nbInterventions: interventionsRows[0]?.value ?? 0,
      nbRecoltes,
      productionTotaleKg,
      productionParRuche,
      typesMiel,
      ca,
      charges,
      resultat: ca - charges,
    },
  };
});
