import { eq, asc } from 'drizzle-orm';
import { sites } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const rows = await db
    .select()
    .from(sites)
    .where(eq(sites.userId, user.id))
    .orderBy(asc(sites.nom));

  return { data: rows };
});
