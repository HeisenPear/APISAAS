import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import {
  organisations,
  campagnesCommande,
  commandesGroupees,
  produitsCampagne,
} from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = z.string().uuid().parse(getRouterParam(event, 'id'));

  // Find user's organisation
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, user.id))
    .limit(1);

  if (!org) {
    notFound('Organisation introuvable');
  }

  // Fetch campagne + verify ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .where(and(eq(campagnesCommande.id, id), eq(campagnesCommande.organisationId, org.id)))
    .limit(1);

  if (!campagne) {
    notFound('Campagne introuvable');
  }

  // Fetch produits + stats in parallel
  const [produits, statsRows, statutRows] = await Promise.all([
    db
      .select()
      .from(produitsCampagne)
      .where(eq(produitsCampagne.campagneId, id))
      .orderBy(produitsCampagne.ordre),
    db
      .select({
        nombreCommandes: sql<number>`count(*)::int`,
        totalHt: sql<string>`COALESCE(sum(${commandesGroupees.totalHt}), 0)`,
        totalTtc: sql<string>`COALESCE(sum(${commandesGroupees.totalTtc}), 0)`,
      })
      .from(commandesGroupees)
      .where(eq(commandesGroupees.campagneId, id)),
    db
      .select({
        statut: commandesGroupees.statut,
        count: sql<number>`count(*)::int`,
      })
      .from(commandesGroupees)
      .where(eq(commandesGroupees.campagneId, id))
      .groupBy(commandesGroupees.statut),
  ]);

  const stats = statsRows[0] ?? { nombreCommandes: 0, totalHt: '0', totalTtc: '0' };
  const commandesParStatut = Object.fromEntries(statutRows.map((r) => [r.statut, r.count]));

  return {
    data: {
      ...campagne,
      produits,
      stats: {
        nombreCommandes: stats.nombreCommandes,
        totalHt: stats.totalHt,
        totalTtc: stats.totalTtc,
        commandesParStatut,
      },
    },
  };
});
