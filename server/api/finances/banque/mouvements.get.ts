import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { mouvementsBancaires, transactions } from '~~/server/database/schema';

// Liste les mouvements bancaires importés (scopés sur le propriétaire de l'espace),
// avec le n° de la facture rapprochée le cas échéant. Lecture seule.
const schema = z.object({
  statut: z.enum(['a_rapprocher', 'rapproche', 'ignore']).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const { statut } = await getValidatedQuery(event, schema.parse);

  const rows = await db
    .select({
      id: mouvementsBancaires.id,
      dateOperation: mouvementsBancaires.dateOperation,
      montant: mouvementsBancaires.montant,
      libelle: mouvementsBancaires.libelle,
      statut: mouvementsBancaires.statut,
      source: mouvementsBancaires.source,
      transactionId: mouvementsBancaires.transactionId,
      dateRapprochement: mouvementsBancaires.dateRapprochement,
      factureNumero: transactions.numero,
    })
    .from(mouvementsBancaires)
    .leftJoin(transactions, eq(transactions.id, mouvementsBancaires.transactionId))
    .where(
      and(
        eq(mouvementsBancaires.userId, ownerId),
        statut ? eq(mouvementsBancaires.statut, statut) : undefined,
      ),
    )
    .orderBy(desc(mouvementsBancaires.dateOperation));

  return { data: rows };
});
