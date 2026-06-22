import { eq, and } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.userId, user.id)))
    .returning({ id: interventions.id });

  if (!deleted) return notFound('Intervention introuvable');

  return { data: { success: true } };
});
