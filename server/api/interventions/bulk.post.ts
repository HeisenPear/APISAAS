import { eq, and } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';
import { bulkInterventionSchema } from '~~/server/utils/validation/interventions';
import { dispatchHandler } from '~~/server/services/interventions';
import type { HandlerResult } from '~~/server/types/interventions';

/**
 * POST /api/interventions/bulk
 * Orchestrateur Phase 2 — Transaction unique pour N catégories
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bulkInterventionSchema.parse);

  // Vérifier ownership de la ruche
  const rucheRows = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, user.id)))
    .limit(1);

  const ruche = rucheRows[0];
  if (!ruche) return badRequest('Ruche introuvable ou non autorisée');

  const categories = Object.keys(body.categories);

  // Transaction unique : hub visite parent → dispatch handlers → side-effects
  const result = await db.transaction(async (tx) => {
    // 1. Créer l'intervention hub (parent)
    const hubRows = await tx
      .insert(interventions)
      .values({
        userId: user.id,
        rucheId: body.rucheId,
        rucherId: ruche.rucherId,
        dateVisite: body.dateVisite ? new Date(body.dateVisite) : new Date(),
        type: categories.length === 1 ? categories[0] : 'multi',
        categoriesActivees: categories,
        meteo: body.meteo ?? null,
        notes: body.notes ?? null,
        photos: body.photos ?? [],
        dureeMinutes: body.dureeMinutes ?? null,
      })
      .returning();

    const hub = hubRows[0]!;

    // 2. Dispatcher chaque catégorie vers son handler
    const results: HandlerResult[] = [];

    for (const cat of categories) {
      const handlerResult = await dispatchHandler(tx, cat, {
        userId: user.id,
        inspectionId: hub.id,
        rucheId: body.rucheId,
        rucherId: ruche.rucherId,
        donnees: body.categories[cat] as Record<string, unknown>,
      });
      results.push(handlerResult);
    }

    return { hub, results };
  });

  setResponseStatus(event, 201);
  return {
    data: {
      id: result.hub.id,
      categoriesActivees: categories,
      dateVisite: result.hub.dateVisite,
      results: result.results,
    },
  };
});
