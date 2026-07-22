import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { historiqueCire, ruches } from '~~/server/database/schema';

const schema = z.object({
  dateRenouvellement: z.string().datetime(),
  nombreCadresRenouveles: z.coerce.number().int().min(1).optional(),
  notes: z.string().max(1000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const rucheId = getRouterParam(event, 'id');
  if (!rucheId) return badRequest('ID manquant');
  uuidSchema.parse(rucheId);
  const body = await readValidatedBody(event, schema.parse);

  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, rucheId), eq(ruches.userId, ownerId)))
    .limit(1);
  if (!ruche) return notFound('Ruche introuvable');

  const [created] = await db
    .insert(historiqueCire)
    .values({
      userId: ownerId,
      rucheId,
      dateRenouvellement: new Date(body.dateRenouvellement),
      nombreCadresRenouveles: body.nombreCadresRenouveles ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
