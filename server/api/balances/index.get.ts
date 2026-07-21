import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { balances, ruches, hausses, ruchers } from '~~/server/database/schema';
import { urlIngestion } from '~~/server/utils/balances/acces';

interface DernierePoint {
  balance_id: string;
  mesuree_at: string;
  poidsKg: number | null;
  poidsNetKg: number | null;
  variationKg: number | null;
  variation24hKg: number | null;
  temperatureC: number | null;
}

/**
 * GET /api/balances — liste des balances de l'espace + leur dernière mesure.
 * La dernière mesure vient d'un DISTINCT ON (une seule requête pour toutes les
 * balances) : jamais de N+1 sur une timeseries.
 */
const filtresSchema = z.object({
  rucheId: z.string().uuid().optional(),
  hausseId: z.string().uuid().optional(),
  rucherId: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const origine = resolveAppOrigin(event);

  // Filtres facultatifs : permettent aux fiches ruche/hausse de demander LA
  // balance qui les concerne, au lieu de charger tout le parc pour en garder une.
  const filtres = await getValidatedQuery(event, filtresSchema.parse);
  const conditions = [eq(balances.userId, ownerId)];
  if (filtres.rucheId) conditions.push(eq(balances.rucheId, filtres.rucheId));
  if (filtres.hausseId) conditions.push(eq(balances.hausseId, filtres.hausseId));
  if (filtres.rucherId) conditions.push(eq(balances.rucherId, filtres.rucherId));

  const [lignes, points] = await Promise.all([
    withDbRetry(
      () =>
        db
          .select({
            balance: balances,
            // Sans ces libellés, la liste n'indique pas SOUS QUOI est posée la
            // balance — l'information la plus utile pour s'y retrouver quand on
            // en a plusieurs. Jointures externes : les trois liens sont nullables.
            rucheNumero: ruches.numero,
            hausseNumero: hausses.numero,
            rucherNom: ruchers.nom,
          })
          .from(balances)
          .leftJoin(ruches, eq(ruches.id, balances.rucheId))
          .leftJoin(hausses, eq(hausses.id, balances.hausseId))
          .leftJoin(ruchers, eq(ruchers.id, balances.rucherId))
          .where(and(...conditions))
          .orderBy(asc(balances.nom)),
      'balances:liste',
    ),
    withDbRetry(
      () =>
        db.execute(sql`
          SELECT DISTINCT ON (balance_id)
            balance_id,
            mesuree_at,
            poids_kg::float8         AS "poidsKg",
            poids_net_kg::float8     AS "poidsNetKg",
            variation_kg::float8     AS "variationKg",
            variation_24h_kg::float8 AS "variation24hKg",
            temperature_c::float8    AS "temperatureC"
          FROM mesures_balance
          WHERE user_id = ${ownerId}
          ORDER BY balance_id, mesuree_at DESC
        `),
      'balances:dernieresMesures',
    ) as unknown as Promise<DernierePoint[]>,
  ]);

  const parBalance = new Map(points.map((p) => [p.balance_id, p]));

  return {
    data: lignes.map((l) => ({
      ...l.balance,
      rucheNumero: l.rucheNumero,
      hausseNumero: l.hausseNumero,
      rucherNom: l.rucherNom,
      urlIngestion: urlIngestion(origine, l.balance.ingestToken),
      derniereMesure: parBalance.get(l.balance.id) ?? null,
    })),
  };
});
