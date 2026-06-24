import { eq, and, inArray } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';
import { z } from 'zod';
import { dispatchHandler } from '~~/server/services/interventions';
import { meteoSchema } from '~~/server/utils/validation/interventions';
import type { HandlerResult } from '~~/server/types/interventions';

/**
 * POST /api/interventions/bulk-group
 * Phase 3 — Appliquer la même intervention sur plusieurs ruches simultanément.
 * Chaque ruche reçoit sa propre intervention hub dans une transaction unique.
 * Limité à 20 ruches par appel.
 */

const bulkGroupSchema = z.object({
  rucheIds: z.array(z.string().uuid()).min(1).max(20),
  dateVisite: z.string().datetime({ offset: true }).optional(),
  categories: z.record(z.unknown()).refine((v) => Object.keys(v).length > 0, {
    message: 'Au moins une catégorie requise',
  }),
  meteo: meteoSchema,
  notes: z.string().max(2000).optional(),
  photos: z
    .array(
      z.object({
        url: z.string(),
        path: z.string(),
        name: z.string(),
        size: z.number(),
        uploadedAt: z.string(),
        caption: z.string().optional(),
      }),
    )
    .max(10)
    .optional(),
  dureeMinutes: z.number().int().positive().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, bulkGroupSchema.parse);

  // Vérifier ownership de toutes les ruches
  const ownedRuches = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(inArray(ruches.id, body.rucheIds), eq(ruches.userId, ownerId)));

  if (ownedRuches.length !== body.rucheIds.length) {
    return badRequest('Une ou plusieurs ruches sont introuvables ou non autorisées');
  }

  const categories = Object.keys(body.categories);
  const dateVisite = body.dateVisite ? new Date(body.dateVisite) : new Date();

  // Transaction unique — une intervention par ruche
  const allResults = await db.transaction(async (tx) => {
    const ruche_results: Array<{
      rucheId: string;
      interventionId: string;
      results: HandlerResult[];
    }> = [];

    for (const ruche of ownedRuches) {
      const hubRows = await tx
        .insert(interventions)
        .values({
          userId: ownerId,
          rucheId: ruche.id,
          rucherId: ruche.rucherId,
          dateVisite,
          type: categories.length === 1 ? categories[0] : 'multi',
          categoriesActivees: categories,
          meteo: body.meteo ?? null,
          notes: body.notes ?? null,
          photos: body.photos ?? [],
          dureeMinutes: body.dureeMinutes ?? null,
        })
        .returning();

      const hub = hubRows[0]!;
      const handlerResults: HandlerResult[] = [];

      for (const cat of categories) {
        const res = await dispatchHandler(tx, cat, {
          userId: ownerId,
          inspectionId: hub.id,
          rucheId: ruche.id,
          rucherId: ruche.rucherId,
          donnees: body.categories[cat] as Record<string, unknown>,
          dateVisite: dateVisite.toISOString(),
        });
        handlerResults.push(res);
      }

      ruche_results.push({
        rucheId: ruche.id,
        interventionId: hub.id,
        results: handlerResults,
      });
    }

    return ruche_results;
  });

  setResponseStatus(event, 201);
  return {
    data: {
      totalRuches: allResults.length,
      categories,
      dateVisite: dateVisite.toISOString(),
      ruches: allResults.map((r) => ({ rucheId: r.rucheId, interventionId: r.interventionId })),
    },
  };
});
