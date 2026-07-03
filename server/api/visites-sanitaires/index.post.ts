import { z } from 'zod';
import { visitesSanitaires, veterinaires, ruchers } from '~~/server/database/schema';

const schema = z.object({
  veterinaireId: z.string().uuid().optional(),
  dateVisite: z.string().datetime(),
  rucherId: z.string().uuid().optional(),
  observations: z.string().max(3000).trim().optional(),
  recommandations: z.string().max(3000).trim().optional(),
  rapportUrl: z.string().url().optional().or(z.literal('')),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // Les FK client doivent appartenir à l'espace (anti fuite de nom / intégrité cross-tenant).
  await assertFkBelongsToOwner(
    ownerId,
    veterinaires,
    veterinaires.id,
    veterinaires.userId,
    body.veterinaireId,
    'Vétérinaire',
  );
  await assertFkBelongsToOwner(
    ownerId,
    ruchers,
    ruchers.id,
    ruchers.userId,
    body.rucherId,
    'Rucher',
  );

  const [created] = await db
    .insert(visitesSanitaires)
    .values({
      ...body,
      dateVisite: new Date(body.dateVisite),
      userId: ownerId,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
