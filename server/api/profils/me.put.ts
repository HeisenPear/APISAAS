import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const updateProfilSchema = z.object({
  /**
   * ⚠️ L'ORDRE DES CHECKS ZOD N'EST PAS COSMÉTIQUE. Ils s'appliquent DANS
   * L'ORDRE DÉCLARÉ : `z.string().min(1).trim()` mesure la longueur AVANT de
   * rogner, si bien que `'   '` passait la validation et s'écrivait en base
   * comme chaîne VIDE. Trois gestes suffisaient : Réglages › Nom › une espace ›
   * Entrée.
   *
   * C'était déjà faux ; c'est devenu grave depuis que `refusIdentiteEmetteur`
   * bloque l'émission d'une facture sans nom. L'apiculteur se retrouvait sans
   * facture possible, avec un refus qui le renvoyait « dans Réglages › Mon
   * profil » — l'écran exact où il venait de vider son nom, sans que rien ne
   * l'ait averti.
   */
  nom: z.string().trim().min(1, 'Le nom est requis').optional(),
  prenom: z.string().trim().min(1, 'Le prenom est requis').optional(),
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
