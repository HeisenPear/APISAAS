import { desc, gte, sql } from 'drizzle-orm';
import { observationsFloraison, floraisonsReferentiel } from '~~/server/database/schema';

/**
 * GET /api/floraisons/observations — carte COMMUNAUTAIRE (cross-tenant) des
 * floraisons observées. Auteur ANONYMISÉ : on n'expose que `estMien`.
 *
 * Fenêtre glissante de 90 jours : une floraison signalée il y a 6 mois n'aide
 * personne, et ça borne la taille de la réponse sans pagination.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 90);

  const rows = await withDbRetry(
    () =>
      db
        .select({
          id: observationsFloraison.id,
          espece: observationsFloraison.espece,
          latitude: observationsFloraison.latitude,
          longitude: observationsFloraison.longitude,
          commune: observationsFloraison.commune,
          dateObservation: observationsFloraison.dateObservation,
          stade: observationsFloraison.stade,
          intensite: observationsFloraison.intensite,
          notes: observationsFloraison.notes,
          emoji: floraisonsReferentiel.emoji,
          typeMiel: floraisonsReferentiel.typeMiel,
          estMien: sql<boolean>`${observationsFloraison.auteurId} = ${user.id}`,
        })
        .from(observationsFloraison)
        .leftJoin(
          floraisonsReferentiel,
          sql`${observationsFloraison.floraisonId} = ${floraisonsReferentiel.id}`,
        )
        .where(gte(observationsFloraison.dateObservation, depuis))
        .orderBy(desc(observationsFloraison.dateObservation))
        .limit(2000),
    'floraisons/observations:list',
  );

  return { data: rows };
});
