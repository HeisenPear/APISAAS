import { eq, and } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import { updateInterventionSchema } from '~~/server/utils/validation/interventions';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateInterventionSchema.parse);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.date !== undefined) updateData.dateVisite = body.date;
  if (body.dureeMinutes !== undefined) updateData.dureeMinutes = body.dureeMinutes;
  if (body.meteo !== undefined) updateData.meteo = body.meteo;
  if (body.donnees !== undefined) updateData.donnees = body.donnees;
  if (body.commentaire !== undefined) updateData.notes = body.commentaire;
  if (body.photos !== undefined) updateData.photos = body.photos;

  const [updated] = await db
    .update(interventions)
    .set(updateData)
    .where(and(eq(interventions.id, id), eq(interventions.userId, user.id)))
    .returning();

  if (!updated) return notFound('Intervention introuvable');

  return { data: updated };
});
