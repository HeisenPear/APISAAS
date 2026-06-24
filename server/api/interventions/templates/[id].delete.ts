import { eq, and } from 'drizzle-orm';
import { templatesIntervention } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(templatesIntervention)
    .where(and(eq(templatesIntervention.id, id), eq(templatesIntervention.userId, ownerId)))
    .returning({ id: templatesIntervention.id });

  if (!deleted) notFound('Template introuvable');

  return { data: { id: deleted.id } };
});
