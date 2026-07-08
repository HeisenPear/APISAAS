import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { stocks, mouvementsStock } from '~~/server/database/schema';

const createMouvementSchema = z
  .object({
    stockId: z.string().uuid('stockId invalide'),
    type: z.enum(['entree', 'sortie', 'ajustement']),
    quantite: z.coerce.number().min(0, 'Quantite ne peut pas etre negative'),
    motif: z.string().max(500).trim().optional(),
  })
  .refine((d) => d.type === 'ajustement' || d.quantite > 0, {
    message: 'Quantite doit etre superieure a 0',
    path: ['quantite'],
  });

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, createMouvementSchema.parse);

  // Verify stock ownership
  const [stock] = await db
    .select({
      id: stocks.id,
      quantite: stocks.quantite,
      unite: stocks.unite,
      categorie: stocks.categorie,
    })
    .from(stocks)
    .where(and(eq(stocks.id, body.stockId), eq(stocks.userId, ownerId)))
    .limit(1);

  if (!stock) badRequest('Article introuvable ou non autorise');

  // Quantités entières sauf articles au poids/volume (kg, L, nourrissement…)
  if (!allowsDecimalQuantity(stock.unite, stock.categorie) && !Number.isInteger(body.quantite)) {
    badRequest('Quantité en nombre entier pour cet article (unité non pondérale).');
  }

  // Mise à jour du stock — ATOMIQUE. Pour une sortie, le décrément est CONDITIONNEL
  // (WHERE quantite >= demandé) → empêche toute survente en cas de requêtes
  // concurrentes (db = service-role, pas de sérialisation implicite). 0 ligne
  // affectée = stock devenu insuffisant entre-temps.
  if (body.type === 'ajustement') {
    await db
      .update(stocks)
      .set({ quantite: body.quantite.toString(), updatedAt: new Date() })
      .where(and(eq(stocks.id, body.stockId), eq(stocks.userId, ownerId)));
  } else if (body.type === 'entree') {
    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric + ${body.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, body.stockId), eq(stocks.userId, ownerId)));
  } else {
    const maj = await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric - ${body.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(stocks.id, body.stockId),
          eq(stocks.userId, ownerId),
          sql`${stocks.quantite}::numeric >= ${body.quantite}::numeric`,
        ),
      )
      .returning({ id: stocks.id });
    if (maj.length === 0) {
      badRequest(`Stock insuffisant (disponible: ${Number(stock.quantite)})`);
    }
  }

  // Journaliser le mouvement (après la mise à jour réussie du stock).
  const [mouvement] = await db
    .insert(mouvementsStock)
    .values({
      stockId: body.stockId,
      userId: ownerId,
      type: body.type,
      quantite: body.quantite.toString(),
      motif: body.motif ?? null,
    })
    .returning();

  if (!mouvement) internalError('Erreur lors de la creation du mouvement');

  setResponseStatus(event, 201);
  return { data: mouvement };
});
