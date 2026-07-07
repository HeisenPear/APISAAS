import { z } from 'zod';
import { sessionsGreffage } from '~~/server/database/schema';

const schema = z.object({
  dateGreffage: z.string().datetime(),
  reineMereId: z.string().uuid().nullable().optional(),
  rucheEleveuse: z.string().max(255).trim().optional(),
  nombreCellulesGreffees: z.coerce.number().int().min(1),
  nombreCellulesAcceptees: z.coerce.number().int().nullable().optional(),
  nombreCellulesNaissance: z.coerce.number().int().nullable().optional(),
  dateNaissancePrevue: z.string().datetime().nullable().optional(),
  dateMiseNucleiPrevue: z.string().datetime().nullable().optional(),
  technique: z.enum(['doolittle', 'cupule_artificielle', 'transfert']).optional(),
  notes: z.string().max(2000).trim().optional(),
  estTerminee: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .insert(sessionsGreffage)
    .values({
      ...body,
      dateGreffage: new Date(body.dateGreffage),
      dateNaissancePrevue: body.dateNaissancePrevue ? new Date(body.dateNaissancePrevue) : null,
      dateMiseNucleiPrevue: body.dateMiseNucleiPrevue ? new Date(body.dateMiseNucleiPrevue) : null,
      userId: ownerId,
    })
    .returning();

  if (!row) internalError('Erreur création session');
  setResponseStatus(event, 201);
  return { data: row };
});
