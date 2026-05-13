import { z } from 'zod';

const photoEntrySchema = z.object({
  url: z.string(),
  path: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  caption: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════
// PHASE 2 — 13 Schemas Zod pour les catégories d'intervention
// Chaque schema correspond à une catégorie dans le wizard bulk
// ═══════════════════════════════════════════════════════════

// ─── 1. Matériel ────────────────────────────────────────

export const materielSchema = z.object({
  elements: z
    .array(
      z.object({
        element: z.enum([
          'cadres',
          'cadres_male',
          'partitions',
          'nourrisseurs',
          'corps',
          'hausses',
          'grille_reine',
          'grille_propolis',
          'trappe_pollen',
        ]),
        quantite: z.number().int().min(1),
      }),
    )
    .min(1),
});

// ─── 2. Contrôle ────────────────────────────────────────

export const controleSchema = z.object({
  reineVue: z.boolean().nullable().default(null),
  couvainPresent: z.boolean().nullable().default(null),
  celluleRoyale: z.boolean().nullable().default(null),
  reserves: z.boolean().nullable().default(null),
  forceColonie: z.number().int().min(1).max(4),
  comportement: z.enum(['calme', 'agitee', 'agressive']),
});

// ─── 3. Récolte ─────────────────────────────────────────

export const recolteSchema = z.object({
  typeProduit: z.enum(['miel', 'pollen', 'propolis']),
});

// ─── 4. Nourrissement ───────────────────────────────────

export const nourrissementSchema = z.object({
  type: z.enum(['sirop_sucre', 'sirop_glucose', 'candi', 'pate_proteique', 'miel', 'autre']),
  quantite: z.number().positive(),
  unite: z.enum(['kg', 'g', 'litres', 'ml']),
});

// ─── 5. Essaimage ───────────────────────────────────────

export const essaimageSchema = z.object({
  essaimRecupere: z.boolean(),
});

// ─── 6. Division ────────────────────────────────────────

export const divisionSchema = z.object({
  nombreDivisions: z.number().int().min(1).max(10),
});

// ─── 7. Déplacement ─────────────────────────────────────

export const deplacementSchema = z.object({
  rucherDestinationId: z.string().uuid(),
});

// ─── 8. Varroa (discriminatedUnion sur sousAction) ──────

export const varroaSchema = z.discriminatedUnion('sousAction', [
  z.object({
    sousAction: z.literal('comptage_plancher'),
    nombreVarroas: z.number().int().min(0),
    dureeJours: z.number().int().min(1).default(3),
  }),
  z.object({
    sousAction: z.literal('traitement'),
    typeTraitement: z.string().min(1),
    dateDebut: z.string().datetime(),
    dateFinPrevue: z.string().datetime().optional(),
    dosage: z.string().optional(),
    numeroLotProduit: z.string().min(1),
  }),
  z.object({
    sousAction: z.literal('suppression_couvain'),
    nombreCadres: z.number().int().min(1),
  }),
  z.object({
    sousAction: z.literal('vph'),
    nombreVarroas: z.number().int().min(0),
    nombreAbeilles: z.number().int().min(1).default(300),
  }),
]);

// ─── 9. Pesée ───────────────────────────────────────────

export const peseeSchema = z.object({
  poidsKg: z.number().positive(),
  typePesee: z.enum(['totale', 'cote_droit', 'cote_gauche', 'arriere']),
});

// ─── 10. Commentaire ────────────────────────────────────

export const commentaireSchema = z.object({
  texte: z.string().max(2000),
});

// ─── 11. Empilement ─────────────────────────────────────

export const empilementSchema = z.object({
  rucheDestinationId: z.string().uuid(),
});

// ─── 12. Sanitaire ──────────────────────────────────────

export const sanitaireSchema = z.object({
  typeEvenement: z.enum(['essaim_mort', 'nettoyer_ruche', 'nettoyer_plancher', 'retrait_couvain']),
  causeProbable: z
    .enum(['varroa', 'famine', 'pesticides', 'maladie', 'pillage', 'froid', 'inconnue', 'autre'])
    .optional(),
  declarationGdsa: z.boolean().optional(),
  typeNettoyage: z.string().optional(),
  produitUtilise: z.string().optional(),
  typeCouvain: z.string().optional(),
  nombreCadres: z.number().int().min(0).optional(),
});

// ─── 13. Transvasement ──────────────────────────────────

export const transvasementSchema = z.object({
  rucheDestinationId: z.string().uuid(),
  cadresTransferes: z.number().int().min(1),
  devenirRucheSource: z.enum([
    'stockage',
    'destruction',
    'reutilisation',
    'reutilisation_immediate',
  ]),
  lieuStockage: z.string().optional(),
});

// ─── 14. Reine (Phase 3) ────────────────────────────────

export const reineSchema = z.object({
  typeEvenement: z.enum([
    'introduction',
    'marquage',
    'clipping',
    'remplacement',
    'perte',
    'ponte_vue',
    'cellule_royale_trouvee',
    'elevage',
  ]),
  dateEvenement: z.string().datetime({ offset: true }).optional(),
  couleur: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).optional(),
  origine: z.enum(['elevage_propre', 'achat', 'capture_essaim', 'inconnue']).optional(),
  actionOrpheline: z.enum(['attente', 'introduction_reine', 'fusion', 'abandon']).optional(),
  qualitePonte: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
});

// ═══════════════════════════════════════════════════════════
// Map catégorie → schema (pour validation dynamique)
// ═══════════════════════════════════════════════════════════

export const categorieSchemaMap: Record<string, z.ZodTypeAny> = {
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

// ═══════════════════════════════════════════════════════════
// Schema météo (partagé)
// ═══════════════════════════════════════════════════════════

export const meteoSchema = z
  .object({
    temperature: z.number().optional(),
    vent: z.string().optional(),
    ciel: z.string().optional(),
    humidite: z.number().min(0).max(100).optional(),
    conditions: z.string().optional(),
  })
  .optional();

// ═══════════════════════════════════════════════════════════
// BULK INTERVENTION — Schema orchestrateur Phase 2
// POST /api/interventions/bulk
// ═══════════════════════════════════════════════════════════

export const bulkInterventionSchema = z
  .object({
    rucheId: z.string().uuid(),
    dateVisite: z.string().datetime().optional(),
    dureeMinutes: z.number().int().min(0).optional(),
    notes: z.string().max(5000).optional(),
    photos: z.array(photoEntrySchema).optional(),
    meteo: meteoSchema,
    categories: z.record(z.record(z.unknown())),
  })
  .superRefine((data, ctx) => {
    const cats = Object.keys(data.categories);
    if (cats.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Au moins une catégorie doit être sélectionnée',
        path: ['categories'],
      });
      return;
    }
    for (const cat of cats) {
      const schema = categorieSchemaMap[cat];
      if (!schema) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Catégorie inconnue : ${cat}`,
          path: ['categories', cat],
        });
        continue;
      }
      const result = schema.safeParse(data.categories[cat]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ['categories', cat, ...issue.path],
          });
        }
      }
    }
  });

// ═══════════════════════════════════════════════════════════
// LEGACY — Compatibilité routes existantes (Phase 1)
// Ces exports seront supprimés quand les routes seront migrées
// ═══════════════════════════════════════════════════════════

/** @deprecated Utiliser categorieSchemaMap */
export const donneesSchemaMap: Record<string, z.ZodTypeAny> = categorieSchemaMap;

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
] as const;

/** @deprecated Utiliser bulkInterventionSchema */
export const createInterventionSchema = z
  .object({
    rucheId: z.string().uuid(),
    rucherId: z.string().uuid().optional(),
    date: z.coerce.date().optional(),
    type: z.enum(TYPES_INTERVENTION),
    dureeMinutes: z.number().int().min(0).optional(),
    meteo: meteoSchema,
    donnees: z.record(z.unknown()),
    commentaire: z.string().max(2000).optional(),
    photos: z.array(photoEntrySchema).optional(),
    offlineId: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const schema = categorieSchemaMap[data.type];
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

/** @deprecated */
export const updateInterventionSchema = z
  .object({
    date: z.coerce.date().optional(),
    dureeMinutes: z.number().int().min(0).optional(),
    meteo: meteoSchema,
    donnees: z.record(z.unknown()).optional(),
    commentaire: z.string().max(2000).optional(),
    photos: z.array(photoEntrySchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni',
  });
