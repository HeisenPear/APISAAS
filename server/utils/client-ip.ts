import type { H3Event } from 'h3';
import { getHeader, getRequestIP } from 'h3';

/**
 * Extrait l'IP cliente reelle en tenant compte des proxies en front.
 *
 * Ordre de confiance :
 *   1. CF-Connecting-IP        — pose par Cloudflare si en front (le plus fiable)
 *   2. X-Real-IP               — pose par certains reverse proxies (Vercel inclus)
 *   3. X-Forwarded-For (1er)   — chaine de proxies, on prend l'origine
 *   4. getRequestIP fallback   — IP socket directe
 *
 * /!\ Tous ces headers sont SPOOFABLES si l'app est accessible directement
 * sans passer par un proxy de confiance. En production, l'app doit etre
 * uniquement accessible via Vercel (qui strip les headers client) ou
 * Cloudflare (qui pose CF-Connecting-IP de maniere authentifiee).
 *
 * Pour durcir : whitelister les IP Vercel/Cloudflare et rejeter les requetes
 * qui n'en proviennent pas.
 */
export function getClientIp(event: H3Event): string {
  const cfIp = getHeader(event, 'cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = getHeader(event, 'x-real-ip');
  if (realIp) return realIp;

  const xff = getHeader(event, 'x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  return getRequestIP(event, { xForwardedFor: false }) ?? 'unknown';
}

/**
 * Cle composee user-id + ip pour rate-limit. Quand un user est authentifie,
 * on prefere borner par user ID (impossible a contourner via IP rotation).
 * Sinon on tombe sur l'IP.
 */
export function getRateLimitKey(event: H3Event, userId?: string | null): string {
  const ip = getClientIp(event);
  return userId ? `u:${userId}` : `ip:${ip}`;
}
