import { z } from 'zod';
import {
  produitsCatalogue,
  categorieStockEnum,
  categorieVenteEnum,
} from '~~/server/database/schema';

const schema = z.object({
  nom: z.string().min(1).max(200).trim(),
  categorie: z.enum(categorieStockEnum.enumValues),
  categorieVente: z.enum(categorieVenteEnum.enumValues).nullish(),
  tauxTva: z.coerce.number().min(0).max(100).nullish(),
  uniteTypique: z.string().max(50).nullish(),
  modePrix: z.enum(['format', 'poids']).default('format'),
  conditionnement: z.string().max(50).nullish(),
  contenance: z.coerce.number().min(0).nullish(),
  uniteContenance: z.string().max(20).nullish(),
  icon: z.string().max(20).nullish(),
  groupe: z.string().max(100).nullish(),
});

/** Crée un preset de catalogue. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .insert(produitsCatalogue)
    .values({
      ...body,
      userId: user.id,
      tauxTva: body.tauxTva?.toString(),
      contenance: body.contenance?.toString(),
      estDefaut: false,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: row };
});
