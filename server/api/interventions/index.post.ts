import { eq, and } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';
import { createInterventionSchema } from '~~/server/utils/validation/interventions';
import { useServerPostHog } from '~~/server/utils/posthog';
import { dispatchHandler, handlerMap } from '~~/server/services/interventions';
import { isAdminEmail } from '~~/app/config/admin';
import type { Plan } from '~~/app/config/plans';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, createInterventionSchema.parse);

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, ownerId)))
    .limit(1);

  if (!ruche) return badRequest('Ruche introuvable ou non autorisee');

  // Le PLAN, comme sur `/bulk` : les handlers `recolte` et `reine` écrivent
  // dans des tables dont la route directe est gatée. Admin → 'expert'.
  const plan: Plan = isAdminEmail(user.email) ? 'expert' : await planDuProprietaire(ownerId);

  const [created] = await db.transaction(async (tx) => {
    const [ligne] = await tx
      .insert(interventions)
      .values({
        userId: ownerId,
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

    // ═══════════════════════════════════════════════════════════════════════
    // LA MÊME PORTE QUE `/bulk` ET QUE MAYA.
    //
    // Cette route insérait le hub et RIEN d'autre : `donnees` en camelCase,
    // colonnes plates nulles, aucun handler exécuté. C'est la racine du défaut
    // corrigé côté Maya — sauf qu'ici elle est vivante, appelée par le modal
    // rapide du calendrier, les visites d'emplacement et la synchro hors-ligne.
    //
    // Deux conséquences, refermées ensemble :
    //  - le score de santé, les KPI et les alertes ne voyaient pas ces visites ;
    //  - une intervention de type `recolte` ou `reine` contournait les gates de
    //    plan (`production`, `moduleReine`) que la route directe applique.
    //
    // Le dispatch vit DANS la transaction : si un handler échoue ou refuse pour
    // raison de plan, le hub n'est pas écrit non plus.
    // ═══════════════════════════════════════════════════════════════════════
    if (ligne && handlerMap[body.type]) {
      await dispatchHandler(tx, body.type, {
        userId: ownerId,
        inspectionId: ligne.id,
        rucheId: body.rucheId,
        rucherId: body.rucherId ?? ruche.rucherId,
        donnees: body.donnees,
        dateVisite: (body.date ?? new Date()).toISOString(),
        plan,
      });
    }

    return [ligne];
  });

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
