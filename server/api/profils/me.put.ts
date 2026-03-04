import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const updateProfilSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').trim().optional(),
  prenom: z.string().min(1, 'Le prenom est requis').trim().optional(),
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
