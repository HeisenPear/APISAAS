import { eq, and } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';
import { bulkInterventionSchema } from '~~/server/utils/validation/interventions';
import { dispatchHandler } from '~~/server/services/interventions';
import { isAdminEmail } from '~~/app/config/admin';
import type { Plan } from '~~/app/config/plans';
import type { HandlerResult } from '~~/server/types/interventions';

/**
 * POST /api/interventions/bulk
 * Orchestrateur Phase 2 — Transaction unique pour N catégories
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);

  // Le handler `division` crée des ruches et les handlers `recolte`/`reine`
  // écrivent dans des tables dont la route DIRECTE est gatée : il leur faut le
  // plan. Cette route n'a AUCUN gate dans ROUTE_GATES — c'est précisément ce
  // qui en faisait un contournement. Admin → 'expert'.
  const plan: Plan = isAdminEmail(user.email) ? 'expert' : await planDuProprietaire(ownerId);

  const rawBody = await readBody(event);
  const parsed = bulkInterventionSchema.safeParse(rawBody);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[bulk.post] Validation failed:', JSON.stringify(parsed.error.issues, null, 2));
      console.error('[bulk.post] Raw body:', JSON.stringify(rawBody, null, 2));
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      message: parsed.error.message,
    });
  }
  const body = parsed.data;

  // Vérifier ownership de la ruche
  const rucheRows = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, ownerId)))
    .limit(1);

  const ruche = rucheRows[0];
  if (!ruche) return badRequest('Ruche introuvable ou non autorisée');

  const categories = Object.keys(body.categories);

  // Date de MESURE de la visite : sert au hub ET aux handlers (ex. pesée, qui
  // cherche la dernière pesée ANTÉRIEURE par date de visite). Doit être passée
  // au contexte du handler, sinon celui-ci retombe sur `new Date()` et fausse
  // le calcul de variation sur une saisie rétroactive.
  const dateVisite = body.dateVisite ? new Date(body.dateVisite) : new Date();

  // Transaction unique : hub visite parent → dispatch handlers → side-effects
  const result = await db.transaction(async (tx) => {
    // 1. Créer l'intervention hub (parent)
    const hubRows = await tx
      .insert(interventions)
      .values({
        userId: ownerId,
        rucheId: body.rucheId,
        rucherId: ruche.rucherId,
        dateVisite,
        type: categories.length === 1 ? categories[0] : 'multi',
        categoriesActivees: categories,
        meteo: body.meteo ?? null,
        notes: body.notes ?? null,
        photos: body.photos ?? [],
        dureeMinutes: body.dureeMinutes ?? null,
        // Stocker les données pour affichage dans le détail d'intervention
        donnees:
          categories.length === 1
            ? ((body.categories[categories[0]!] ?? null) as Record<string, unknown> | null)
            : (body.categories as Record<string, unknown>),
      })
      .returning();

    const hub = hubRows[0]!;

    // 2. Dispatcher chaque catégorie vers son handler
    const results: HandlerResult[] = [];

    for (const cat of categories) {
      const handlerResult = await dispatchHandler(tx, cat, {
        userId: ownerId,
        inspectionId: hub.id,
        rucheId: body.rucheId,
        rucherId: ruche.rucherId,
        donnees: body.categories[cat] as Record<string, unknown>,
        dateVisite: dateVisite.toISOString(),
        plan,
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
