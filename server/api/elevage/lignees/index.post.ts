import { z } from 'zod';
import { lignees } from '~~/server/database/schema';

const schema = z.object({
  nom: z.string().min(1).max(255).trim(),
  race: z.enum(['buckfast', 'carnica', 'noire', 'italienne', 'caucasienne', 'hybride']),
  origine: z.string().max(500).trim().optional(),
  dateCreation: z.string().datetime(),
  notes: z.string().max(2000).trim().optional(),
  estActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db.insert(lignees).values({
    ...body,
    dateCreation: new Date(body.dateCreation),
    userId: user.id,
  }).returning();

  if (!row) internalError('Erreur création lignée');
  setResponseStatus(event, 201);
  return { data: row };
});
