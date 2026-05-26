import { eq, and } from 'drizzle-orm';
import { interventions, ruches, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [result] = await db
    .select({
      id: interventions.id,
      userId: interventions.userId,
      rucheId: interventions.rucheId,
      rucherId: interventions.rucherId,
      dateVisite: interventions.dateVisite,
      type: interventions.type,
      meteo: interventions.meteo,
      donnees: interventions.donnees,
      notes: interventions.notes,
      photos: interventions.photos,
      dureeMinutes: interventions.dureeMinutes,
      offlineId: interventions.offlineId,
      createdAt: interventions.createdAt,
      updatedAt: interventions.updatedAt,
      ruche: {
        id: ruches.id,
        numero: ruches.numero,
        type: ruches.type,
        statut: ruches.statut,
        rucherId: ruches.rucherId,
      },
      rucher: {
        id: ruchers.id,
        nom: ruchers.nom,
        commune: ruchers.commune,
      },
    })
    .from(interventions)
    .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
    .leftJoin(ruchers, eq(interventions.rucherId, ruchers.id))
    .where(and(eq(interventions.id, id), eq(interventions.userId, user.id)))
    .limit(1);

  if (!result) return notFound('Intervention introuvable');

  return { data: result };
});
