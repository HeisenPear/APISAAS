import { z } from 'zod';
import { signalementsFrelon } from '~~/server/database/schema';

const bodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  espece: z.enum(['asiatique', 'europeen', 'indetermine']).default('asiatique'),
  type: z.enum(['nid_primaire', 'nid_secondaire', 'individu', 'piege']).default('nid_secondaire'),
  statut: z.enum(['signale', 'confirme', 'detruit']).default('signale'),
  dateObservation: z.coerce.date(),
  commune: z.string().max(120).nullish(),
  hauteurM: z.number().min(0).max(99).nullish(),
  notes: z.string().max(2000).nullish(),
  photoUrl: z.string().url().nullish(),
});

/** POST /api/frelon — enregistre un signalement (scopé à l'espace). */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const [created] = await db
    .insert(signalementsFrelon)
    .values({
      userId: ownerId,
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      espece: body.espece,
      type: body.type,
      statut: body.statut,
      dateObservation: body.dateObservation,
      commune: body.commune ?? null,
      hauteurM: body.hauteurM != null ? String(body.hauteurM) : null,
      notes: body.notes ?? null,
      photoUrl: body.photoUrl ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
