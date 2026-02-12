import { z } from 'zod';
import { stocks } from '~~/server/database/schema';

const createStockSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200).trim(),
  categorie: z.enum([
    'cadres',
    'hausses',
    'corps',
    'nourrissement',
    'traitement',
    'conditionnement',
    'equipement',
    'outillage',
    'autre',
  ]),
  quantite: z.coerce.number().min(0).default(0),
  unite: z.string().max(50).trim().optional(),
  seuilAlerte: z.coerce.number().min(0).optional(),
  prixUnitaire: z.coerce.number().min(0).optional(),
  fournisseur: z.string().max(200).trim().optional(),
  emplacement: z.string().max(200).trim().optional(),
  notes: z.string().max(5000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createStockSchema.parse);

  const [created] = await db
    .insert(stocks)
    .values({
      userId: user.id,
      nom: body.nom,
      categorie: body.categorie,
      quantite: body.quantite.toString(),
      unite: body.unite ?? null,
      seuilAlerte: body.seuilAlerte?.toString() ?? null,
      prixUnitaire: body.prixUnitaire?.toString() ?? null,
      fournisseur: body.fournisseur ?? null,
      emplacement: body.emplacement ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  if (!created) internalError('Erreur lors de la creation');

  setResponseStatus(event, 201);
  return { data: created };
});
