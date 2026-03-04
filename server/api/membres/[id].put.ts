import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres } from '~~/server/database/schema';

const updateSchema = z.object({
  role: z.enum(['admin', 'apiculteur', 'comptable']),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateSchema.parse);

  const [updated] = await db
    .update(membres)
    .set({ role: body.role, updatedAt: new Date() })
    .where(and(eq(membres.id, id), eq(membres.ownerId, user.id)))
    .returning();

  if (!updated) return notFound('Membre introuvable');

  return { data: updated };
});
