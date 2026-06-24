import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { stocks } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  // Find stocks where quantite <= seuil_alerte
  const alertes = await db
    .select()
    .from(stocks)
    .where(
      and(
        eq(stocks.userId, ownerId),
        isNotNull(stocks.seuilAlerte),
        sql`${stocks.quantite}::numeric <= ${stocks.seuilAlerte}::numeric`,
      ),
    )
    .orderBy(sql`(${stocks.quantite}::numeric / NULLIF(${stocks.seuilAlerte}::numeric, 0)) ASC`);

  return {
    data: alertes,
    total: alertes.length,
  };
});
