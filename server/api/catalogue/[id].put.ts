import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import {
  produitsCatalogue,
  categorieStockEnum,
  categorieVenteEnum,
} from '~~/server/database/schema';

const schema = z.object({
  nom: z.string().min(1).max(200).trim().optional(),
  categorie: z.enum(categorieStockEnum.enumValues).optional(),
  categorieVente: z.enum(categorieVenteEnum.enumValues).nullish(),
  tauxTva: z.coerce.number().min(0).max(100).nullish(),
  uniteTypique: z.string().max(50).nullish(),
  modePrix: z.enum(['format', 'poids']).optional(),
  conditionnement: z.string().max(50).nullish(),
  contenance: z.coerce.number().min(0).nullish(),
  uniteContenance: z.string().max(20).nullish(),
  icon: z.string().max(20).nullish(),
  groupe: z.string().max(100).nullish(),
});

/** Met à jour un preset de catalogue. */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .update(produitsCatalogue)
    .set({
      ...body,
      tauxTva: body.tauxTva == null ? body.tauxTva : body.tauxTva.toString(),
      contenance: body.contenance == null ? body.contenance : body.contenance.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(produitsCatalogue.id, id), eq(produitsCatalogue.userId, ownerId)))
    .returning();

  if (!row) notFound('Preset introuvable');
  return { data: row };
});
