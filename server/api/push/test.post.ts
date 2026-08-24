import { sendPushToUser, isPushConfigured } from '~~/server/utils/webPush';

/** POST /api/push/test — envoie une notification de test à l'utilisateur. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  if (!isPushConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Notifications push non configurées (VAPID)',
    });
  }

  const { envoyes, raison } = await sendPushToUser(user.id, {
    title: '🐝 APIGO',
    body: 'Les notifications sont bien activées. Vous serez alerté en cas de souci sur vos ruches.',
    url: '/alertes',
    tag: 'test',
  });

  /**
   * ⚠️ UN ENVOI À PERSONNE N'EST PAS UN SUCCÈS.
   *
   * Cette route renvoyait 200 avec `envoyes: 0`, et l'écran affichait
   * « Notification de test envoyée » en vert. L'apiculteur ne recevait rien,
   * et rien nulle part ne disait pourquoi. On rend donc la RAISON, pour que
   * l'interface puisse dire la vérité — c'est le seul point du produit où l'on
   * peut diagnostiquer sa propre configuration push en une seconde.
   */
  return { data: { envoyes, raison, reussi: envoyes > 0 } };
});
