import { eq, and, desc } from 'drizzle-orm';
import { historiqueCire, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const rucheId = getRouterParam(event, 'id');
  if (!rucheId) return badRequest('ID manquant');
  uuidSchema.parse(rucheId);

  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, rucheId), eq(ruches.userId, ownerId)))
    .limit(1);
  if (!ruche) return notFound('Ruche introuvable');

  const historique = await db
    .select()
    .from(historiqueCire)
    .where(and(eq(historiqueCire.rucheId, rucheId), eq(historiqueCire.userId, ownerId)))
    .orderBy(desc(historiqueCire.dateRenouvellement));

  return { data: historique };
});
