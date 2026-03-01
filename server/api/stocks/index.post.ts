import { z } from 'zod';
import { stocks } from '~~/server/database/schema';

/** TVA automatique par catégorie de vente — droit fiscal français */
const TVA_PAR_CATEGORIE: Record<string, number> = {
  // 5,5% — Produits alimentaires (Art. 278-0 bis A CGI)
  miel: 5.5,
  gelee_royale: 5.5,
  pollen: 5.5,
  propolis_alimentaire: 5.5,
  pain_abeille: 5.5,
  cire_alimentaire: 5.5,
  vinaigre_miel: 5.5,
  // 10% — Animaux vivants + médicaments vétérinaires (Art. 278 bis CGI)
  essaim: 10,
  reine: 10,
  ruche_peuplee: 10,
  nourrissement: 10,
  traitement_veterinaire: 10,
  // 20% — Taux normal (Art. 278 CGI)
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
  categorieVente: z.enum(CATEGORIE_VENTE_VALUES).optional(),
  tauxTva: z.coerce.number().min(0).max(100).optional(),
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

  // Auto-calcul du taux TVA depuis la catégorie de vente si non fourni
  const tauxTva =
    body.tauxTva ?? (body.categorieVente ? TVA_PAR_CATEGORIE[body.categorieVente] : null);

  const [created] = await db
    .insert(stocks)
    .values({
      userId: user.id,
      nom: body.nom,
      categorie: body.categorie,
      categorieVente: body.categorieVente ?? null,
      tauxTva: tauxTva?.toString() ?? null,
      quantite: body.quantite.toString(),
      unite: body.unite ?? null,
      seuilAlerte: body.seuilAlerte?.toString() ?? null,
      prixUnitaire: body.prixUnitaire?.toString() ?? null,
      fournisseur: body.fournisseur ?? null,
      emplacement: body.emplacement ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  if (!created) internalError('Erreur lors de la création');

  setResponseStatus(event, 201);
  return { data: created };
});
