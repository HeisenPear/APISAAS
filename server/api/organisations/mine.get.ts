import { eq } from 'drizzle-orm';
import { organisations } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.ownerId, ownerId))
    .limit(1);

  if (!org) {
    notFound('Aucune organisation trouvee');
  }

  return { data: org };
});
