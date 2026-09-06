import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { mouvementsBancaires, transactions } from '~~/server/database/schema';

// Actions sur un mouvement : « ignorer » (hors gestion, ex. dépense perso) ou « restaurer »
// (annule un rapprochement et repasse la facture liée en « envoyée »).
const schema = z.object({
  mouvementId: z.string().uuid(),
  action: z.enum(['ignorer', 'restaurer']),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { mouvementId, action } = await readValidatedBody(event, schema.parse);

  const [mvt] = await db
    .select({ id: mouvementsBancaires.id, transactionId: mouvementsBancaires.transactionId })
    .from(mouvementsBancaires)
    .where(and(eq(mouvementsBancaires.id, mouvementId), eq(mouvementsBancaires.userId, ownerId)))
    .limit(1);
  if (!mvt) throw createError({ statusCode: 404, message: 'Mouvement introuvable' });

  if (action === 'ignorer') {
    await db
      .update(mouvementsBancaires)
      .set({ statut: 'ignore', transactionId: null, dateRapprochement: null })
      .where(and(eq(mouvementsBancaires.id, mouvementId), eq(mouvementsBancaires.userId, ownerId)));
  } else {
    // Restaurer : on délie et on repasse la facture en « envoyée » (impayée à nouveau).
    if (mvt.transactionId) {
      await db
        .update(transactions)
        .set({ statut: 'envoyee', updatedAt: new Date() })
        .where(and(eq(transactions.id, mvt.transactionId), eq(transactions.userId, ownerId)));
    }
    await db
      .update(mouvementsBancaires)
      .set({ statut: 'a_rapprocher', transactionId: null, dateRapprochement: null })
      .where(and(eq(mouvementsBancaires.id, mouvementId), eq(mouvementsBancaires.userId, ownerId)));
  }

  return { data: { ok: true } };
});
