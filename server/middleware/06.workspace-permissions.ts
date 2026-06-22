import { isAdminEmail } from '~~/app/config/admin';

/**
 * Permissions d'espace partagé : gate les ÉCRITURES d'un membre selon son rôle.
 *  - propriétaire (et admin plateforme) : aucune restriction ;
 *  - admin d'espace : écrit tech + finance ;
 *  - apiculteur : écrit tech, pas finance ;
 *  - comptable : écrit finance, pas tech.
 *
 * Les lectures restent ouvertes dans l'espace. Le domaine `account`
 * (compte/équipe/abonnement) est toujours scopé sur l'acteur et n'est jamais
 * soumis à cette règle.
 */
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;

  const path = getRequestURL(event).pathname;
  if (!path.startsWith('/api/')) return;
  if (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/stripe/') ||
    path.startsWith('/api/public/') ||
    path.startsWith('/api/cron/')
  )
    return;

  const domain = domainForPath(path);
  if (domain === 'account') return;

  let ws: Awaited<ReturnType<typeof resolveWorkspace>>;
  try {
    ws = await resolveWorkspace(event);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status !== 401) console.error('[workspace-permissions] resolveWorkspace failed', err);
    return; // fail-open : la route gère son auth
  }

  // Propriétaire de l'espace, ou admin plateforme : aucune restriction.
  if (ws.isOwner || isAdminEmail(ws.actorEmail)) return;

  if (memberWriteBlocked(ws.role, domain)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé',
      data: {
        code: 'ROLE_FORBIDDEN',
        role: ws.role,
        domain,
        message: `Votre rôle dans cet espace (${ws.role}) ne permet pas cette action.`,
      },
    });
  }
});
