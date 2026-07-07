import { eq, and } from 'drizzle-orm';
import { ordonnances, veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');

  const [row] = await db
    .select({ ordonnance: ordonnances, veterinaire: veterinaires })
    .from(ordonnances)
    .leftJoin(veterinaires, eq(ordonnances.veterinaireId, veterinaires.id))
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, ownerId)))
    .limit(1);

  if (!row) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { data: { ...row.ordonnance, veterinaire: row.veterinaire } };
});
