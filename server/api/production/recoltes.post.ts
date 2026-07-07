import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { recoltes, ruchers, ruches } from '~~/server/database/schema';
import { useServerPostHog } from '~~/server/utils/posthog';

const createRecolteSchema = z.object({
  rucherId: z.string().uuid('rucherId invalide').optional(),
  rucheId: z.string().uuid('rucheId invalide').optional(),
  dateRecolte: z.coerce.date(),
  typeMiel: z.string().min(1).max(200).trim().optional(),
  quantiteKg: z.coerce.number().min(0).optional(),
  humidite: z.coerce.number().min(0).max(100).optional(),
  nombreHausses: z.number().int().min(0).optional(),
  numeroLot: z.string().max(100).trim().optional(),
  notes: z.string().max(5000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, createRecolteSchema.parse);

  // Verify rucher ownership if provided
  if (body.rucherId) {
    const [rucher] = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, ownerId)))
      .limit(1);
    if (!rucher) badRequest('Rucher introuvable ou non autorise');
  }

  // Verify ruche ownership if provided
  if (body.rucheId) {
    const [ruche] = await db
      .select({ id: ruches.id })
      .from(ruches)
      .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, ownerId)))
      .limit(1);
    if (!ruche) badRequest('Ruche introuvable ou non autorisee');
  }

  const [created] = await db
    .insert(recoltes)
    .values({
      userId: ownerId,
      rucherId: body.rucherId ?? null,
      rucheId: body.rucheId ?? null,
      dateRecolte: body.dateRecolte,
      typeMiel: body.typeMiel ?? null,
      quantiteKg: body.quantiteKg?.toString() ?? null,
      humidite: body.humidite?.toString() ?? null,
      nombreHausses: body.nombreHausses ?? null,
      numeroLot: body.numeroLot ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  if (!created) internalError('Erreur lors de la creation');

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'harvest_recorded',
    properties: {
      $session_id: sessionId,
      type_miel: body.typeMiel,
      quantite_kg: body.quantiteKg,
    },
  });

  setResponseStatus(event, 201);
  return { data: created };
});
