import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { stocks } from '~~/server/database/schema';

const updateStockSchema = z.object({
  nom: z.string().min(1).max(200).trim().optional(),
  categorie: z
    .enum([
      'cadres',
      'hausses',
      'corps',
      'nourrissement',
      'traitement',
      'conditionnement',
      'equipement',
      'outillage',
      'autre',
    ])
    .optional(),
  unite: z.string().max(50).trim().nullish(),
  seuilAlerte: z.coerce.number().min(0).nullish(),
  prixUnitaire: z.coerce.number().min(0).nullish(),
  fournisseur: z.string().max(200).trim().nullish(),
  emplacement: z.string().max(200).trim().nullish(),
  notes: z.string().max(5000).trim().nullish(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, updateStockSchema.parse);

  const [existing] = await db
    .select({ id: stocks.id })
    .from(stocks)
    .where(and(eq(stocks.id, id), eq(stocks.userId, user.id)))
    .limit(1);

  if (!existing) notFound('Article introuvable');

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.nom !== undefined) updateData.nom = body.nom;
  if (body.categorie !== undefined) updateData.categorie = body.categorie;
  if (body.unite !== undefined) updateData.unite = body.unite;
  if (body.seuilAlerte !== undefined) updateData.seuilAlerte = body.seuilAlerte?.toString() ?? null;
  if (body.prixUnitaire !== undefined)
    updateData.prixUnitaire = body.prixUnitaire?.toString() ?? null;
  if (body.fournisseur !== undefined) updateData.fournisseur = body.fournisseur;
  if (body.emplacement !== undefined) updateData.emplacement = body.emplacement;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const [updated] = await db
    .update(stocks)
    .set(updateData)
    .where(and(eq(stocks.id, id), eq(stocks.userId, user.id)))
    .returning();

  if (!updated) internalError('Erreur lors de la mise a jour');

  return { data: updated };
});
