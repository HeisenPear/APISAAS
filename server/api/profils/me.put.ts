import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const updateProfilSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').trim().optional(),
  prenom: z.string().min(1, 'Le prenom est requis').trim().optional(),
  /**
   * Nom commercial — facultatif, et EFFAÇABLE : `nullable()` autorise le vider,
   * sans quoi un apiculteur qui change d'avis resterait coincé avec.
   *
   * La borne à 80 caractères est celle de l'en-tête de facture : au-delà, le
   * nom déborde de son bloc (55 % de la largeur du document) ou écrase le titre
   * « FACTURE » en face. Refuser tôt vaut mieux qu'un document abîmé.
   */
  nomCommercial: z
    .string()
    .trim()
    .max(80, 'Le nom commercial ne peut pas dépasser 80 caractères')
    .optional()
    .nullable(),
  telephone: z.string().trim().optional().nullable(),
  adresse: z.string().trim().optional().nullable(),
  codePostal: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .nullable(),
  ville: z.string().trim().optional().nullable(),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres')
    .optional()
    .nullable(),
  napi: z.string().trim().optional().nullable(),
  optionTvaDebits: z.boolean().optional(),
  franchiseTva: z.boolean().optional(),
  preferences: z
    .record(z.unknown())
    .optional()
    .nullable()
    .refine(
      (v) => !v || JSON.stringify(v).length < 10000,
      'Préférences trop volumineuses (max 10 Ko)',
    ),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, updateProfilSchema.parse);

  const [updatedProfil] = await db
    .update(profils)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(profils.id, user.id))
    .returning();

  if (!updatedProfil) {
    notFound('Profil introuvable');
  }

  return { data: updatedProfil };
});
