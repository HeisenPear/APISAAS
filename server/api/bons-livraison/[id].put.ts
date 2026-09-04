import { z } from 'zod';
import { uuidSchema } from '~~/server/utils/validators';
import { eq, and, sql } from 'drizzle-orm';
import { bonsLivraison, stocks, mouvementsStock } from '~~/server/database/schema';
import {
  ligneBonLivraisonSchema,
  lignesBonLivraisonAvecTotaux,
} from '~~/server/utils/bonLivraison';

const updateBLSchema = z.object({
  statut: z.enum(['brouillon', 'livre', 'facture', 'annule']).optional(),
  lignes: z.array(ligneBonLivraisonSchema).min(1).optional(),
  dateLivraison: z.coerce.date().nullish(),
  notes: z.string().trim().max(2000).nullish(),
  adresseLivraison: z.string().trim().max(500).nullish(),
  codePostalLivraison: z.string().trim().max(20).nullish(),
  villeLivraison: z.string().trim().max(200).nullish(),
});

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
  const body = await readValidatedBody(event, updateBLSchema.parse);

  const [existing] = await db
    .select({ statut: bonsLivraison.statut, lignes: bonsLivraison.lignes })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
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
          .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, ownerId)));
        await db.insert(mouvementsStock).values({
          stockId: ligne.stockId,
          userId: ownerId,
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
      // Les totaux sont RECALCULÉS ici : cette route écrivait `body.lignes`
      // tel quel, donc le total envoyé par le client — et perdait au passage
      // `modePrix` et `contenance`. Cf. `server/utils/bonLivraison.ts`.
      ...(body.lignes !== undefined && {
        lignes: lignesBonLivraisonAvecTotaux(body.lignes),
      }),
      ...(body.dateLivraison !== undefined && { dateLivraison: body.dateLivraison }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.adresseLivraison !== undefined && { adresseLivraison: body.adresseLivraison }),
      ...(body.codePostalLivraison !== undefined && {
        codePostalLivraison: body.codePostalLivraison,
      }),
      ...(body.villeLivraison !== undefined && { villeLivraison: body.villeLivraison }),
      updatedAt: new Date(),
    })
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .returning();

  return { data: updated };
});
