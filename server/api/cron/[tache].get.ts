import achatsRecurrents from '~~/server/crons/achats-recurrents';
import alertes from '~~/server/crons/alertes';
import feuilleDeRoute from '~~/server/crons/feuille-de-route';
import napiReminders from '~~/server/crons/napi-reminders';
import trialExpiry from '~~/server/crons/trial-expiry';
import trialWarning from '~~/server/crons/trial-warning';
import urgences from '~~/server/crons/urgences';
import weeklyReport from '~~/server/crons/weekly-report';
import welcomeEmails from '~~/server/crons/welcome-emails';

/**
 * AIGUILLEUR DES TÂCHES PLANIFIÉES — `GET /api/cron/:tache`.
 *
 * Les 9 crons vivaient chacun dans son propre fichier de route. Les URLs n'ont
 * PAS changé (`/api/cron/alertes`, `/api/cron/urgences`…), `vercel.json` est
 * intact : seule l'inscription auprès de Nitro est mutualisée ici.
 *
 * POURQUOI. Nitro type une entrée par route dans `InternalApi`, sous la forme
 * `Simplify<Serialize<Awaited<ReturnType<typeof handler>>>>`. Passé ~215
 * entrées, la résolution des surcharges de `useFetch` franchit le plafond
 * d'instanciation de TypeScript : le compilateur abandonne et `useFetch<T>()`
 * renvoie `any`, ce qui casse le typage de dizaines de fichiers sains
 * (cf. lessons-learned, 22/07/2026). Or ces 9 routes ne sont JAMAIS appelées
 * par le client — c'est le planificateur de Vercel qui les invoque en HTTP.
 * Les typer ne servait donc à rien et coûtait 8 entrées.
 *
 * La logique de chaque tâche reste dans son fichier, sous `server/crons/`
 * (répertoire NON scanné par Nitro, donc sans inscription de route). Chacune
 * garde sa propre `assertCronAuth()` : l'authentification n'est pas centralisée
 * ici, pour qu'un oubli d'aiguillage ne puisse jamais exposer une tâche.
 */
const TACHES = {
  'achats-recurrents': achatsRecurrents,
  alertes,
  'feuille-de-route': feuilleDeRoute,
  'napi-reminders': napiReminders,
  'trial-expiry': trialExpiry,
  'trial-warning': trialWarning,
  urgences,
  'weekly-report': weeklyReport,
  'welcome-emails': welcomeEmails,
} as const;

export default defineEventHandler(async (event) => {
  const tache = getRouterParam(event, 'tache');
  const handler = tache ? TACHES[tache as keyof typeof TACHES] : undefined;

  // Tâche inconnue : 404 franc plutôt qu'un 200 silencieux, sinon une faute de
  // frappe dans `vercel.json` passerait pour un cron qui tourne.
  if (!handler) return notFound('Tâche planifiée inconnue');

  return handler(event);
});
