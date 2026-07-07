import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { mouvementsBancaires, transactions } from '~~/server/database/schema';

// Confirme un rapprochement mouvement ↔ facture : pointe le mouvement et passe la facture
// de vente en « payée ». C'est l'automatisation qui fiabilise les relances (l'alerte
// facture_retard s'auto-résout dès qu'une facture n'est plus « envoyée »).
const schema = z.object({
  mouvementId: z.string().uuid(),
  transactionId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { mouvementId, transactionId } = await readValidatedBody(event, schema.parse);

  const [mvt] = await db
    .select({ id: mouvementsBancaires.id })
    .from(mouvementsBancaires)
    .where(and(eq(mouvementsBancaires.id, mouvementId), eq(mouvementsBancaires.userId, ownerId)))
    .limit(1);
  if (!mvt) throw createError({ statusCode: 404, message: 'Mouvement introuvable' });

  const [facture] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, ownerId),
        eq(transactions.type, 'vente'),
      ),
    )
    .limit(1);
  if (!facture) throw createError({ statusCode: 404, message: 'Facture introuvable' });

  const now = new Date();
  await db
    .update(mouvementsBancaires)
    .set({ statut: 'rapproche', transactionId, dateRapprochement: now })
    .where(eq(mouvementsBancaires.id, mouvementId));
  await db
    .update(transactions)
    .set({ statut: 'payee', updatedAt: now })
    .where(eq(transactions.id, transactionId));

  return { data: { ok: true } };
});
