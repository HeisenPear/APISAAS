import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande } from '~~/server/database/schema';

const updateCampagneSchema = z.object({
  nom: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  dateOuverture: z.string().datetime().optional(),
  dateFermeture: z.string().datetime().optional(),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = z.string().uuid().parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, updateCampagneSchema.parse);

  // Verify ownership via organisation
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, user.id))
    .limit(1);

  if (!org) {
    notFound('Organisation introuvable');
  }

  // Check campagne exists and belongs to org
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .where(and(eq(campagnesCommande.id, id), eq(campagnesCommande.organisationId, org.id)))
    .limit(1);

  if (!campagne) {
    notFound('Campagne introuvable');
  }

  // Can only modify if brouillon or ouverte
  if (campagne.statut !== 'brouillon' && campagne.statut !== 'ouverte') {
    badRequest('La campagne ne peut etre modifiee que si elle est en brouillon ou ouverte');
  }

  const updates: Record<string, unknown> = {
    ...body,
    updatedAt: new Date(),
  };
  if (body.dateOuverture) updates.dateOuverture = new Date(body.dateOuverture);
  if (body.dateFermeture) updates.dateFermeture = new Date(body.dateFermeture);

  const [updated] = await db
    .update(campagnesCommande)
    .set(updates)
    .where(eq(campagnesCommande.id, id))
    .returning();

  return { data: updated };
});
