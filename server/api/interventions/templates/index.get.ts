import { eq } from 'drizzle-orm';
import { templatesIntervention } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const data = await db
    .select()
    .from(templatesIntervention)
    .where(eq(templatesIntervention.userId, ownerId))
    .orderBy(templatesIntervention.nom);

  return { data };
});
