import { eq, and, ne, desc, sql } from 'drizzle-orm';
import { signalementsFrelon, votesFrelon } from '~~/server/database/schema';

/**
 * GET /api/frelon — carte COMMUNAUTAIRE (cross-tenant) des signalements de
 * frelons non rejetés. Auteur ANONYMISÉ (jamais exposé) ; on renvoie seulement
 * `estMien` (= signalement de l'utilisateur courant) et `monVote`.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const rows = await db
    .select({
      id: signalementsFrelon.id,
      latitude: signalementsFrelon.latitude,
      longitude: signalementsFrelon.longitude,
      espece: signalementsFrelon.espece,
      type: signalementsFrelon.type,
      pression: signalementsFrelon.pression,
      statut: signalementsFrelon.statut,
      dateObservation: signalementsFrelon.dateObservation,
      commune: signalementsFrelon.commune,
      hauteurM: signalementsFrelon.hauteurM,
      notes: signalementsFrelon.notes,
      confirmations: signalementsFrelon.confirmations,
      infirmations: signalementsFrelon.infirmations,
      destructions: signalementsFrelon.destructions,
      scoreFiabilite: signalementsFrelon.scoreFiabilite,
      estMien: sql<boolean>`${signalementsFrelon.auteurId} = ${user.id}`,
      monVote: votesFrelon.vote,
    })
    .from(signalementsFrelon)
    .leftJoin(
      votesFrelon,
      and(eq(votesFrelon.signalementId, signalementsFrelon.id), eq(votesFrelon.userId, user.id)),
    )
    .where(ne(signalementsFrelon.statut, 'rejete'))
    .orderBy(desc(signalementsFrelon.dateObservation))
    .limit(2000);

  return { data: rows };
});
