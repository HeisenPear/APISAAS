import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { plansTranshumance } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  annee: z.coerce.number().int().min(2000).max(2100).optional(),
  rucherOrigineId: z.string().uuid().nullable().optional(),
  emplacementDestinationId: z.string().uuid().nullable().optional(),
  datePrevue: z.string().datetime().optional(),
  dateRetourPrevue: z.string().datetime().nullable().optional(),
  dateRealisee: z.string().datetime().nullable().optional(),
  miellee: z.string().max(255).trim().nullable().optional(),
  nombreRuchesPrevues: z.coerce.number().int().min(1).optional(),
  nombreRuchesRealisees: z.coerce.number().int().nullable().optional(),
  coutCarburantEuros: z.coerce.number().min(0).nullable().optional(),
  dureeMinutes: z.coerce.number().int().min(0).nullable().optional(),
  distanceKm: z.coerce.number().min(0).nullable().optional(),
  productionKg: z.coerce.number().min(0).nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
  statut: z.enum(['planifie', 'en_cours', 'realise', 'annule']).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, schema.parse);

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.datePrevue) updates.datePrevue = new Date(body.datePrevue);
  if (body.dateRetourPrevue !== undefined) updates.dateRetourPrevue = body.dateRetourPrevue ? new Date(body.dateRetourPrevue) : null;
  if (body.dateRealisee !== undefined) updates.dateRealisee = body.dateRealisee ? new Date(body.dateRealisee) : null;
  if (body.coutCarburantEuros !== undefined) updates.coutCarburantEuros = body.coutCarburantEuros?.toString() ?? null;
  if (body.distanceKm !== undefined) updates.distanceKm = body.distanceKm?.toString() ?? null;
  if (body.productionKg !== undefined) updates.productionKg = body.productionKg?.toString() ?? null;

  const [row] = await db.update(plansTranshumance).set(updates)
    .where(and(eq(plansTranshumance.id, id!), eq(plansTranshumance.userId, user.id))).returning();
  if (!row) notFound('Plan introuvable');
  return { data: row };
});
