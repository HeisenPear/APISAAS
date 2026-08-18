import { claimAndSendWelcomeEmail } from '~~/server/utils/welcomeEmail';
import { diffuserPush, executerMoteurAlertes } from '~~/server/utils/moteurAlertes';
import { PROFIL_DASHBOARD } from '~~/server/utils/moteurAlertes/profils';

/**
 * POST /api/alertes/generate — génération à la demande, déclenchée en
 * fire-and-forget au chargement du dashboard.
 *
 * Mêmes règles que le cron, au profil près (cf. moteurAlertes/profils.ts) : ici
 * pas de météo (appel réseau), pas de RDV ni de balances muettes (fenêtres
 * calibrées sur le cron du matin).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  // Les alertes appartiennent à l'espace partagé : on les génère sur le
  // propriétaire (le cron fait de même en itérant sur les comptes propriétaires).
  const ownerId = await resolveOwnerId(event);
  const maintenant = new Date();

  // Déclencheur opportuniste de l'email de bienvenue différé (~1 h après
  // l'inscription) : cette route est appelée à chaque visite du dashboard.
  // Idempotent (claim atomique), fire-and-forget. Reste personnel à l'utilisateur.
  dbWatchdog(claimAndSendWelcomeEmail(user.id), 'welcome-email').catch(() => {});

  try {
    // Borné : tâche best-effort — sur pool empoisonné (sockets morts après gel
    // de la lambda) on abandonne vite, le watchdog recycle le pool.
    const res = await dbWatchdog(
      executerMoteurAlertes({ userId: ownerId, profil: PROFIL_DASHBOARD, maintenant }),
      'alertes/generate',
      15_000,
    );
    await diffuserPush([res], maintenant);
    return { data: { created: res.creees.length } };
  } catch (err) {
    // Cette route ne doit JAMAIS renvoyer un 500 au client (sinon bruit console
    // + faux signal d'erreur sur le dashboard). On loggue côté serveur et on
    // renvoie un résultat neutre.
    console.error(
      '[alertes/generate] échec génération:',
      err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : err,
    );
    return { data: { created: 0 } };
  }
});
