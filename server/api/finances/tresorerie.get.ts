import { z } from 'zod';
import { eq, and, gte, ne, sql } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';
import {
  projeterTresorerie,
  type ChargeRecurrente,
  type HistoriqueMois,
} from '~~/server/utils/tresorerie';

const querySchema = z.object({
  soldeActuel: z.coerce.number().default(0),
  horizon: z.coerce.number().int().min(1).max(24).default(12),
  lookbackYears: z.coerce.number().int().min(1).max(5).default(3),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const { soldeActuel, horizon, lookbackYears } = await getValidatedQuery(event, querySchema.parse);

  const now = new Date();
  const anneeCourante = now.getFullYear();
  const moisCourant = now.getMonth() + 1;
  const dateDebut = new Date(Date.UTC(anneeCourante - lookbackYears, 0, 1));

  // Historique mensuel réalisé (hors brouillons), ventes & achats par mois.
  const histoRows = await db
    .select({
      annee: sql<number>`extract(year from ${transactions.dateTransaction})::int`,
      mois: sql<number>`extract(month from ${transactions.dateTransaction})::int`,
      ventes: sql<string>`coalesce(sum(case when ${transactions.type} = 'vente' then ${transactions.total} else 0 end), 0)`,
      achats: sql<string>`coalesce(sum(case when ${transactions.type} = 'achat' then ${transactions.total} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        gte(transactions.dateTransaction, dateDebut),
        ne(transactions.statut, 'brouillon'),
      ),
    )
    .groupBy(
      sql`extract(year from ${transactions.dateTransaction})`,
      sql`extract(month from ${transactions.dateTransaction})`,
    );

  const historique: HistoriqueMois[] = histoRows.map((r) => ({
    annee: r.annee,
    mois: r.mois,
    ventes: Number(r.ventes),
    achats: Number(r.achats),
  }));

  // Charges récurrentes connues (achats récurrents).
  const recurRows = await db
    .select({
      categorie: transactions.categorie,
      notes: transactions.notes,
      total: transactions.total,
      recurringInterval: transactions.recurringInterval,
      nextRecurringDate: transactions.nextRecurringDate,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'achat'),
        eq(transactions.isRecurring, true),
      ),
    );

  const recurrents: ChargeRecurrente[] = recurRows
    .filter(
      (r) =>
        r.total !== null && (r.recurringInterval === 'mensuel' || r.recurringInterval === 'annuel'),
    )
    .map((r) => ({
      libelle: r.categorie || r.notes?.slice(0, 40) || 'Charge récurrente',
      montant: Number(r.total),
      intervalle: r.recurringInterval as 'mensuel' | 'annuel',
      moisProchain: r.nextRecurringDate
        ? new Date(r.nextRecurringDate).getMonth() + 1
        : moisCourant,
    }));

  const resultat = projeterTresorerie({
    historique,
    recurrents,
    soldeActuel,
    horizonMois: horizon,
    anneeCourante,
    moisCourant,
  });

  return {
    ...resultat,
    recurrents,
    parametres: { soldeActuel, horizon, lookbackYears },
    aHistorique: historique.length > 0,
  };
});
