import type { H3Event } from 'h3';
import { getHeader, getRequestIP } from 'h3';

/**
 * Extrait l'IP cliente reelle pour le rate-limiting.
 *
 * En production, l'app tourne derriere Vercel, qui pose `x-vercel-forwarded-for`
 * avec l'IP client reelle et REECRIT cet en-tete a sa frontiere => non falsifiable
 * par le client. On la privilegie donc.
 *
 * On NE fait PLUS confiance a `cf-connecting-ip` : apigo.fr est en Cloudflare
 * DNS-only (gris), donc cet en-tete n'est jamais pose de maniere authentifiee et
 * serait trivialement spoofable en tapant l'origine Vercel en direct (idem pour
 * `x-real-ip` / `x-forwarded-for` bruts). Le fallback socket ne sert qu'en local.
 *
 * Pour durcir encore : store de compteurs partage/atomique (Upstash Redis) pour
 * que la limite soit globale et survive aux cold starts serverless.
 */
export function getClientIp(event: H3Event): string {
  const vercelIp = getHeader(event, 'x-vercel-forwarded-for');
  if (vercelIp) {
    const first = vercelIp.split(',')[0]?.trim();
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
