import { sql } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  annee: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * GET /api/analytics
 * Tableau de bord analytics : production mensuelle, santé par rucher, rentabilité
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const annee = query.annee ?? new Date().getFullYear();
  const debutAnnee = `${annee}-01-01T00:00:00.000Z`;
  const finAnnee = `${annee}-12-31T23:59:59.999Z`;

  const [productionMensuelle, interventionsMensuelles, chiffreAffaires, totalRuches] =
    await Promise.all([
      // Production mensuelle par type de produit
      db.execute(sql`
        SELECT
          EXTRACT(MONTH FROM date_recolte)::int AS mois,
          type_produit,
          SUM(quantite_kg)::float AS total_kg
        FROM recoltes
        WHERE user_id = ${ownerId}
          AND date_recolte >= ${debutAnnee}
          AND date_recolte <= ${finAnnee}
        GROUP BY mois, type_produit
        ORDER BY mois, type_produit
      `),

      // Interventions par mois
      db.execute(sql`
        SELECT
          EXTRACT(MONTH FROM date_visite)::int AS mois,
          COUNT(*)::int AS count
        FROM interventions
        WHERE user_id = ${ownerId}
          AND date_visite >= ${debutAnnee}
          AND date_visite <= ${finAnnee}
        GROUP BY mois
        ORDER BY mois
      `),

      // CA mensuel (ventes)
      db.execute(sql`
        SELECT
          EXTRACT(MONTH FROM date_transaction)::int AS mois,
          SUM(total)::float AS total
        FROM transactions
        WHERE user_id = ${ownerId}
          AND type = 'vente'
          AND date_transaction >= ${debutAnnee}
          AND date_transaction <= ${finAnnee}
        GROUP BY mois
        ORDER BY mois
      `),

      // Ruches actives vs total
      db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE statut = 'active')::int AS actives,
          COUNT(*) FILTER (WHERE statut = 'faible')::int AS faibles,
          COUNT(*) FILTER (WHERE statut = 'morte')::int AS mortes
        FROM ruches
        WHERE user_id = ${ownerId}
      `),
    ]);

  return {
    data: {
      annee,
      productionMensuelle: productionMensuelle as unknown as Array<{
        mois: number;
        type_produit: string;
        total_kg: number;
      }>,
      interventionsMensuelles: interventionsMensuelles as unknown as Array<{
        mois: number;
        count: number;
      }>,
      chiffreAffaires: chiffreAffaires as unknown as Array<{ mois: number; total: number }>,
      ruches: (
        totalRuches as unknown as Array<{
          total: number;
          actives: number;
          faibles: number;
          mortes: number;
        }>
      )[0] ?? { total: 0, actives: 0, faibles: 0, mortes: 0 },
    },
  };
});
