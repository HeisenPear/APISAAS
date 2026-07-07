import { z } from 'zod';
import { ordonnances, veterinaires } from '~~/server/database/schema';

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
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // Le vétérinaire référencé doit appartenir à l'espace (sinon fuite de son nom
  // à qui connaît l'UUID / atteinte d'intégrité cross-tenant).
  await assertFkBelongsToOwner(
    ownerId,
    veterinaires,
    veterinaires.id,
    veterinaires.userId,
    body.veterinaireId,
    'Vétérinaire',
  );

  const [created] = await db
    .insert(ordonnances)
    .values({
      ...body,
      datePrescription: new Date(body.datePrescription),
      veterinaireId: body.veterinaireId ?? null,
      documentUrl: body.documentUrl || null,
      userId: ownerId,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
