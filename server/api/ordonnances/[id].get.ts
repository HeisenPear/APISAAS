import { eq, and } from 'drizzle-orm';
import { ordonnances, veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');

  const [row] = await db
    .select({ ordonnance: ordonnances, veterinaire: veterinaires })
    .from(ordonnances)
    .leftJoin(veterinaires, eq(ordonnances.veterinaireId, veterinaires.id))
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, user.id)))
    .limit(1);

  if (!row) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { data: { ...row.ordonnance, veterinaire: row.veterinaire } };
});
