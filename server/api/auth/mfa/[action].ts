import enroll from '~~/server/mfa/enroll';
import factors from '~~/server/mfa/factors';
import supprimer from '~~/server/mfa/supprimer';
import verify from '~~/server/mfa/verify';

/**
 * AIGUILLEUR MFA — `/api/auth/mfa/:action`.
 *
 * Les 4 opérations (lister, enrôler, vérifier, supprimer) vivaient chacune dans
 * son fichier de route. Les URLs n'ont PAS changé : seule l'inscription auprès
 * de Nitro est mutualisée.
 *
 * POURQUOI. Nitro type une entrée par route dans `InternalApi` ; passé ~215
 * entrées, `useFetch` cesse d'appliquer ses génériques et renvoie `any`
 * (cf. lessons-learned, 22/07/2026). Ces 4 routes n'ont AUCUN appelant côté
 * client — l'interface MFA n'existe pas encore — donc les typer ne servait à
 * rien et coûtait 3 entrées.
 *
 * Le jour où l'écran MFA sera construit, il appellera ces mêmes URLs ; il lui
 * faudra simplement porter ses génériques explicitement.
 *
 * La logique reste dans `server/mfa/` (répertoire NON scanné par Nitro), un
 * fichier par opération, et chacune garde ses propres contrôles.
 */
export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, 'action');
  const methode = getMethod(event);

  // La suppression cible un facteur par son identifiant : l'action EST l'id.
  if (methode === 'DELETE') return supprimer(event);

  if (methode === 'GET' && action === 'factors') return factors(event);
  if (methode === 'POST' && action === 'enroll') return enroll(event);
  if (methode === 'POST' && action === 'verify') return verify(event);

  return notFound('Opération MFA inconnue');
});
