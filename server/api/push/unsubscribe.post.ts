import { z } from 'zod';
import { removeSubscription } from '~~/server/utils/webPush';

const schema = z.object({ endpoint: z.string().url().max(2048) });

/** POST /api/push/unsubscribe — supprime un abonnement Web Push. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);
  await removeSubscription(user.id, body.endpoint);
  return { data: { unsubscribed: true } };
});
