import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { interventions, ruchers, ruches } from '~~/server/database/schema';

const exceptionSchema = z.object({
  rucheId: z.string().uuid(),
  types: z.array(z.string()).min(1),
  notes: z.string().max(2000).optional(),
});

const visiteRucherSchema = z.object({
  rucherId: z.string().uuid(),
  date: z.string().datetime({ offset: true }).optional(),
  temperature: z.coerce.number().min(-20).max(50).optional(),
  forceGenerale: z.coerce.number().int().min(1).max(5).optional(),
  reservesGenerales: z.coerce.number().int().min(1).max(5).optional(),
  couvainGeneral: z.coerce.number().int().min(1).max(5).optional(),
  comportement: z.coerce.number().int().min(1).max(5).optional(),
  actions: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
  exceptions: z.array(exceptionSchema).default([]),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, visiteRucherSchema.parse);

  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, ownerId)))
    .limit(1);

  if (!rucher) throw createError({ statusCode: 404, message: 'Rucher introuvable' });

  const dateVisite = body.date ? new Date(body.date) : new Date();

  const [intervention] = await db
    .insert(interventions)
    .values({
      userId: ownerId,
      rucherId: body.rucherId,
      rucheId: null,
      dateVisite,
      type: 'visite_rucher',
      meteo: body.temperature !== undefined ? { temperature: body.temperature } : null,
      donnees: {
        niveau: 'rucher',
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

  if (body.exceptions.length > 0) {
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
