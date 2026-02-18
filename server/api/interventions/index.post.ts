import { eq, and } from 'drizzle-orm';
import { inspections, ruches } from '~~/server/database/schema';
import { createInterventionSchema } from '~~/server/utils/validation/interventions';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createInterventionSchema.parse);

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) return badRequest('Ruche introuvable ou non autorisee');

  const [created] = await db
    .insert(inspections)
    .values({
      userId: user.id,
      rucheId: body.rucheId,
      rucherId: body.rucherId ?? ruche.rucherId,
      dateVisite: body.date ?? new Date(),
      type: body.type,
      meteo: body.meteo ?? null,
      donnees: body.donnees,
      notes: body.commentaire ?? null,
      photos: body.photos ?? [],
      dureeMinutes: body.dureeMinutes ?? null,
      offlineId: body.offlineId ?? null,
    })
    .returning();

  if (!created) return internalError('Erreur lors de la creation');

  setResponseStatus(event, 201);
  return { data: created };
});
