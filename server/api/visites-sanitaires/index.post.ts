import { z } from 'zod';
import { visitesSanitaires } from '~~/server/database/schema';

const schema = z.object({
  veterinaireId: z.string().uuid().optional(),
  dateVisite: z.string().datetime(),
  rucherId: z.string().uuid().optional(),
  observations: z.string().max(3000).trim().optional(),
  recommandations: z.string().max(3000).trim().optional(),
  rapportUrl: z.string().url().optional().or(z.literal('')),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [created] = await db
    .insert(visitesSanitaires)
    .values({
      ...body,
      dateVisite: new Date(body.dateVisite),
      userId: user.id,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
