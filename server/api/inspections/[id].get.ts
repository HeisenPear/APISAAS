import { eq, and } from 'drizzle-orm';
import { inspections, ruches, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [result] = await db
    .select({
      id: inspections.id,
      userId: inspections.userId,
      rucheId: inspections.rucheId,
      dateVisite: inspections.dateVisite,
      type: inspections.type,
      meteo: inspections.meteo,
      forceColonie: inspections.forceColonie,
      couvain: inspections.couvain,
      reserves: inspections.reserves,
      comportement: inspections.comportement,
      reineVue: inspections.reineVue,
      celluleRoyale: inspections.celluleRoyale,
      signeEssaimage: inspections.signeEssaimage,
      varroa: inspections.varroa,
      traitementApplique: inspections.traitementApplique,
      maladieObservee: inspections.maladieObservee,
      actionsRealisees: inspections.actionsRealisees,
      nourrissementType: inspections.nourrissementType,
      nourrissementQuantite: inspections.nourrissementQuantite,
      notes: inspections.notes,
      photos: inspections.photos,
      dureeMinutes: inspections.dureeMinutes,
      syncedAt: inspections.syncedAt,
      offlineId: inspections.offlineId,
      createdAt: inspections.createdAt,
      updatedAt: inspections.updatedAt,
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
    .from(inspections)
    .leftJoin(ruches, eq(inspections.rucheId, ruches.id))
    .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
    .where(and(eq(inspections.id, id), eq(inspections.userId, user.id)))
    .limit(1);

  if (!result) notFound('Inspection introuvable');

  return { data: result };
});
