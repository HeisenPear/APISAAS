import { eq, and, desc } from 'drizzle-orm';
import { clients, transactions, bonsLivraison } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, ownerId)))
    .limit(1);

  if (!client) notFound('Client introuvable');

  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.clientId, id), eq(transactions.userId, ownerId)))
    .orderBy(desc(transactions.dateTransaction))
    .limit(10);

  // Bons de livraison du client (historique) — montant HT dérivé des lignes.
  const bons = await db
    .select({
      id: bonsLivraison.id,
      numero: bonsLivraison.numero,
      dateCreation: bonsLivraison.dateCreation,
      statut: bonsLivraison.statut,
      transactionId: bonsLivraison.transactionId,
      lignes: bonsLivraison.lignes,
    })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.clientId, id), eq(bonsLivraison.userId, ownerId)))
    .orderBy(desc(bonsLivraison.dateCreation))
    .limit(20);

  const bonsLivraisonClient = bons.map((bl) => ({
    id: bl.id,
    numero: bl.numero,
    dateCreation: bl.dateCreation,
    statut: bl.statut,
    transactionId: bl.transactionId,
    montant: (bl.lignes ?? []).reduce((s, l) => s + (l.total ?? 0), 0),
  }));

  return {
    data: { ...client, transactions: recentTransactions, bonsLivraison: bonsLivraisonClient },
  };
});
