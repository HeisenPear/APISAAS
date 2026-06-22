import { eq } from 'drizzle-orm';
import { tokensCalendrier } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const data = await db
    .select()
    .from(tokensCalendrier)
    .where(eq(tokensCalendrier.userId, user.id))
    .orderBy(tokensCalendrier.createdAt);

  return { data };
});
