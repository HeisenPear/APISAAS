import { eq, and } from 'drizzle-orm';
import { hausses, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [row] = await db
    .select({ hausse: hausses, rucheNumero: ruches.numero })
    .from(hausses)
    .leftJoin(ruches, eq(hausses.rucheId, ruches.id))
    .where(and(eq(hausses.id, id), eq(hausses.userId, ownerId)))
    .limit(1);

  if (!row) return notFound('Hausse introuvable');

  return { data: { ...row.hausse, rucheNumero: row.rucheNumero } };
});
