import { eq, inArray } from 'drizzle-orm';
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
      (cfg.vapidSubject as string) || 'mailto:apigo360.apiculture@gmail.com',
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
  const [row] = await withDbRetry(
    () =>
      db
        .select({ preferences: profils.preferences })
        .from(profils)
        .where(eq(profils.id, userId))
        .limit(1),
    'webPush:getPrefs',
  );
  return (row?.preferences ?? {}) as Record<string, unknown>;
}

function getSubs(prefs: Record<string, unknown>): PushSubscriptionData[] {
  const subs = prefs.webPushSubscriptions;
  return Array.isArray(subs) ? (subs as PushSubscriptionData[]) : [];
}

/**
 * Enregistre (ou met à jour) un abonnement, dédupliqué par endpoint (max 10).
 *
 * Protégé par withDbRetry : cet appel est déclenché en arrière-plan à chaque
 * retour sur l'app (plugin push-resync.client.ts) — sans résilience, un pool
 * empoisonné (lambda qui vient de se réveiller après un déploiement) le
 * faisait échouer SILENCIEUSEMENT côté client (catch qui avale tout), ce qui
 * laissait l'abonnement serveur mort sans que l'utilisateur s'en rende compte.
 */
export async function saveSubscription(userId: string, sub: PushSubscriptionData): Promise<void> {
  const prefs = await getPrefs(userId);
  const existing = getSubs(prefs).filter((s) => s.endpoint !== sub.endpoint);
  const updated = [...existing, { ...sub, createdAt: new Date().toISOString() }].slice(-10);
  await withDbRetry(
    () =>
      db
        .update(profils)
        .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
        .where(eq(profils.id, userId)),
    'webPush:saveSubscription',
  );
}

export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  const prefs = await getPrefs(userId);
  const updated = getSubs(prefs).filter((s) => s.endpoint !== endpoint);
  await withDbRetry(
    () =>
      db
        .update(profils)
        .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
        .where(eq(profils.id, userId)),
    'webPush:removeSubscription',
  );
}

/**
 * Envoie PLUSIEURS notifications à un utilisateur en ne lisant ses abonnements
 * qu'UNE fois.
 *
 * Le cron envoyait ses payloads un par un, en série : une lecture de
 * `profils.preferences` PAR notification, pour tous les comptes. Sur 1 000
 * comptes à deux notifications chacun, ça faisait 2 000 allers-retours en base
 * à 8 h du matin — pour 1 000 en réalité nécessaires.
 *
 * Best-effort : purge les abonnements expirés (404/410), ne lève jamais.
 */
export async function sendPushBatchToUser(
  userId: string,
  payloads: readonly PushPayload[],
): Promise<number> {
  if (payloads.length === 0) return 0;
  const webpush = await getWebpush();
  if (!webpush) return 0;

  const prefs = await getPrefs(userId);
  const subs = getSubs(prefs);
  if (subs.length === 0) return 0;

  const morts = new Set<string>();
  let envoyes = 0;

  for (const payload of payloads) {
    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        // Un abonnement déjà connu mort ne sert à rien pour les payloads suivants.
        if (morts.has(s.endpoint)) return;
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body, {
            TTL: 60 * 60 * 12,
          });
          envoyes++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) morts.add(s.endpoint);
        }
      }),
    );
  }

  if (morts.size > 0) {
    const updated = subs.filter((s) => !morts.has(s.endpoint));
    await withDbRetry(
      () =>
        db
          .update(profils)
          .set({ preferences: { ...prefs, webPushSubscriptions: updated }, updatedAt: new Date() })
          .where(eq(profils.id, userId)),
      'webPush:purgeExpired',
    ).catch(() => {});
  }

  return envoyes;
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur.
 * Best-effort : purge les abonnements expirés (404/410), ne lève jamais.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  return sendPushBatchToUser(userId, [payload]);
}

/** Emails admin (whitelist `NUXT_ADMIN_EMAILS`), normalisés en minuscules. */
export function getAdminEmails(): string[] {
  return (process.env.NUXT_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Envoie une notification push à TOUS les admins (sur leurs appareils enregistrés).
 * Sert aux alertes internes (ex : nouvelle demande de démo). Best-effort.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  const emails = getAdminEmails();
  if (emails.length === 0) return 0;

  const admins = await db
    .select({ id: profils.id })
    .from(profils)
    .where(inArray(profils.email, emails));

  let total = 0;
  for (const a of admins) {
    total += await sendPushToUser(a.id, payload);
  }
  return total;
}
