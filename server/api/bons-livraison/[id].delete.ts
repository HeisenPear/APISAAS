import { eq, and } from 'drizzle-orm';
import { uuidSchema } from '~~/server/utils/validators';
import { bonsLivraison } from '~~/server/database/schema';
import { appliquerStockBonLivraison, empreinteDuBon } from '~~/server/utils/bonLivraisonStock';

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
    .select({
      statut: bonsLivraison.statut,
      lignes: bonsLivraison.lignes,
      numero: bonsLivraison.numero,
    })
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

  /**
   * La réintégration passe par la mécanique commune : elle écrit la trace que
   * cette route ne laissait pas, et remonte au bon supprimé par `referenceId`.
   */
  await appliquerStockBonLivraison({
    ownerId,
    bonId: id,
    numero: existing.numero,
    avant: empreinteDuBon(existing.statut, existing.lignes),
    motif: 'Suppression du bon',
  });

  await db
    .delete(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)));

  return { data: { id } };
});
