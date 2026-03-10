import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande, produitsCampagne } from '~~/server/database/schema';

const updateProduitSchema = z.object({
  nom: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  prixUnitaireHt: z.coerce.number().positive().optional(),
  tauxTva: z.coerce.number().min(0).max(100).optional(),
  unite: z.string().max(20).optional(),
  stockDisponible: z.number().int().positive().optional(),
  quantiteMin: z.number().int().min(1).optional(),
  quantiteMax: z.number().int().positive().optional(),
  categorie: z.string().max(50).optional(),
  ordre: z.number().int().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const prodId = z.string().uuid().parse(getRouterParam(event, 'prodId'));
  const body = await readValidatedBody(event, updateProduitSchema.parse);

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, user.id)));

  if (!campagne) throw notFound('Campagne introuvable');

  // Build update values, converting decimals to strings
  const values: Record<string, unknown> = {};
  if (body.nom !== undefined) values.nom = body.nom;
  if (body.description !== undefined) values.description = body.description;
  if (body.prixUnitaireHt !== undefined) values.prixUnitaireHt = String(body.prixUnitaireHt);
  if (body.tauxTva !== undefined) values.tauxTva = String(body.tauxTva);
  if (body.unite !== undefined) values.unite = body.unite;
  if (body.stockDisponible !== undefined) values.stockDisponible = body.stockDisponible;
  if (body.quantiteMin !== undefined) values.quantiteMin = body.quantiteMin;
  if (body.quantiteMax !== undefined) values.quantiteMax = body.quantiteMax;
  if (body.categorie !== undefined) values.categorie = body.categorie;
  if (body.ordre !== undefined) values.ordre = body.ordre;

  if (Object.keys(values).length === 0) {
    badRequest('Aucun champ a mettre a jour');
  }

  const [updated] = await db
    .update(produitsCampagne)
    .set(values)
    .where(and(eq(produitsCampagne.id, prodId), eq(produitsCampagne.campagneId, campagneId)))
    .returning();

  if (!updated) throw notFound('Produit introuvable');

  return { data: updated };
});
