import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { bonsLivraison, stocks, mouvementsStock } from '~~/server/database/schema';

const ligneSchema = z.object({
  description: z.string().trim().min(1),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0).optional(),
  tauxTva: z.coerce.number().min(0).max(100).optional(),
  total: z.coerce.number().optional(),
  stockId: z.string().uuid().optional(),
  typeMiel: z.string().max(100).optional(),
  presentation: z.string().max(50).optional(),
  numLot: z.string().max(100).optional(),
  origineGeo: z.string().max(200).optional(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
});

const updateBLSchema = z.object({
  statut: z.enum(['brouillon', 'livre', 'facture', 'annule']).optional(),
  lignes: z.array(ligneSchema).min(1).optional(),
  dateLivraison: z.coerce.date().nullish(),
  notes: z.string().trim().max(2000).nullish(),
  adresseLivraison: z.string().trim().max(500).nullish(),
  codePostalLivraison: z.string().trim().max(20).nullish(),
  villeLivraison: z.string().trim().max(200).nullish(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id')!;
  const body = await readValidatedBody(event, updateBLSchema.parse);

  const [existing] = await db
    .select({ statut: bonsLivraison.statut, lignes: bonsLivraison.lignes })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, user.id)))
    .limit(1);
  if (!existing) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });

  // Annulation → reversal stock
  if (body.statut === 'annule' && existing.statut !== 'annule') {
    const lignes = existing.lignes ?? [];
    for (const ligne of lignes) {
      if (ligne.stockId) {
        await db
          .update(stocks)
          .set({
            quantite: sql`${stocks.quantite}::numeric + ${ligne.quantite}::numeric`,
            updatedAt: new Date(),
          })
          .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, user.id)));
        await db.insert(mouvementsStock).values({
          stockId: ligne.stockId,
          userId: user.id,
          type: 'entree',
          quantite: String(ligne.quantite),
          motif: `Annulation BL`,
        });
      }
    }
  }

  const [updated] = await db
    .update(bonsLivraison)
    .set({
      ...(body.statut !== undefined && { statut: body.statut }),
      ...(body.lignes !== undefined && { lignes: body.lignes }),
      ...(body.dateLivraison !== undefined && { dateLivraison: body.dateLivraison }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.adresseLivraison !== undefined && { adresseLivraison: body.adresseLivraison }),
      ...(body.codePostalLivraison !== undefined && { codePostalLivraison: body.codePostalLivraison }),
      ...(body.villeLivraison !== undefined && { villeLivraison: body.villeLivraison }),
      updatedAt: new Date(),
    })
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, user.id)))
    .returning();

  return { data: updated };
});
