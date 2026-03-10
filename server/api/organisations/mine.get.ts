import { eq } from 'drizzle-orm';
import { organisations } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.ownerId, user.id))
    .limit(1);

  if (!org) {
    notFound('Aucune organisation trouvee');
  }

  return { data: org };
});
