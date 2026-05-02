import { z } from 'zod';
import { mortalites } from '~~/server/database/schema';

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
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [created] = await db
    .insert(mortalites)
    .values({
      ...body,
      dateConstatee: new Date(body.dateConstatee),
      userId: user.id,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
