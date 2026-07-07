import { eq, and } from 'drizzle-orm';
import { stocks } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [deleted] = await db
    .delete(stocks)
    .where(and(eq(stocks.id, id), eq(stocks.userId, ownerId)))
    .returning({ id: stocks.id });

  if (!deleted) notFound('Article introuvable');

  return { data: { id: deleted.id } };
});
