import { eq, and } from 'drizzle-orm';
import { emplacements } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(emplacements)
    .where(and(eq(emplacements.id, id!), eq(emplacements.userId, user.id)))
    .returning({ id: emplacements.id });
  if (!deleted) notFound('Emplacement introuvable');
  return { data: { id: deleted.id } };
});
