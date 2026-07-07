import { eq, and } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    badRequest('ID manquant');
  }

  uuidSchema.parse(id);

  const [result] = await db
    .select({
      id: ruches.id,
      userId: ruches.userId,
      rucherId: ruches.rucherId,
      numero: ruches.numero,
      type: ruches.type,
      statut: ruches.statut,
      raceAbeille: ruches.raceAbeille,
      qualiteReine: ruches.qualiteReine,
      dateInstallation: ruches.dateInstallation,
      origineEssaim: ruches.origineEssaim,
      marquageReine: ruches.marquageReine,
      nombreCadres: ruches.nombreCadres,
      nombreHausses: ruches.nombreHausses,
      notes: ruches.notes,
      photoUrl: ruches.photoUrl,
      createdAt: ruches.createdAt,
      updatedAt: ruches.updatedAt,
      rucher: {
        id: ruchers.id,
        nom: ruchers.nom,
        commune: ruchers.commune,
        departement: ruchers.departement,
      },
    })
    .from(ruches)
    .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
    .where(and(eq(ruches.id, id), eq(ruches.userId, ownerId)))
    .limit(1);

  if (!result) {
    notFound('Ruche introuvable');
  }

  return { data: result };
});
