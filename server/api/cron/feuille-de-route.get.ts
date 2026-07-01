import { profils } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';
import { chargerPlanJour } from '~~/server/utils/planJour';
import { resumeQuotidienActif, heureResumeQuotidien } from '~~/server/utils/alertesCategories';
import { hasFeature, type Plan } from '~~/app/config/plans';

const USER_BATCH_SIZE = 25;

/** Heure courante 0-23 dans le fuseau Europe/Paris. */
function heureParisActuelle(now: Date): number {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Paris',
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
}

/**
 * GET /api/cron/feuille-de-route — résumé quotidien « feuille de route du jour ».
 *
 * Tourne CHAQUE HEURE (Vercel = UTC) et ne pousse qu'aux apiculteurs Pro+ dont
 * l'heure d'envoi choisie (Europe/Paris, défaut 7 h) correspond à l'heure
 * courante. C'est ce qui permet à chacun de programmer SON heure malgré un cron
 * en UTC. Une seule notif consolidée, envoyée uniquement s'il y a à faire.
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();
  const heureCourante = heureParisActuelle(now);

  // Ne charger que les comptes éligibles à CETTE heure (résumé activé + heure
  // choisie == heure courante). Le filtre plan (Pro+) se fait ensuite.
  const users = await db
    .select({ id: profils.id, plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);

  const eligibles = users.filter((u) => {
    const brut = u.pushNotifPrefs as Record<string, unknown> | null;
    return (
      resumeQuotidienActif(brut) &&
      heureResumeQuotidien(brut) === heureCourante &&
      hasFeature((u.plan ?? 'decouverte') as Plan, 'tourneeOptimisee')
    );
  });

  if (eligibles.length === 0) return { data: { heure: heureCourante, cibles: 0, envoyes: 0 } };

  const { results } = await processInBatches(eligibles, USER_BATCH_SIZE, async (user) => {
    const feuille = await chargerPlanJour(user.id, now);
    if (feuille.estVide) return 0;
    return sendPushToUser(user.id, {
      title: '🗺️ Ta feuille de route du jour',
      body: feuille.resume,
      url: feuille.url,
      priorite: feuille.priorite,
      tag: 'feuille-de-route',
    }).catch(() => 0);
  });

  const envoyes = results.reduce((s, n) => s + (n ?? 0), 0);
  return { data: { heure: heureCourante, cibles: eligibles.length, envoyes } };
});
