import { eq, and } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';
import { z } from 'zod';

const bodySchema = z.object({
  lue: z.boolean(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = bodySchema.parse(await readBody(event));

  const [updated] = await db
    .update(alertes)
    .set({ lue: body.lue, updatedAt: new Date() })
    .where(and(eq(alertes.id, id), eq(alertes.userId, user.id)))
    .returning();

  if (!updated) notFound('Alerte introuvable');

  return { data: updated };
});
