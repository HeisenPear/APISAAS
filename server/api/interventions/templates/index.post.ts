import { z } from 'zod';
import { templatesIntervention } from '~~/server/database/schema';

const schema = z.object({
  nom: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categories: z.array(z.string()).default([]),
  donneesDefaut: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  const [template] = await db
    .insert(templatesIntervention)
    .values({
      userId: ownerId,
      nom: body.nom,
      description: body.description ?? null,
      categories: body.categories,
      donneesDefaut: body.donneesDefaut,
    })
    .returning();

  return { data: template };
});
