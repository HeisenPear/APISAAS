import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande, produitsCampagne } from '~~/server/database/schema';

const createProduitSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  prixUnitaireHt: z.coerce.number().positive('Le prix doit etre positif'),
  tauxTva: z.coerce.number().min(0).max(100).default(20),
  unite: z.string().max(20).default('piece'),
  stockDisponible: z.number().int().positive().optional(),
  quantiteMin: z.number().int().min(1).default(1),
  quantiteMax: z.number().int().positive().optional(),
  categorie: z.string().max(50).optional(),
  ordre: z.number().int().default(0),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, createProduitSchema.parse);

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, ownerId)));

  if (!campagne) throw notFound('Campagne introuvable');

  const [produit] = await db
    .insert(produitsCampagne)
    .values({
      campagneId,
      nom: body.nom,
      description: body.description,
      prixUnitaireHt: String(body.prixUnitaireHt),
      tauxTva: String(body.tauxTva),
      unite: body.unite,
      stockDisponible: body.stockDisponible,
      quantiteMin: body.quantiteMin,
      quantiteMax: body.quantiteMax,
      categorie: body.categorie,
      ordre: body.ordre,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: produit };
});
