import { eq, and, sql } from 'drizzle-orm';
import { uuidSchema } from '~~/server/utils/validators';
import { bonsLivraison, stocks } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  /**
   * ⚠️ L'IDENTIFIANT SE VALIDE AVANT D'ATTEINDRE SQL. Les routes de facture le
   * font depuis toujours ; les quatre routes de bon de livraison ne le
   * faisaient pas. Un identifiant mal formé descendait jusqu'à Postgres, qui
   * répondait par une erreur de type — un 500 là où c'est un 400, et une trace
   * d'erreur pour une simple faute de frappe dans une URL.
   */
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [existing] = await db
    .select({ statut: bonsLivraison.statut, lignes: bonsLivraison.lignes })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!existing) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });
  if (existing.statut !== 'brouillon') {
    throw createError({
      statusCode: 400,
      message: "Seul un BL en brouillon peut être supprimé. Annulez-le d'abord.",
    });
  }

  // Reversal stock avant suppression
  for (const ligne of existing.lignes ?? []) {
    if (ligne.stockId) {
      await db
        .update(stocks)
        .set({
          quantite: sql`${stocks.quantite}::numeric + ${ligne.quantite}::numeric`,
          updatedAt: new Date(),
        })
        .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, ownerId)));
    }
  }

  await db
    .delete(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)));

  return { data: { id } };
});
