import { z } from 'zod';

// ─── Schemas donnees par type ───────────────────────────

const materielSchema = z.object({
  action: z.enum(['ajout', 'retrait', 'remplacement']),
  elements: z
    .array(
      z.object({
        type: z.string().min(1),
        quantite: z.number().int().min(1),
      }),
    )
    .min(1),
});

const controleSchema = z.object({
  reine_vue: z.boolean().nullable(),
  couvain_present: z.boolean().nullable(),
  cellules_royales: z.boolean().nullable(),
  reserves_presentes: z.boolean().nullable(),
  force_colonie: z.number().int().min(1).max(4),
  comportement: z.enum(['calme', 'agitee', 'agressive']),
});

const recolteSchema = z.object({
  type_produit: z.enum(['miel', 'pollen', 'propolis']),
  quantite: z.number().positive(),
  unite: z.enum(['kg', 'g', 'litres']),
  type_miel: z.string().optional(),
  taux_humidite: z.number().min(0).max(100).optional(),
  numero_lot: z.string().min(1),
  notes_qualite: z.string().max(2000).optional(),
});

const nourrissementSchema = z.object({
  type_nourriture: z.enum([
    'sirop_sucre',
    'sirop_glucose',
    'candi',
    'pate_proteique',
    'miel',
    'autre',
  ]),
  quantite: z.number().positive(),
  unite: z.enum(['kg', 'g', 'litres', 'ml']),
  concentration: z.string().optional(),
});

const essaimageSchema = z.object({
  essaim_recupere: z.boolean(),
  ruche_destination_id: z.string().uuid().optional(),
  nouvelle_ruche: z.boolean().optional(),
  localisation_recuperation: z.string().max(500).optional(),
});

const divisionSchema = z.object({
  nombre_divisions: z.number().int().min(1).max(10),
  ruches_destination_ids: z.array(z.string().uuid()).default([]),
  cadres_par_division: z.number().int().min(1),
  reine_dans_division: z.boolean(),
});

const deplacementSchema = z.object({
  rucher_destination_id: z.string().uuid(),
  emplacement: z.string().max(200).optional(),
  motif: z.enum(['transhumance', 'reorganisation', 'vente', 'autre']),
  date_retour_prevue: z.string().optional(),
});

const varroaSchema = z.object({
  sous_action: z.enum([
    'comptage_plancher',
    'traitement',
    'suppression_couvain_male',
    'comptage_vph',
  ]),
  nombre_varroas: z.number().int().min(0).optional(),
  duree_comptage_jours: z.number().int().min(1).optional(),
  chute_par_jour: z.number().optional(),
  type_traitement: z.string().optional(),
  dosage: z.string().optional(),
  date_debut: z.string().optional(),
  date_fin_prevue: z.string().optional(),
  numero_lot_produit: z.string().optional(),
  nombre_cadres_retires: z.number().int().min(0).optional(),
  nombre_abeilles_echantillon: z.number().int().min(1).optional(),
  taux_vph: z.number().optional(),
});

const peseeSchema = z.object({
  poids_kg: z.number().positive(),
  type_pesee: z.enum(['totale', 'cote_droit', 'cote_gauche', 'arriere']),
  poids_estime_total: z.number().optional(),
  variation_kg: z.number().optional(),
});

const commentaireSchema = z.object({
  texte: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

const empilementSchema = z.object({
  ruche_destination_id: z.string().uuid(),
  methode_reunion: z.enum(['papier_journal', 'directe', 'autre']),
  devenir_ruche_source: z.enum(['stockage', 'destruction', 'reutilisation']),
});

const sanitaireSchema = z.object({
  sous_action: z.enum(['essaim_mort', 'nettoyer_ruche', 'nettoyer_plancher', 'retrait_couvain']),
  cause_probable: z.string().optional(),
  declaration_gdsa: z.boolean().optional(),
  type_nettoyage: z.string().optional(),
  produit_utilise: z.string().optional(),
  type_couvain: z.string().optional(),
  nombre_cadres: z.number().int().min(0).optional(),
});

const transvasementSchema = z.object({
  ruche_destination_id: z.string().uuid(),
  cadres_transferes: z.number().int().min(0),
  devenir_ruche_source: z.enum(['stockage', 'destruction', 'reutilisation_immediate']),
  lieu_stockage_id: z.string().uuid().optional(),
  origine: z.enum(['sauvage', 'transvasement', 'recuperation_particulier', 'achat', 'autre']),
});

const reineSchema = z.object({
  sous_action: z.enum(['marquage', 'changement', 'perte', 'evaluation']),
  couleur: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).optional(),
  annee_marquage: z.number().int().optional(),
  clippage: z.boolean().optional(),
  origine: z.string().optional(),
  race: z.string().optional(),
  fournisseur: z.string().optional(),
  prix: z.number().min(0).optional(),
  date_introduction: z.string().optional(),
  action_orpheline: z
    .enum(['introduction_nouvelle', 'reunion', 'attente_cellule', 'rien'])
    .optional(),
  qualite_ponte: z.number().int().min(1).max(5).optional(),
  douceur: z.number().int().min(1).max(5).optional(),
  prolificite: z.number().int().min(1).max(5).optional(),
});

// ─── Map type → schema ──────────────────────────────────
export const donneesSchemaMap: Record<string, z.ZodTypeAny> = {
  materiel: materielSchema,
  controle: controleSchema,
  recolte: recolteSchema,
  nourrissement: nourrissementSchema,
  essaimage: essaimageSchema,
  division: divisionSchema,
  deplacement: deplacementSchema,
  varroa: varroaSchema,
  pesee: peseeSchema,
  commentaire: commentaireSchema,
  empilement: empilementSchema,
  sanitaire: sanitaireSchema,
  transvasement: transvasementSchema,
  reine: reineSchema,
};

// ─── Schema principal ───────────────────────────────────
export const TYPES_INTERVENTION = [
  'materiel',
  'controle',
  'recolte',
  'nourrissement',
  'essaimage',
  'division',
  'deplacement',
  'varroa',
  'pesee',
  'commentaire',
  'empilement',
  'sanitaire',
  'transvasement',
  'reine',
] as const;

export const createInterventionSchema = z
  .object({
    rucheId: z.string().uuid(),
    rucherId: z.string().uuid().optional(),
    date: z.coerce.date().optional(),
    type: z.enum(TYPES_INTERVENTION),
    dureeMinutes: z.number().int().min(0).optional(),
    meteo: z
      .object({
        temperature: z.number().optional(),
        vent: z.string().optional(),
        ciel: z.string().optional(),
        humidite: z.number().optional(),
        conditions: z.string().optional(),
      })
      .optional(),
    donnees: z.record(z.unknown()),
    commentaire: z.string().max(2000).optional(),
    photos: z.array(z.string()).optional(),
    offlineId: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const schema = donneesSchemaMap[data.type];
    if (schema) {
      const result = schema.safeParse(data.donnees);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ['donnees', ...issue.path],
          });
        }
      }
    }
  });

export const updateInterventionSchema = z
  .object({
    date: z.coerce.date().optional(),
    dureeMinutes: z.number().int().min(0).optional(),
    meteo: z
      .object({
        temperature: z.number().optional(),
        vent: z.string().optional(),
        ciel: z.string().optional(),
        humidite: z.number().optional(),
        conditions: z.string().optional(),
      })
      .optional(),
    donnees: z.record(z.unknown()).optional(),
    commentaire: z.string().max(2000).optional(),
    photos: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit etre fourni',
  });
