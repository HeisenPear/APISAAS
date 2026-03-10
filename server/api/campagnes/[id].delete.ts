import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = z.string().uuid().parse(getRouterParam(event, 'id'));

  // Verify ownership
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, user.id))
    .limit(1);

  if (!org) {
    notFound('Organisation introuvable');
  }

  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .where(and(eq(campagnesCommande.id, id), eq(campagnesCommande.organisationId, org.id)))
    .limit(1);

  if (!campagne) {
    notFound('Campagne introuvable');
  }

  if (campagne.statut !== 'brouillon') {
    badRequest('Seule une campagne en brouillon peut etre supprimee');
  }

  await db.delete(campagnesCommande).where(eq(campagnesCommande.id, id));

  return { data: { success: true } };
});
