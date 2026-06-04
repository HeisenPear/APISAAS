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

  const envoyes = await sendPushToUser(user.id, {
    title: '🐝 APIGO',
    body: 'Les notifications sont bien activées. Vous serez alerté en cas de souci sur vos ruches.',
    url: '/alertes',
    tag: 'test',
  });

  return { data: { envoyes } };
});
