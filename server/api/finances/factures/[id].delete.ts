import { eq, and } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  await db.delete(transactions).where(eq(transactions.id, id));

  return { success: true };
});
