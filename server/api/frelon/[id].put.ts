import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

const updateSchema = z.object({
  espece: z.enum(['asiatique', 'europeen', 'indetermine']).optional(),
  type: z.enum(['nid_primaire', 'nid_secondaire', 'individu', 'piege']).optional(),
  pression: z.enum(['faible', 'modere', 'fort', 'infestation']).optional(),
  // L'auteur peut acter la destruction ou rouvrir ; pas confirmer/rejeter (communauté).
  statut: z.enum(['a_verifier', 'detruit']).optional(),
  dateObservation: z.coerce.date().optional(),
  commune: z.string().max(120).nullish(),
  hauteurM: z.number().min(0).max(99).nullish(),
  notes: z.string().max(2000).nullish(),
  photoUrl: z.string().url().nullish(),
});

/** PUT /api/frelon/[id] — l'AUTEUR modifie son signalement (métadonnées, destruction). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateSchema.parse);

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.espece !== undefined) patch.espece = body.espece;
  if (body.type !== undefined) patch.type = body.type;
  if (body.pression !== undefined) patch.pression = body.pression;
  if (body.statut !== undefined) patch.statut = body.statut;
  if (body.dateObservation !== undefined) patch.dateObservation = body.dateObservation;
  if (body.commune !== undefined) patch.commune = body.commune;
  if (body.hauteurM !== undefined)
    patch.hauteurM = body.hauteurM != null ? String(body.hauteurM) : null;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.photoUrl !== undefined) patch.photoUrl = body.photoUrl;

  const [updated] = await db
    .update(signalementsFrelon)
    .set(patch)
    .where(and(eq(signalementsFrelon.id, id), eq(signalementsFrelon.auteurId, user.id)))
    .returning();

  if (!updated) return notFound('Signalement introuvable ou non modifiable');
  return { data: updated };
});
