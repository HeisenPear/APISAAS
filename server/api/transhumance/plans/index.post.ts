import { z } from 'zod';
import { plansTranshumance, ruchers, emplacements } from '~~/server/database/schema';

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
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // Les FK rucher d'origine / emplacement de destination doivent appartenir à
  // l'espace (sinon référence cross-tenant).
  await assertFkBelongsToOwner(
    ownerId,
    ruchers,
    ruchers.id,
    ruchers.userId,
    body.rucherOrigineId,
    "Rucher d'origine",
  );
  await assertFkBelongsToOwner(
    ownerId,
    emplacements,
    emplacements.id,
    emplacements.userId,
    body.emplacementDestinationId,
    'Emplacement de destination',
  );

  const [row] = await db
    .insert(plansTranshumance)
    .values({
      ...body,
      datePrevue: new Date(body.datePrevue),
      dateRetourPrevue: body.dateRetourPrevue ? new Date(body.dateRetourPrevue) : null,
      coutCarburantEuros: body.coutCarburantEuros?.toString(),
      distanceKm: body.distanceKm?.toString(),
      userId: ownerId,
    })
    .returning();

  if (!row) internalError('Erreur création plan');
  setResponseStatus(event, 201);
  return { data: row };
});
