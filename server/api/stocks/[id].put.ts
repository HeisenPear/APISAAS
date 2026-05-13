import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { stocks } from '~~/server/database/schema';

const TVA_PAR_CATEGORIE: Record<string, number> = {
  miel: 5.5,
  gelee_royale: 5.5,
  pollen: 5.5,
  propolis_alimentaire: 5.5,
  pain_abeille: 5.5,
  cire_alimentaire: 5.5,
  vinaigre_miel: 5.5,
  nourrissement: 5.5,
  essaim: 10,
  reine: 10,
  ruche_peuplee: 10,
  traitement_veterinaire: 10,
  materiel_apicole: 20,
  equipement_apiculteur: 20,
  cire_technique: 20,
  conditionnement: 20,
  hydromel: 20,
  propolis_teinture: 20,
  cosmetique: 20,
  autre: 20,
};

const CATEGORIE_VENTE_VALUES = [
  'miel',
  'gelee_royale',
  'pollen',
  'propolis_alimentaire',
  'pain_abeille',
  'cire_alimentaire',
  'vinaigre_miel',
  'essaim',
  'reine',
  'ruche_peuplee',
  'nourrissement',
  'traitement_veterinaire',
  'materiel_apicole',
  'equipement_apiculteur',
  'cire_technique',
  'conditionnement',
  'hydromel',
  'propolis_teinture',
  'cosmetique',
  'autre',
] as const;

const photoEntrySchema = z.object({
  url: z.string(),
  path: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  caption: z.string().optional(),
});

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
  categorieVente: z.enum(CATEGORIE_VENTE_VALUES).nullish(),
  tauxTva: z.coerce.number().min(0).max(100).nullish(),
  unite: z.string().max(50).trim().nullish(),
  seuilAlerte: z.coerce.number().min(0).nullish(),
  prixUnitaire: z.coerce.number().min(0).nullish(),
  fournisseur: z.string().max(200).trim().nullish(),
  emplacement: z.string().max(200).trim().nullish(),
  notes: z.string().max(5000).trim().nullish(),
  // Champs spécifiques miel (Décret 2003-587)
  typeMiel: z.string().max(100).trim().nullish(),
  presentation: z.string().max(50).trim().nullish(),
  conditionnementMiel: z.string().max(50).trim().nullish(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).nullish(),
  numLot: z.string().max(100).trim().nullish(),
  origineGeo: z.string().max(200).trim().nullish(),
  photos: z.array(photoEntrySchema).optional(),
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

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.nom !== undefined) updateData.nom = body.nom;
  if (body.categorie !== undefined) updateData.categorie = body.categorie;
  if (body.categorieVente !== undefined) {
    updateData.categorieVente = body.categorieVente;
    if (body.tauxTva === undefined && body.categorieVente) {
      updateData.tauxTva = TVA_PAR_CATEGORIE[body.categorieVente]?.toString() ?? null;
    }
  }
  if (body.tauxTva !== undefined) updateData.tauxTva = body.tauxTva?.toString() ?? null;
  if (body.unite !== undefined) updateData.unite = body.unite;
  if (body.seuilAlerte !== undefined) updateData.seuilAlerte = body.seuilAlerte?.toString() ?? null;
  if (body.prixUnitaire !== undefined)
    updateData.prixUnitaire = body.prixUnitaire?.toString() ?? null;
  if (body.fournisseur !== undefined) updateData.fournisseur = body.fournisseur;
  if (body.emplacement !== undefined) updateData.emplacement = body.emplacement;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.typeMiel !== undefined) updateData.typeMiel = body.typeMiel;
  if (body.presentation !== undefined) updateData.presentation = body.presentation;
  if (body.conditionnementMiel !== undefined) updateData.conditionnement = body.conditionnementMiel;
  if (body.anneeRecolte !== undefined) updateData.anneeRecolte = body.anneeRecolte;
  if (body.numLot !== undefined) updateData.numLot = body.numLot;
  if (body.origineGeo !== undefined) updateData.origineGeo = body.origineGeo;
  if (body.photos !== undefined) updateData.photos = body.photos;

  const [updated] = await db
    .update(stocks)
    .set(updateData)
    .where(and(eq(stocks.id, id), eq(stocks.userId, user.id)))
    .returning();

  if (!updated) internalError('Erreur lors de la mise à jour');

  return { data: updated };
});
