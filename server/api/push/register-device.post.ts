import { z } from 'zod';

const schema = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(['ios', 'android']),
});

/**
 * POST /api/push/register-device
 * Enregistre le token push d'un appareil (Capacitor)
 * Note: stocké dans les preferences du profil pour éviter une nouvelle table
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  // Store device token in user preferences for FCM/APNs dispatch
  const { profils } = await import('~~/server/database/schema');
  const { eq } = await import('drizzle-orm');

  const [existing] = await db
    .select({ preferences: profils.preferences })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  const prefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  const devices = (prefs.pushDevices as Array<{ token: string; platform: string }>) ?? [];

  // Deduplicate by token
  const updated = [
    ...devices.filter((d) => d.token !== body.token),
    { token: body.token, platform: body.platform, registeredAt: new Date().toISOString() },
  ].slice(-5); // max 5 appareils

  await db
    .update(profils)
    .set({ preferences: { ...prefs, pushDevices: updated }, updatedAt: new Date() })
    .where(eq(profils.id, user.id));

  return { data: { registered: true } };
});
