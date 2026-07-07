import { eq, desc } from 'drizzle-orm';
import { visitesSanitaires, veterinaires, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const data = await db
    .select({
      visite: visitesSanitaires,
      veterinaireNom: veterinaires.nomComplet,
      rucherNom: ruchers.nom,
    })
    .from(visitesSanitaires)
    .leftJoin(veterinaires, eq(visitesSanitaires.veterinaireId, veterinaires.id))
    .leftJoin(ruchers, eq(visitesSanitaires.rucherId, ruchers.id))
    .where(eq(visitesSanitaires.userId, ownerId))
    .orderBy(desc(visitesSanitaires.dateVisite));

  return {
    data: data.map((row) => ({
      ...row.visite,
      veterinaireNom: row.veterinaireNom ?? null,
      rucherNom: row.rucherNom ?? null,
    })),
  };
});
