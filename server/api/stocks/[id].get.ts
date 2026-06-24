import { eq, and, desc } from 'drizzle-orm';
import { stocks, mouvementsStock } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [stock] = await db
    .select()
    .from(stocks)
    .where(and(eq(stocks.id, id), eq(stocks.userId, ownerId)))
    .limit(1);

  if (!stock) notFound('Article introuvable');

  // Fetch recent mouvements
  const mouvements = await db
    .select()
    .from(mouvementsStock)
    .where(and(eq(mouvementsStock.stockId, id), eq(mouvementsStock.userId, ownerId)))
    .orderBy(desc(mouvementsStock.createdAt))
    .limit(50);

  return {
    data: {
      ...stock,
      mouvements,
    },
  };
});
