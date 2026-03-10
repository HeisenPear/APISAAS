import { eq } from 'drizzle-orm';
import { templatesIntervention } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const data = await db
    .select()
    .from(templatesIntervention)
    .where(eq(templatesIntervention.userId, user.id))
    .orderBy(templatesIntervention.nom);

  return { data };
});
