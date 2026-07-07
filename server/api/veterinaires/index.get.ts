import { eq, desc } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const data = await db
    .select()
    .from(veterinaires)
    .where(eq(veterinaires.userId, ownerId))
    .orderBy(desc(veterinaires.estPrincipal), veterinaires.nomComplet);

  return { data };
});
