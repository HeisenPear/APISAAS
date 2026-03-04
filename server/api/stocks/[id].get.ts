import { eq, and, desc } from 'drizzle-orm';
import { stocks, mouvementsStock } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [stock] = await db
    .select()
    .from(stocks)
    .where(and(eq(stocks.id, id), eq(stocks.userId, user.id)))
    .limit(1);

  if (!stock) notFound('Article introuvable');

  // Fetch recent mouvements
  const mouvements = await db
    .select()
    .from(mouvementsStock)
    .where(and(eq(mouvementsStock.stockId, id), eq(mouvementsStock.userId, user.id)))
    .orderBy(desc(mouvementsStock.createdAt))
    .limit(50);

  return {
    data: {
      ...stock,
      mouvements,
    },
  };
});
