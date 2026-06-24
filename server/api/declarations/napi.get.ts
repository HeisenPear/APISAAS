import { eq, desc } from 'drizzle-orm';
import { declarationsNapi } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const data = await db
    .select()
    .from(declarationsNapi)
    .where(eq(declarationsNapi.userId, ownerId))
    .orderBy(desc(declarationsNapi.annee));

  return { data };
});
