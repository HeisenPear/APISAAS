import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { lignees } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  nom: z.string().min(1).max(255).trim().optional(),
  race: z.enum(['buckfast', 'carnica', 'noire', 'italienne', 'caucasienne', 'hybride']).optional(),
  origine: z.string().max(500).trim().nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
  estActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db.update(lignees).set(body)
    .where(and(eq(lignees.id, id!), eq(lignees.userId, user.id))).returning();
  if (!row) notFound('Lignée introuvable');
  return { data: row };
});
