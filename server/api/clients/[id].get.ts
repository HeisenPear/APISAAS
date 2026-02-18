import { eq, and, desc } from 'drizzle-orm';
import { clients, transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
    .limit(1);

  if (!client) notFound('Client introuvable');

  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.clientId, id), eq(transactions.userId, user.id)))
    .orderBy(desc(transactions.dateTransaction))
    .limit(10);

  return { data: { ...client, transactions: recentTransactions } };
});
