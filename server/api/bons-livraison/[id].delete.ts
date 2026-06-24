import { eq, and, sql } from 'drizzle-orm';
import { bonsLivraison, stocks } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id')!;

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
