import { eq, and } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';
import { createInterventionSchema } from '~~/server/utils/validation/interventions';
import { useServerPostHog } from '~~/server/utils/posthog';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, createInterventionSchema.parse);

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) return badRequest('Ruche introuvable ou non autorisee');

  const [created] = await db
    .insert(interventions)
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

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'intervention_created',
    properties: {
      $session_id: sessionId,
      type: body.type,
    },
  });

  setResponseStatus(event, 201);
  return { data: created };
});
