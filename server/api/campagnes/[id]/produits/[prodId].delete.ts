import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande, produitsCampagne } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const prodId = z.string().uuid().parse(getRouterParam(event, 'prodId'));

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, ownerId)));

  if (!campagne) throw notFound('Campagne introuvable');

  const [deleted] = await db
    .delete(produitsCampagne)
    .where(and(eq(produitsCampagne.id, prodId), eq(produitsCampagne.campagneId, campagneId)))
    .returning({ id: produitsCampagne.id });

  if (!deleted) throw notFound('Produit introuvable');

  return { data: { id: deleted.id } };
});
