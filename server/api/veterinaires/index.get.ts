import { eq, desc } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const data = await db
    .select()
    .from(veterinaires)
    .where(eq(veterinaires.userId, user.id))
    .orderBy(desc(veterinaires.estPrincipal), veterinaires.nomComplet);

  return { data };
});
