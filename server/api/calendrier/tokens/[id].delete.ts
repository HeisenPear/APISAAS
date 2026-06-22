import { eq, and } from 'drizzle-orm';
import { tokensCalendrier } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(tokensCalendrier)
    .where(and(eq(tokensCalendrier.id, id), eq(tokensCalendrier.userId, user.id)))
    .returning({ id: tokensCalendrier.id });

  if (!deleted) notFound('Token introuvable');

  return { data: { id: deleted.id } };
});
