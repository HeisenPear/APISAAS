import { eq, and } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';
import { refusDeSuppression } from '~~/server/utils/suppressionTransaction';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      statut: transactions.statut,
      numero: transactions.numero,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  /**
   * LA RÈGLE VIT DANS `server/utils/suppressionTransaction.ts`, pas ici.
   *
   * Elle a divergé deux fois : ce `DELETE` n'avait pas le garde de son `PUT`,
   * puis le garde ajouté s'est révélé PLUS LARGE que son motif — posé sur
   * toute la table `transactions`, il rendait aussi les ACHATS indélébiles,
   * alors qu'un achat naît avec un numéro et le statut « payee ». Une règle
   * écrite dans la route est une règle qui se recopiera.
   */
  const refus = refusDeSuppression({
    type: existing.type,
    statut: existing.statut,
    numero: existing.numero,
  });
  if (refus) badRequest(refus);

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)));

  return { success: true };
});
