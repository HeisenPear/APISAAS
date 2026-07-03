import { z } from 'zod';
import { reinesElevage, lignees, ruches } from '~~/server/database/schema';

const schema = z.object({
  rucheId: z.string().uuid().nullable().optional(),
  ligneeId: z.string().uuid().nullable().optional(),
  reineMereId: z.string().uuid().nullable().optional(),
  identifiant: z.string().max(100).trim().optional(),
  couleurMarquage: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).optional(),
  anneeNaissance: z.coerce.number().int().min(1990).max(2100).optional(),
  dateIntroduction: z.string().datetime().nullable().optional(),
  origine: z.enum(['elevage_propre', 'achat', 'capture_essaim']).optional(),
  fournisseur: z.string().max(255).trim().nullable().optional(),
  estInsemine: z.boolean().optional(),
  stationFecondation: z.string().max(255).trim().nullable().optional(),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // Les FK client (ruche, lignée, reine mère) doivent appartenir à l'espace,
  // sinon on lie une reine à la donnée génétique d'un autre locataire.
  await assertFkBelongsToOwner(ownerId, ruches, ruches.id, ruches.userId, body.rucheId, 'Ruche');
  await assertFkBelongsToOwner(
    ownerId,
    lignees,
    lignees.id,
    lignees.userId,
    body.ligneeId,
    'Lignée',
  );
  await assertFkBelongsToOwner(
    ownerId,
    reinesElevage,
    reinesElevage.id,
    reinesElevage.userId,
    body.reineMereId,
    'Reine mère',
  );

  const [row] = await db
    .insert(reinesElevage)
    .values({
      ...body,
      dateIntroduction: body.dateIntroduction ? new Date(body.dateIntroduction) : null,
      userId: ownerId,
    })
    .returning();

  if (!row) internalError('Erreur création reine');
  setResponseStatus(event, 201);
  return { data: row };
});
