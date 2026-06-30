import { eq, and, inArray } from 'drizzle-orm';
import { mouvementsBancaires, transactions, clients } from '~~/server/database/schema';
import {
  rapprocher,
  type TransactionBancaire,
  type DocumentARapprocher,
} from '~~/server/utils/rapprochement';

// Suggestions de rapprochement : mouvements non pointés × factures de vente en attente de
// règlement (envoyée / en retard). Calcul pur (rapprochement.ts), aucune écriture.
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const mouvements = await db
    .select()
    .from(mouvementsBancaires)
    .where(
      and(eq(mouvementsBancaires.userId, ownerId), eq(mouvementsBancaires.statut, 'a_rapprocher')),
    );

  const factures = await db
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
    );

  const txInput: TransactionBancaire[] = mouvements.map((m) => ({
    id: m.id,
    date: iso(m.dateOperation),
    montant: Number(m.montant),
    libelle: m.libelle,
  }));
  const docInput: DocumentARapprocher[] = factures.map((f) => ({
    id: f.id,
    sens: 'vente',
    date: iso(f.date),
    montant: Number(f.total ?? 0),
    reference: f.numero,
    tiers: f.entreprise || [f.prenom, f.nom].filter(Boolean).join(' ') || null,
  }));

  const { suggestions } = rapprocher(txInput, docInput);
  const mvtMap = new Map(mouvements.map((m) => [m.id, m]));
  const facMap = new Map(docInput.map((d) => [d.id, d]));

  const data = suggestions.map((s) => {
    const m = mvtMap.get(s.transactionId)!;
    const f = facMap.get(s.documentId)!;
    return {
      mouvementId: s.transactionId,
      transactionId: s.documentId,
      score: s.score,
      raisons: s.raisons,
      mouvement: { date: iso(m.dateOperation), montant: Number(m.montant), libelle: m.libelle },
      facture: { numero: f.reference, total: f.montant, tiers: f.tiers, date: f.date },
    };
  });

  return { data };
});
