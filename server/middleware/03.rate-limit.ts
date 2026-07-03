import { defineEventHandler, getRequestURL, createError } from 'h3';
import { getClientIp } from '~~/server/utils/client-ip';
import { sharedStoreEnabled, upstashCheck } from '~~/server/utils/rate-limit-store';

/**
 * In-memory rate limiter middleware.
 *
 * Rules:
 *  - API routes (/api/**):               max 100 requests / 60 seconds / IP
 *  - Auth register (/api/auth/register): max 3 requests / hour / IP
 *
 * NB : le LOGIN et le RESET password ne passent PAS par le serveur Nuxt (le front
 * appelle directement le client Supabase) → leur rate-limit est assuré par
 * Supabase, pas ici. On ne garde donc pas de branche login/reset factice.
 *
 * Returns HTTP 429 when the limit is exceeded.
 * Expired entries are cleaned up automatically on each request cycle.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp in ms
}

// Separate stores for general API, register, and public endpoints
const apiStore = new Map<string, RateLimitEntry>();
const authRegisterStore = new Map<string, RateLimitEntry>();
const publicReadStore = new Map<string, RateLimitEntry>();
const publicWriteStore = new Map<string, RateLimitEntry>();
const calendarTokenStore = new Map<string, RateLimitEntry>();
const cspReportStore = new Map<string, RateLimitEntry>();

// Configuration
const API_MAX_REQUESTS = 100;
const API_WINDOW_MS = 60 * 1000; // 1 minute

const AUTH_REGISTER_MAX_REQUESTS = 3;
const AUTH_REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Routes publiques (commande publique, campagne publique, QR code…)
const PUBLIC_READ_MAX_REQUESTS = 30; // 30 lectures / minute / IP
const PUBLIC_READ_WINDOW_MS = 60 * 1000;

const PUBLIC_WRITE_MAX_REQUESTS = 5; // 5 commandes / 10 minutes / IP — antispam
const PUBLIC_WRITE_WINDOW_MS = 10 * 60 * 1000;

// Calendrier .ics (token) — brute-force protection
const CALENDAR_TOKEN_MAX_REQUESTS = 60; // 60 req / minute / IP
const CALENDAR_TOKEN_WINDOW_MS = 60 * 1000;

// CSP violation reports (envoyes par le navigateur) — limite dediee large plutot
// qu'exemption totale : un site malveillant peut en generer des centaines
// (flood de logs / cout d'invocation serverless).
const CSP_REPORT_MAX_REQUESTS = 60;
const CSP_REPORT_WINDOW_MS = 60 * 1000;

// Cleanup interval: run every 60 seconds
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

/**
 * Remove expired entries from a rate limit store.
 */
function cleanupStore(store: Map<string, RateLimitEntry>): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Run cleanup on all stores if the cleanup interval has elapsed.
 */
function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup >= CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    cleanupStore(apiStore);
    cleanupStore(authRegisterStore);
    cleanupStore(publicReadStore);
    cleanupStore(publicWriteStore);
    cleanupStore(calendarTokenStore);
    cleanupStore(cspReportStore);
  }
}

/**
 * Check and increment the rate limit for a given key in a given store.
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // First request in window or window expired -- start fresh
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Window still active
  existing.count += 1;

  if (existing.count > maxRequests) {
    return false;
  }

  return true;
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return;
  }

  // CSP reports : limite dediee (au lieu d'une exemption totale) — evite le flood
  // de logs / cout par un site malveillant tout en laissant passer le trafic legitime.
  if (pathname === '/api/security/csp-report') {
    const allowed = checkRateLimit(
      cspReportStore,
      getClientIp(event),
      CSP_REPORT_MAX_REQUESTS,
      CSP_REPORT_WINDOW_MS,
    );
    if (!allowed) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' });
    }
    return;
  }

  // Attempt periodic cleanup
  maybeCleanup();

  // IP cliente reelle — privilegie CF-Connecting-IP > X-Real-IP > X-Forwarded-For
  // (cf. server/utils/client-ip.ts pour l'ordre de confiance)
  const clientIp = getClientIp(event);

  // Stricter limit pour la création de compte (seul endpoint auth qui passe par le serveur).
  const isAuthRegister = pathname === '/api/auth/register';

  // Public endpoints (sans auth) — limites plus serrees pour anti-bot/spam
  const isPublicWrite =
    (pathname.startsWith('/api/public/') || pathname === '/api/feedback') &&
    event.method !== 'GET' &&
    event.method !== 'HEAD';
  const isPublicRead =
    pathname.startsWith('/api/public/') && (event.method === 'GET' || event.method === 'HEAD');
  const isCalendarToken = pathname.startsWith('/api/calendrier/') && pathname.endsWith('.ics');

  if (isPublicWrite) {
    // Bucket SENSIBLE : store partagé Upstash si configuré (limite globale
    // inter-instances), sinon mémoire par instance.
    const allowed = sharedStoreEnabled
      ? await upstashCheck(`rl:pw:${clientIp}`, PUBLIC_WRITE_MAX_REQUESTS, PUBLIC_WRITE_WINDOW_MS)
      : checkRateLimit(
          publicWriteStore,
          clientIp,
          PUBLIC_WRITE_MAX_REQUESTS,
          PUBLIC_WRITE_WINDOW_MS,
        );
    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'Trop de soumissions. Reessayez dans 10 minutes.',
      });
    }
  } else if (isPublicRead) {
    const allowed = checkRateLimit(
      publicReadStore,
      clientIp,
      PUBLIC_READ_MAX_REQUESTS,
      PUBLIC_READ_WINDOW_MS,
    );
    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'Trop de requetes. Reessayez dans une minute.',
      });
    }
  }

  if (isCalendarToken) {
    const allowed = checkRateLimit(
      calendarTokenStore,
      clientIp,
      CALENDAR_TOKEN_MAX_REQUESTS,
      CALENDAR_TOKEN_WINDOW_MS,
    );
    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'Trop de requetes sur ce calendrier.',
      });
    }
  }

  if (isAuthRegister) {
    // Bucket SENSIBLE : store partagé Upstash si configuré, sinon mémoire.
    const allowed = sharedStoreEnabled
      ? await upstashCheck(
          `rl:reg:${clientIp}`,
          AUTH_REGISTER_MAX_REQUESTS,
          AUTH_REGISTER_WINDOW_MS,
        )
      : checkRateLimit(
          authRegisterStore,
          clientIp,
          AUTH_REGISTER_MAX_REQUESTS,
          AUTH_REGISTER_WINDOW_MS,
        );

    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'Trop de tentatives de creation de compte. Reessayez dans une heure.',
      });
    }
  }

  // General API rate limit (s'applique à toutes les routes /api/)
  const allowed = checkRateLimit(apiStore, clientIp, API_MAX_REQUESTS, API_WINDOW_MS);

  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Limite de requetes atteinte. Reessayez dans une minute.',
    });
  }
});
