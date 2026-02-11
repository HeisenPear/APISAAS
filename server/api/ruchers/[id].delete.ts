import { eq, and } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Soft delete: set actif = false
  const [updated] = await db
    .update(ruchers)
    .set({ actif: false, updatedAt: new Date() })
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, user.id)))
    .returning();

  if (!updated) notFound('Rucher introuvable');

  return { data: { success: true } };
});
