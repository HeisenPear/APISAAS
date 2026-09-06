import { z } from 'zod';

// ─── Schemas Module Reine (Phase 3) ──────────────────────────

const typeEvenementReine = z.enum([
  'introduction',
  'marquage',
  'clipping',
  'remplacement',
  'perte',
  'ponte_vue',
  'cellule_royale_trouvee',
  'elevage',
]);

const couleurReine = z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']);
const origineReine = z.enum(['elevage_propre', 'achat', 'capture_essaim', 'inconnue']);
const actionOrpheline = z.enum(['attente', 'introduction_reine', 'fusion', 'abandon']);
const raceAbeille = z.enum([
  'noire',
  'buckfast',
  'carnica',
  'italienne',
  'caucasienne',
  'hybride',
  'inconnue',
]);

/** Création d'un événement reine */
export const createEvenementReineSchema = z.object({
  interventionId: z.string().uuid().optional(),
  typeEvenement: typeEvenementReine,
  dateEvenement: z.string().datetime({ offset: true }),
  couleur: couleurReine.optional(),
  origine: origineReine.optional(),
  race: raceAbeille.optional(),
  actionOrpheline: actionOrpheline.optional(),
  qualitePonte: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
});

/** Mise à jour des infos reine sur une ruche */
export const updateReineRucheSchema = z.object({
  reinePresente: z.boolean().optional(),
  reineCouleur: couleurReine.optional().nullable(),
  reineAnnee: z.number().int().min(2000).max(2100).optional().nullable(),
  reineRace: raceAbeille.optional(),
  reineOrigine: origineReine.optional(),
  reineDateIntroduction: z.string().datetime({ offset: true }).optional().nullable(),
  reineQualitePonte: z.number().int().min(1).max(5).optional().nullable(),
  reineDouceur: z.number().int().min(1).max(5).optional().nullable(),
  reineProlificite: z.number().int().min(1).max(5).optional().nullable(),
});

export type CreateEvenementReineInput = z.infer<typeof createEvenementReineSchema>;
export type UpdateReineRucheInput = z.infer<typeof updateReineRucheSchema>;
