import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { stocks, mouvementsStock } from '~~/server/database/schema';

const createMouvementSchema = z.object({
  stockId: z.string().uuid('stockId invalide'),
  type: z.enum(['entree', 'sortie', 'ajustement']),
  quantite: z.coerce.number().min(0.01, 'Quantite doit etre positive'),
  motif: z.string().max(500).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createMouvementSchema.parse);

  // Verify stock ownership
  const [stock] = await db
    .select({ id: stocks.id, quantite: stocks.quantite })
    .from(stocks)
    .where(and(eq(stocks.id, body.stockId), eq(stocks.userId, user.id)))
    .limit(1);

  if (!stock) badRequest('Article introuvable ou non autorise');

  // Check sufficient stock for sortie
  if (body.type === 'sortie') {
    const currentQty = Number(stock.quantite);
    if (body.quantite > currentQty) {
      badRequest(`Stock insuffisant (disponible: ${currentQty})`);
    }
  }

  // Create mouvement
  const [mouvement] = await db
    .insert(mouvementsStock)
    .values({
      stockId: body.stockId,
      userId: user.id,
      type: body.type,
      quantite: body.quantite.toString(),
      motif: body.motif ?? null,
    })
    .returning();

  if (!mouvement) internalError('Erreur lors de la creation du mouvement');

  // Update stock quantity
  if (body.type === 'ajustement') {
    await db
      .update(stocks)
      .set({
        quantite: body.quantite.toString(),
        updatedAt: new Date(),
      })
      .where(eq(stocks.id, body.stockId));
  } else {
    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric ${body.type === 'entree' ? sql`+` : sql`-`} ${body.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(stocks.id, body.stockId));
  }

  setResponseStatus(event, 201);
  return { data: mouvement };
});
