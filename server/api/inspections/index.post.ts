import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { inspections, ruches } from '~~/server/database/schema';

const createInspectionSchema = z.object({
  rucheId: z.string().uuid('rucheId invalide'),
  dateVisite: z.coerce.date(),
  type: z.string().min(1).max(100).trim().optional(),
  meteo: z
    .object({
      temperature: z.number().optional(),
      vent: z.string().optional(),
      ciel: z.string().optional(),
    })
    .optional(),

  // Etat colonie
  forceColonie: z.number().int().min(1).max(5).optional(),
  couvain: z.number().int().min(0).max(5).optional(),
  reserves: z.number().int().min(1).max(5).optional(),
  comportement: z.string().max(100).trim().optional(),
  reineVue: z.boolean().optional(),
  celluleRoyale: z.boolean().optional(),
  signeEssaimage: z.boolean().optional(),

  // Sanitaire
  varroa: z.number().int().min(0).optional(),
  traitementApplique: z.string().max(500).trim().optional(),
  maladieObservee: z.string().max(500).trim().optional(),

  // Actions
  actionsRealisees: z.array(z.string()).optional(),
  nourrissementType: z.string().max(200).trim().optional(),
  nourrissementQuantite: z.coerce.number().min(0).optional(),

  // Notes & photos
  notes: z.string().max(5000).trim().optional(),
  photos: z.array(z.string().url()).optional(),
  dureeMinutes: z.number().int().min(0).optional(),

  // Offline
  offlineId: z.string().max(100).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createInspectionSchema.parse);

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) badRequest('Ruche introuvable ou non autorisee');

  const [created] = await db
    .insert(inspections)
    .values({
      userId: user.id,
      rucheId: body.rucheId,
      dateVisite: body.dateVisite,
      type: body.type ?? null,
      meteo: body.meteo ?? null,
      forceColonie: body.forceColonie ?? null,
      couvain: body.couvain ?? null,
      reserves: body.reserves ?? null,
      comportement: body.comportement ?? null,
      reineVue: body.reineVue ?? null,
      celluleRoyale: body.celluleRoyale ?? null,
      signeEssaimage: body.signeEssaimage ?? null,
      varroa: body.varroa ?? null,
      traitementApplique: body.traitementApplique ?? null,
      maladieObservee: body.maladieObservee ?? null,
      actionsRealisees: body.actionsRealisees ?? null,
      nourrissementType: body.nourrissementType ?? null,
      nourrissementQuantite: body.nourrissementQuantite?.toString() ?? null,
      notes: body.notes ?? null,
      photos: body.photos ?? [],
      dureeMinutes: body.dureeMinutes ?? null,
      offlineId: body.offlineId ?? null,
    })
    .returning();

  if (!created) internalError('Erreur lors de la creation');

  setResponseStatus(event, 201);
  return { data: created };
});
