import { z } from 'zod';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { ruchers, ruches, interventions, recoltes, transactions } from '~~/server/database/schema';

const querySchema = z.object({
  year: z.coerce.number().min(2000).max(2100).default(new Date().getFullYear()),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const yearStart = new Date(`${query.year}-01-01`);
  const yearEnd = new Date(`${query.year}-12-31T23:59:59`);

  // Ruchers count
  const [ruchersCount] = await db
    .select({ value: count() })
    .from(ruchers)
    .where(eq(ruchers.userId, user.id));

  // Ruches actives count
  const [ruchesCount] = await db
    .select({ value: count() })
    .from(ruches)
    .where(and(eq(ruches.userId, user.id), eq(ruches.statut, 'active')));

  // Interventions count for year (table = interventions, date = dateVisite)
  const [interventionsCount] = await db
    .select({ value: count() })
    .from(interventions)
    .where(
      and(
        eq(interventions.userId, user.id),
        gte(interventions.dateVisite, yearStart),
        lte(interventions.dateVisite, yearEnd),
      ),
    );

  // Recoltes for year
  const recoltesRows = await db
    .select({
      count: count(),
      totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}), 0)`,
    })
    .from(recoltes)
    .where(
      and(
        eq(recoltes.userId, user.id),
        gte(recoltes.dateRecolte, yearStart),
        lte(recoltes.dateRecolte, yearEnd),
      ),
    );

  const nbRecoltes = recoltesRows[0]?.count ?? 0;
  const productionTotaleKg = Number(recoltesRows[0]?.totalKg ?? 0);
  const nbRuchesActives = ruchesCount?.value ?? 0;
  const productionParRuche = nbRuchesActives > 0 ? productionTotaleKg / nbRuchesActives : 0;

  // Production by type
  const typesMielRows = await db
    .select({
      type: recoltes.typeMiel,
      quantite: sql<string>`SUM(${recoltes.quantiteKg})`,
    })
    .from(recoltes)
    .where(
      and(
        eq(recoltes.userId, user.id),
        gte(recoltes.dateRecolte, yearStart),
        lte(recoltes.dateRecolte, yearEnd),
      ),
    )
    .groupBy(recoltes.typeMiel);

  const typesMiel = typesMielRows.map((r) => ({
    type: r.type ?? 'Autre',
    quantite: Number(r.quantite ?? 0),
  }));

  // Finances for year
  const [ventesRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.total}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'vente'),
        gte(transactions.dateTransaction, yearStart),
        lte(transactions.dateTransaction, yearEnd),
      ),
    );

  const [achatsRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.total}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'achat'),
        gte(transactions.dateTransaction, yearStart),
        lte(transactions.dateTransaction, yearEnd),
      ),
    );

  const ca = Number(ventesRow?.total ?? 0);
  const charges = Number(achatsRow?.total ?? 0);

  return {
    data: {
      nbRuchers: ruchersCount?.value ?? 0,
      nbRuchesActives,
      nbInterventions: interventionsCount?.value ?? 0,
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
