import { z } from 'zod';
import { ordonnances } from '~~/server/database/schema';

const schema = z.object({
  veterinaireId: z.string().uuid().optional(),
  datePrescription: z.string().datetime(),
  medicament: z.string().min(1).max(255).trim(),
  substance: z.string().max(255).trim().optional(),
  posologie: z.string().max(1000).trim().optional(),
  dureeTraitementJours: z.number().int().min(1).optional(),
  delaiAttenteAvantRecolteJours: z.number().int().min(0),
  ruchesConcernees: z.array(z.string().uuid()).optional(),
  documentUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [created] = await db
    .insert(ordonnances)
    .values({
      ...body,
      datePrescription: new Date(body.datePrescription),
      veterinaireId: body.veterinaireId ?? null,
      documentUrl: body.documentUrl || null,
      userId: user.id,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
