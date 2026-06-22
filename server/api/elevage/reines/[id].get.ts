import { eq, and } from 'drizzle-orm';
import { reinesElevage, lignees, testsPerformance } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [[reineRow], tests] = await Promise.all([
    db
      .select({ reine: reinesElevage, ligneeNom: lignees.nom, ligneeRace: lignees.race })
      .from(reinesElevage)
      .leftJoin(lignees, eq(reinesElevage.ligneeId, lignees.id))
      .where(and(eq(reinesElevage.id, id!), eq(reinesElevage.userId, user.id)))
      .limit(1),
    db
      .select()
      .from(testsPerformance)
      .where(and(eq(testsPerformance.reineId, id!), eq(testsPerformance.userId, user.id))),
  ]);

  if (!reineRow) notFound('Reine introuvable');
  return { data: { ...reineRow, tests } };
});
