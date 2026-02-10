import { defineEventHandler, getRequestURL, createError, getRequestIP } from 'h3';

/**
 * In-memory rate limiter middleware.
 *
 * Rules:
 *  - API routes (/api/**):         max 100 requests / 60 seconds / IP
 *  - Auth login (/api/auth/login):  max 5 requests / 15 minutes / IP
 *
 * Returns HTTP 429 when the limit is exceeded.
 * Expired entries are cleaned up automatically on each request cycle.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp in ms
}

// Separate stores for general API and auth login
const apiStore = new Map<string, RateLimitEntry>();
const authLoginStore = new Map<string, RateLimitEntry>();

// Configuration
const API_MAX_REQUESTS = 100;
const API_WINDOW_MS = 60 * 1000; // 1 minute

const AUTH_LOGIN_MAX_REQUESTS = 5;
const AUTH_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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
    cleanupStore(authLoginStore);
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

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return;
  }

  // Attempt periodic cleanup
  maybeCleanup();

  // Resolve client IP -- fallback to a generic key if IP cannot be determined
  const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';

  // Stricter limit for auth login endpoint
  const isAuthLogin = pathname === '/api/auth/login';

  if (isAuthLogin) {
    const allowed = checkRateLimit(
      authLoginStore,
      clientIp,
      AUTH_LOGIN_MAX_REQUESTS,
      AUTH_LOGIN_WINDOW_MS,
    );

    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'Trop de tentatives de connexion. Reessayez dans 15 minutes.',
      });
    }
  }

  // General API rate limit (applies to all /api/ routes including login)
  const allowed = checkRateLimit(apiStore, clientIp, API_MAX_REQUESTS, API_WINDOW_MS);

  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Limite de requetes atteinte. Reessayez dans une minute.',
    });
  }
});
