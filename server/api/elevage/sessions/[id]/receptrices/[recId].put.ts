import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { receptricesGreffage, reinesElevage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  identifiantReceptrice: z.string().min(1).max(100).trim().optional(),
  celluleAcceptee: z.boolean().nullable().optional(),
  reineNeeId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const sessionId = getRouterParam(event, 'id');
  const recId = getRouterParam(event, 'recId');
  if (!sessionId || !recId) badRequest('ID manquant');
  uuidSchema.parse(sessionId);
  uuidSchema.parse(recId);
  const body = await readValidatedBody(event, schema.parse);

  await assertFkBelongsToOwner(
    ownerId,
    reinesElevage,
    reinesElevage.id,
    reinesElevage.userId,
    body.reineNeeId,
    'Reine née',
  );

  const [row] = await db
    .update(receptricesGreffage)
    .set({ ...body, updatedAt: new Date() })
    .where(
      and(
        eq(receptricesGreffage.id, recId!),
        eq(receptricesGreffage.sessionId, sessionId!),
        eq(receptricesGreffage.userId, ownerId),
      ),
    )
    .returning();
  if (!row) notFound('Récepteur introuvable');
  return { data: row };
});
