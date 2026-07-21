import { desc, eq, sql } from 'drizzle-orm';
import { mesuresBalance } from '~~/server/database/schema';
import { chargerBalance, urlIngestion } from '~~/server/utils/balances/acces';

/** GET /api/balances/:id — fiche complète : réglages, secret d'ingestion, dernier point. */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const balance = await chargerBalance(ownerId, id);
  if (!balance) return notFound('Balance introuvable');

  const [derniere, stats] = await Promise.all([
    withDbRetry(
      () =>
        db
          .select()
          .from(mesuresBalance)
          .where(eq(mesuresBalance.balanceId, id))
          .orderBy(desc(mesuresBalance.mesureeAt))
          .limit(1),
      'balances:detailDerniere',
    ),
    withDbRetry(
      () =>
        db
          .select({
            total: sql<number>`count(*)::int`,
            premiereAt: sql<string | null>`min(${mesuresBalance.mesureeAt})`,
          })
          .from(mesuresBalance)
          .where(eq(mesuresBalance.balanceId, id)),
      'balances:detailStats',
    ),
  ]);

  return {
    data: {
      ...balance,
      urlIngestion: urlIngestion(resolveAppOrigin(event), balance.ingestToken),
      derniereMesure: derniere[0] ?? null,
      nbMesures: stats[0]?.total ?? 0,
      premiereMesureAt: stats[0]?.premiereAt ?? null,
    },
  };
});
