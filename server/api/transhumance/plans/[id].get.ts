import { eq, and } from 'drizzle-orm';
import { plansTranshumance } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [row] = await db
    .select()
    .from(plansTranshumance)
    .where(and(eq(plansTranshumance.id, id!), eq(plansTranshumance.userId, user.id)));
  if (!row) notFound('Plan introuvable');
  return { data: row };
});
