import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

const updateSchema = z.object({
  espece: z.enum(['asiatique', 'europeen', 'indetermine']).optional(),
  type: z.enum(['nid_primaire', 'nid_secondaire', 'individu', 'piege']).optional(),
  statut: z.enum(['signale', 'confirme', 'detruit']).optional(),
  dateObservation: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  commune: z.string().max(120).nullish(),
  hauteurM: z.number().min(0).max(99).nullish(),
  notes: z.string().max(2000).nullish(),
  photoUrl: z.string().url().nullish(),
});

/** PUT /api/frelon/[id] — met à jour un signalement (ex. passage à « détruit »). */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateSchema.parse);

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.espece !== undefined) patch.espece = body.espece;
  if (body.type !== undefined) patch.type = body.type;
  if (body.statut !== undefined) patch.statut = body.statut;
  if (body.dateObservation !== undefined) patch.dateObservation = body.dateObservation;
  if (body.latitude !== undefined) patch.latitude = String(body.latitude);
  if (body.longitude !== undefined) patch.longitude = String(body.longitude);
  if (body.commune !== undefined) patch.commune = body.commune;
  if (body.hauteurM !== undefined)
    patch.hauteurM = body.hauteurM != null ? String(body.hauteurM) : null;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.photoUrl !== undefined) patch.photoUrl = body.photoUrl;

  const [updated] = await db
    .update(signalementsFrelon)
    .set(patch)
    .where(and(eq(signalementsFrelon.id, id), eq(signalementsFrelon.userId, ownerId)))
    .returning();

  if (!updated) return notFound('Signalement introuvable');
  return { data: updated };
});
