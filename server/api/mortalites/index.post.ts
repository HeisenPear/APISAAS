import { z } from 'zod';
import { mortalites, ruchers } from '~~/server/database/schema';

const schema = z.object({
  rucherId: z.string().uuid().optional(),
  dateConstatee: z.string().datetime(),
  type: z.string().min(1).max(100),
  nombreColonies: z.number().int().min(1),
  causeSuspectee: z.string().max(500).trim().optional(),
  declarationTraces: z.boolean().default(false),
  declarationAssurance: z.boolean().default(false),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // La FK cliente doit appartenir à l'espace (sinon fuite du nom de rucher /
  // atteinte d'intégrité cross-tenant à qui connaît l'UUID).
  await assertFkBelongsToOwner(
    ownerId,
    ruchers,
    ruchers.id,
    ruchers.userId,
    body.rucherId,
    'Rucher',
  );

  const [created] = await db
    .insert(mortalites)
    .values({
      ...body,
      dateConstatee: new Date(body.dateConstatee),
      userId: ownerId,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
