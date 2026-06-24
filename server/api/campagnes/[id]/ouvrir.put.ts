import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { organisations, campagnesCommande, produitsCampagne } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = z.string().uuid().parse(getRouterParam(event, 'id'));

  // Verify ownership
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, ownerId))
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
    badRequest('Seule une campagne en brouillon peut etre ouverte');
  }

  // Verify at least 1 product exists
  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(produitsCampagne)
    .where(eq(produitsCampagne.campagneId, id));

  if (!productCount || productCount.count === 0) {
    badRequest("La campagne doit avoir au moins un produit avant d'etre ouverte");
  }

  const [updated] = await db
    .update(campagnesCommande)
    .set({ statut: 'ouverte', updatedAt: new Date() })
    .where(eq(campagnesCommande.id, id))
    .returning();

  return { data: updated };
});
