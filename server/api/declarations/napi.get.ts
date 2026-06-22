import { eq, desc } from 'drizzle-orm';
import { declarationsNapi } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const data = await db
    .select()
    .from(declarationsNapi)
    .where(eq(declarationsNapi.userId, user.id))
    .orderBy(desc(declarationsNapi.annee));

  return { data };
});
