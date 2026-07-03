import { z } from 'zod';
import { organisations } from '~~/server/database/schema';

const createOrganisationSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200).trim(),
  type: z.enum(['gdsa', 'syndicat', 'cuma', 'gie', 'gaec', 'association', 'autre']),
  siret: z.string().max(14).trim().optional(),
  adresse: z.string().trim().optional(),
  codePostal: z.string().max(5).trim().optional(),
  ville: z.string().trim().optional(),
  email: z.string().email('Email invalide').optional(),
  telephone: z.string().trim().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, createOrganisationSchema.parse);

  const [newOrg] = await db
    .insert(organisations)
    .values({
      ...body,
      ownerId: ownerId,
    })
    .returning();

  if (!newOrg) {
    internalError("Erreur lors de la creation de l'organisation");
  }

  setResponseStatus(event, 201);
  return { data: newOrg };
});
