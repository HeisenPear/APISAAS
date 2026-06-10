import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

/**
 * Web Push (PWA) — envoi de notifications sans fournisseur tiers.
 *
 * Les abonnements sont stockés dans `profils.preferences.webPushSubscriptions`
 * (pas de table dédiée). Les clés VAPID viennent de la config runtime.
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  ua?: string;
  createdAt?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  priorite?: 'critique' | 'haute' | 'moyenne' | 'basse';
}

// web-push est charge dynamiquement : il pese sur le cold start Vercel et
// n'est utile qu'aux routes qui envoient effectivement une notification.
type WebPushModule = typeof import('web-push');
let _webpush: WebPushModule | null = null;

async function getWebpush(): Promise<WebPushModule | null> {
  const cfg = useRuntimeConfig();
  const publicKey = cfg.public?.vapidPublicKey as string | undefined;
  const privateKey = cfg.vapidPrivateKey as string | undefined;
  if (!publicKey || !privateKey) return null;
  if (!_webpush) {
    // web-push est un module CommonJS : selon le bundler l'API est sur
    // `default` ou directement sur le namespace
    const mod = (await import('web-push')) as WebPushModule & { default?: WebPushModule };
    _webpush = mod.default ?? mod;
    _webpush.setVapidDetails(
      (cfg.vapidSubject as string) || 'mailto:contact@apigo.fr',
      publicKey,
      privateKey,
    );
  }
  return _webpush;
}

export function isPushConfigured(): boolean {
  const cfg = useRuntimeConfig();
  return Boolean(cfg.public?.vapidPublicKey && cfg.vapidPrivateKey);
}

async function getPrefs(userId: string): Promise<Record<string, unknown>> {
  const [row] = await db
    .select({ preferences: profils.preferences })
    .from(profils)
    .where(eq(profils.id, userId))
    .limit(1);
  return (row?.preferences ?? {}) as Record<string, unknown>;
}

function getSubs(prefs: Record<string, unknown>): PushSubscriptionData[] {
  const subs = prefs.webPushSubscriptions;
  return Array.isArray(subs) ? (subs as PushSubscriptionData[]) : [];
}

/** Enregistre (ou met à jour) un abonnement, dédupliqué par endpoint (max 10). */
export async function saveSubscription(userId: string, sub: PushSubscriptionData): Promise<void> {
  const prefs = await getPrefs(userId);
  const existing = getSubs(prefs).filter((s) => s.endpoint !== sub.endpoint);
  const updated = [...existing, { ...sub, createdAt: new Date().toISOString() }].slice(-10);
  await db
    .update(profils)
    .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
    .where(eq(profils.id, userId));
}

export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  const prefs = await getPrefs(userId);
  const updated = getSubs(prefs).filter((s) => s.endpoint !== endpoint);
  await db
    .update(profils)
    .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
    .where(eq(profils.id, userId));
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur.
 * Best-effort : purge les abonnements expirés (404/410), ne lève jamais.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const webpush = await getWebpush();
  if (!webpush) return 0;

  const prefs = await getPrefs(userId);
  const subs = getSubs(prefs);
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  const morts: string[] = [];
  let envoyes = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body, {
          TTL: 60 * 60 * 12,
        });
        envoyes++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) morts.push(s.endpoint);
      }
    }),
  );

  if (morts.length > 0) {
    const updated = subs.filter((s) => !morts.includes(s.endpoint));
    await db
      .update(profils)
      .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
      .where(eq(profils.id, userId));
  }

  return envoyes;
}
