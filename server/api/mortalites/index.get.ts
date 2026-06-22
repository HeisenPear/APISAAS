import { eq, desc } from 'drizzle-orm';
import { mortalites, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const data = await db
    .select({ mortalite: mortalites, rucherNom: ruchers.nom })
    .from(mortalites)
    .leftJoin(ruchers, eq(mortalites.rucherId, ruchers.id))
    .where(eq(mortalites.userId, user.id))
    .orderBy(desc(mortalites.dateConstatee));

  return {
    data: data.map((row) => ({ ...row.mortalite, rucherNom: row.rucherNom ?? null })),
  };
});
