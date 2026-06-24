import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sessionsGreffage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  dateGreffage: z.string().datetime().optional(),
  reineMereId: z.string().uuid().nullable().optional(),
  rucheEleveuse: z.string().max(255).trim().nullable().optional(),
  nombreCellulesGreffees: z.coerce.number().int().min(1).optional(),
  nombreCellulesAcceptees: z.coerce.number().int().nullable().optional(),
  nombreCellulesNaissance: z.coerce.number().int().nullable().optional(),
  dateNaissancePrevue: z.string().datetime().nullable().optional(),
  dateMiseNucleiPrevue: z.string().datetime().nullable().optional(),
  technique: z.enum(['doolittle', 'cupule_artificielle', 'transfert']).nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
  estTerminee: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, schema.parse);

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.dateGreffage) updates.dateGreffage = new Date(body.dateGreffage);
  if (body.dateNaissancePrevue !== undefined)
    updates.dateNaissancePrevue = body.dateNaissancePrevue
      ? new Date(body.dateNaissancePrevue)
      : null;
  if (body.dateMiseNucleiPrevue !== undefined)
    updates.dateMiseNucleiPrevue = body.dateMiseNucleiPrevue
      ? new Date(body.dateMiseNucleiPrevue)
      : null;

  const [row] = await db
    .update(sessionsGreffage)
    .set(updates)
    .where(and(eq(sessionsGreffage.id, id!), eq(sessionsGreffage.userId, ownerId)))
    .returning();
  if (!row) notFound('Session introuvable');
  return { data: row };
});
