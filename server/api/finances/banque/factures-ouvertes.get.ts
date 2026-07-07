import { eq, and, inArray, desc } from 'drizzle-orm';
import { transactions, clients } from '~~/server/database/schema';

// Factures de vente en attente de règlement (envoyée / en retard) pour le rapprochement
// MANUEL (quand aucune suggestion automatique ne convient). Lecture seule.
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const rows = await db
    .select({
      id: transactions.id,
      numero: transactions.numero,
      total: transactions.total,
      date: transactions.dateTransaction,
      nom: clients.nom,
      prenom: clients.prenom,
      entreprise: clients.entreprise,
    })
    .from(transactions)
    .leftJoin(clients, eq(clients.id, transactions.clientId))
    .where(
      and(
        eq(transactions.userId, ownerId),
        eq(transactions.type, 'vente'),
        inArray(transactions.statut, ['envoyee', 'en_retard']),
      ),
    )
    .orderBy(desc(transactions.dateTransaction));

  return {
    data: rows.map((f) => ({
      id: f.id,
      numero: f.numero,
      total: Number(f.total ?? 0),
      date: f.date,
      tiers: f.entreprise || [f.prenom, f.nom].filter(Boolean).join(' ') || null,
    })),
  };
});
