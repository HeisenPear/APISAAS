import { z } from 'zod';
import { plansTranshumance } from '~~/server/database/schema';

const schema = z.object({
  annee: z.coerce.number().int().min(2000).max(2100),
  rucherOrigineId: z.string().uuid().nullable().optional(),
  emplacementDestinationId: z.string().uuid().nullable().optional(),
  datePrevue: z.string().datetime(),
  dateRetourPrevue: z.string().datetime().nullable().optional(),
  miellee: z.string().max(255).trim().optional(),
  nombreRuchesPrevues: z.coerce.number().int().min(1),
  coutCarburantEuros: z.coerce.number().min(0).optional(),
  dureeMinutes: z.coerce.number().int().min(0).optional(),
  distanceKm: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).trim().optional(),
  statut: z.enum(['planifie', 'en_cours', 'realise', 'annule']).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .insert(plansTranshumance)
    .values({
      ...body,
      datePrevue: new Date(body.datePrevue),
      dateRetourPrevue: body.dateRetourPrevue ? new Date(body.dateRetourPrevue) : null,
      coutCarburantEuros: body.coutCarburantEuros?.toString(),
      distanceKm: body.distanceKm?.toString(),
      userId: user.id,
    })
    .returning();

  if (!row) internalError('Erreur création plan');
  setResponseStatus(event, 201);
  return { data: row };
});
