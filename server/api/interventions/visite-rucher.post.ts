import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminEmail } from '~~/app/config/admin';
import { hasFeature, minimumPlanFor, getPlanConfig, type Plan } from '~~/app/config/plans';
import { interventions, ruchers, ruches, emplacements } from '~~/server/database/schema';

const exceptionSchema = z.object({
  rucheId: z.string().uuid(),
  types: z.array(z.string()).min(1),
  notes: z.string().max(2000).optional(),
});

const visiteRucherSchema = z
  .object({
    rucherId: z.string().uuid().optional(),
    // Visite d'un emplacement de transhumance (exclusif de rucherId)
    emplacementId: z.string().uuid().optional(),
    date: z.string().datetime({ offset: true }).optional(),
    temperature: z.coerce.number().min(-20).max(50).optional(),
    forceGenerale: z.coerce.number().int().min(1).max(5).optional(),
    reservesGenerales: z.coerce.number().int().min(1).max(5).optional(),
    couvainGeneral: z.coerce.number().int().min(1).max(5).optional(),
    comportement: z.coerce.number().int().min(1).max(5).optional(),
    actions: z.array(z.string()).default([]),
    notes: z.string().max(5000).optional(),
    exceptions: z.array(exceptionSchema).default([]),
  })
  .refine((b) => (b.rucherId ? 1 : 0) + (b.emplacementId ? 1 : 0) === 1, {
    message: 'rucherId ou emplacementId requis (exclusifs)',
  })
  .refine((b) => !b.emplacementId || b.exceptions.length === 0, {
    message: "Les exceptions par ruche ne s'appliquent qu'à une visite de rucher",
  });

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, visiteRucherSchema.parse);

  if (body.rucherId) {
    const [rucher] = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, ownerId)))
      .limit(1);
    if (!rucher) throw createError({ statusCode: 404, message: 'Rucher introuvable' });
  } else if (body.emplacementId) {
    // Gating dépendant du body (impossible via ROUTE_GATES statique) : le suivi
    // d'emplacement fait partie de la feature 'transhumance', comme ses écritures.
    const plan: Plan = isAdminEmail(user.email) ? 'expert' : await planDuProprietaire(ownerId);
    if (!hasFeature(plan, 'transhumance')) {
      const requiredPlan = minimumPlanFor('transhumance');
      throw createError({
        statusCode: 402,
        statusMessage: 'Plan insuffisant',
        data: {
          code: 'PLAN_REQUIRED',
          feature: 'transhumance',
          currentPlan: plan,
          requiredPlan,
          message: `Cette fonctionnalité nécessite le plan ${getPlanConfig(requiredPlan).label}`,
        },
      });
    }
    const [emplacement] = await db
      .select({ id: emplacements.id })
      .from(emplacements)
      .where(and(eq(emplacements.id, body.emplacementId), eq(emplacements.userId, ownerId)))
      .limit(1);
    if (!emplacement) throw createError({ statusCode: 404, message: 'Emplacement introuvable' });
  }

  const dateVisite = body.date ? new Date(body.date) : new Date();
  const estEmplacement = !!body.emplacementId;

  const [intervention] = await db
    .insert(interventions)
    .values({
      userId: ownerId,
      rucherId: body.rucherId ?? null,
      emplacementId: body.emplacementId ?? null,
      rucheId: null,
      dateVisite,
      type: estEmplacement ? 'visite_emplacement' : 'visite_rucher',
      meteo: body.temperature !== undefined ? { temperature: body.temperature } : null,
      donnees: {
        niveau: estEmplacement ? 'emplacement' : 'rucher',
        forceGenerale: body.forceGenerale,
        reservesGenerales: body.reservesGenerales,
        couvainGeneral: body.couvainGeneral,
        comportement: body.comportement,
        actions: body.actions,
        nbExceptions: body.exceptions.length,
      },
      notes: body.notes ?? null,
      photos: [],
    })
    .returning();

  if (!intervention) throw createError({ statusCode: 500, message: 'Erreur lors de la création' });

  if (body.rucherId && body.exceptions.length > 0) {
    // Chaque ruche d'exception doit appartenir à CE rucher et à l'espace.
    const rucheIds = [...new Set(body.exceptions.map((e) => e.rucheId))];
    const valides = await db
      .select({ id: ruches.id })
      .from(ruches)
      .where(
        and(
          eq(ruches.rucherId, body.rucherId),
          eq(ruches.userId, ownerId),
          inArray(ruches.id, rucheIds),
        ),
      );
    if (valides.length !== rucheIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Référence invalide',
        message: "Une ruche d'exception n'appartient pas à ce rucher.",
      });
    }

    await db.insert(interventions).values(
      body.exceptions.map((exc) => ({
        userId: ownerId,
        rucherId: body.rucherId,
        rucheId: exc.rucheId,
        dateVisite,
        type: 'exception_visite',
        donnees: {
          niveau: 'exception',
          parentVisiteRucherId: intervention.id,
          exceptionTypes: exc.types,
        },
        notes: exc.notes ?? null,
        meteo: body.temperature !== undefined ? { temperature: body.temperature } : null,
        photos: [],
      })),
    );
  }

  setResponseStatus(event, 201);
  return { data: intervention };
});
