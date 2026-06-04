import { z } from 'zod';
import { saveSubscription } from '~~/server/utils/webPush';

const schema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(10).max(256),
    auth: z.string().min(10).max(256),
  }),
});

/** POST /api/push/subscribe — enregistre un abonnement Web Push. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  await saveSubscription(user.id, {
    endpoint: body.endpoint,
    keys: body.keys,
    ua: getHeader(event, 'user-agent') ?? undefined,
  });

  return { data: { subscribed: true } };
});
