import { profils } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';
import { chargerPlanJour } from '~~/server/utils/planJour';
import { resumeQuotidienActif, heureResumeQuotidien } from '~~/server/utils/alertesCategories';
import { hasFeature, type Plan } from '~~/app/config/plans';
import { partiesParisOuNull } from '~~/server/utils/horloge';

const USER_BATCH_SIZE = 25;

/**
 * GET /api/cron/feuille-de-route — résumé quotidien « feuille de route du jour ».
 *
 * Déclenché par PLUSIEURS crons quotidiens (vercel.json : `0 3..11 * * *` UTC),
 * qui partagent ce même path — supporté par Vercel et surtout compatible plan
 * Hobby (chaque cron reste « 1×/jour » ; un `0 * * * *` horaire serait REFUSÉ au
 * déploiement sur Hobby). Ces heures UTC couvrent Paris 5 h–12 h été comme hiver.
 *
 * À chaque déclenchement, on ne pousse qu'aux apiculteurs dont l'heure d'envoi
 * choisie (Europe/Paris, défaut 7 h) == heure de Paris courante : c'est ce qui
 * donne une heure PAR utilisateur malgré des crons figés en UTC. Une seule notif
 * consolidée, envoyée uniquement s'il y a quelque chose à faire.
 *
 * Ouvert à TOUS les plans : le résumé « du jour » (visites dues, RDV, traitements)
 * a de la valeur dès Découverte. Le contenu est identique ; seule la destination
 * diffère — Pro+ atterrit sur la tournée optimisée (`/tournee`, feature gatée),
 * les autres sur l'accueil.
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();
  const heureCourante = partiesParisOuNull(now)?.heure ?? 0;

  // Ne pousser qu'aux comptes éligibles à CETTE heure (résumé activé + heure
  // choisie == heure courante).
  const users = await db
    .select({ id: profils.id, plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);

  const eligibles = users.filter((u) => {
    const brut = u.pushNotifPrefs as Record<string, unknown> | null;
    return resumeQuotidienActif(brut) && heureResumeQuotidien(brut) === heureCourante;
  });

  if (eligibles.length === 0) return { data: { heure: heureCourante, cibles: 0, envoyes: 0 } };

  const { results } = await processInBatches(eligibles, USER_BATCH_SIZE, async (user) => {
    const feuille = await chargerPlanJour(user.id, now);
    if (feuille.estVide) return 0;
    // Pro+ = tournée optimisée (page /tournee gatée) ; sinon résumé simple → accueil.
    const optimisee = hasFeature((user.plan ?? 'decouverte') as Plan, 'tourneeOptimisee');
    return sendPushToUser(user.id, {
      title: optimisee ? '🗺️ Ta feuille de route du jour' : '🐝 Ton résumé du jour',
      body: feuille.resume,
      url: optimisee ? feuille.url : '/',
      priorite: feuille.priorite,
      tag: 'feuille-de-route',
    })
      .then((r) => r.envoyes)
      .catch(() => 0);
  });

  const envoyes = results.reduce((s, n) => s + (n ?? 0), 0);
  return { data: { heure: heureCourante, cibles: eligibles.length, envoyes } };
});
