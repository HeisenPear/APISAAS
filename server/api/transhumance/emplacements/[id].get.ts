import { eq, and } from 'drizzle-orm';
import { emplacements } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [row] = await db
    .select()
    .from(emplacements)
    .where(and(eq(emplacements.id, id!), eq(emplacements.userId, ownerId)))
    .limit(1);
  if (!row) notFound('Emplacement introuvable');
  return { data: row };
});
