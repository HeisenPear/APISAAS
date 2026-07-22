import type { H3Event } from 'h3';

const LOCAL_RE = /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i;
const HTTPS_RE = /^https:\/\//i;

/**
 * Origine fiable (scheme://host) de l'app pour construire des URLs de redirection
 * EXTERNES : retours Stripe (success/cancel/portail), callback agrégateur bancaire…
 *
 * Garantit qu'on ne renvoie JAMAIS un utilisateur de prod vers `localhost`, même
 * si `NUXT_PUBLIC_BASE_URL` n'est pas (ou plus) configurée en production — cause
 * du bug « ERR_CONNECTION_FAILED sur localhost:3000 » après un checkout Stripe.
 *
 * Ordre de priorité :
 *  1. `config.public.baseUrl` si c'est une URL http(s) NON-localhost (prod bien
 *     configurée, source de vérité explicite).
 *  2. L'en-tête `Origin` de la requête (https) — là où se trouve réellement le
 *     client (apigo.fr en prod, URL de preview en preview).
 *  3. Le domaine de production Vercel (`VERCEL_PROJECT_PRODUCTION_URL`).
 *  4. Dernier recours : la baseUrl configurée (localhost en dev — voulu).
 */
export function resolveAppOrigin(event: H3Event): string {
  const configured = (useRuntimeConfig().public.baseUrl ?? '').replace(/\/+$/, '');

  if (/^https?:\/\//i.test(configured) && !LOCAL_RE.test(configured)) return configured;

  const origin = getHeader(event, 'origin')?.replace(/\/+$/, '');
  if (origin && HTTPS_RE.test(origin) && !LOCAL_RE.test(origin)) return origin;

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}`;

  return configured || 'http://localhost:3000';
}
