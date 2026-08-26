import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { syntheseSaisons, type SaisonAgg } from '~~/server/utils/analytics';
import { anneeParis } from '~~/server/utils/horloge';

const querySchema = z.object({
  annees: z.coerce.number().int().min(2).max(5).default(5),
});

/**
 * GET /api/analytics/pluriannuel — pilotage dans la durée (Expert).
 * Production, CA et marge réelle (CA − achats) par saison sur N années + synthèse
 * (tendances, meilleure/pire saison). Gated `analyseMultiSaisons`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const { annees } = await getValidatedQuery(event, querySchema.parse);

  const anneeCourante = anneeParis(new Date());
  const premiere = anneeCourante - annees + 1;
  const debut = `${premiere}-01-01T00:00:00.000Z`;

  const [prodRows, caRows, achatRows] = await Promise.all([
    db.execute(sql`
      SELECT EXTRACT(YEAR FROM date_recolte)::int AS annee, SUM(quantite_kg)::float AS v
      FROM recoltes WHERE user_id = ${ownerId} AND type_produit = 'miel' AND date_recolte >= ${debut}
      GROUP BY annee`),
    db.execute(sql`
      SELECT EXTRACT(YEAR FROM date_transaction)::int AS annee, SUM(total)::float AS v
      FROM transactions WHERE user_id = ${ownerId} AND type = 'vente' AND statut <> 'brouillon'
        AND date_transaction >= ${debut} GROUP BY annee`),
    db.execute(sql`
      SELECT EXTRACT(YEAR FROM date_transaction)::int AS annee, SUM(total)::float AS v
      FROM transactions WHERE user_id = ${ownerId} AND type = 'achat' AND statut <> 'brouillon'
        AND date_transaction >= ${debut} GROUP BY annee`),
  ]);

  const toMap = (rows: unknown) =>
    new Map((rows as Array<{ annee: number; v: number }>).map((r) => [r.annee, r.v]));
  const prod = toMap(prodRows);
  const ca = toMap(caRows);
  const achats = toMap(achatRows);

  const saisons: SaisonAgg[] = [];
  for (let y = premiere; y <= anneeCourante; y++) {
    const caY = Math.round(ca.get(y) ?? 0);
    const coutsY = Math.round(achats.get(y) ?? 0);
    saisons.push({
      annee: y,
      productionKg: Math.round((prod.get(y) ?? 0) * 10) / 10,
      ca: caY,
      margeEur: caY - coutsY,
    });
  }

  return { data: { saisons, synthese: syntheseSaisons(saisons) } };
});
