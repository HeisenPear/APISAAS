import { eq, desc } from 'drizzle-orm';
import { mortalites, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const data = await db
    .select({ mortalite: mortalites, rucherNom: ruchers.nom })
    .from(mortalites)
    .leftJoin(ruchers, eq(mortalites.rucherId, ruchers.id))
    .where(eq(mortalites.userId, ownerId))
    .orderBy(desc(mortalites.dateConstatee));

  return {
    data: data.map((row) => ({ ...row.mortalite, rucherNom: row.rucherNom ?? null })),
  };
});
