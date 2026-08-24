import { defineEventHandler, setHeaders } from 'h3';

/**
 * Origine d'ingestion Sentry, DÉRIVÉE du DSN configuré — jamais recopiée.
 *
 * ⚠️ LE DÉFAUT QUE CETTE FONCTION EXISTE POUR EMPÊCHER, ET QUI A DURÉ.
 *
 * `connect-src` listait Supabase, Open-Meteo, Stripe, l'API adresse et
 * Cloudflare — mais pas Sentry. Le SDK tournait, tentait d'émettre, et le
 * navigateur refusait à chaque fois. Toutes les erreurs client étaient donc
 * perdues, en silence, depuis l'écriture de cette CSP : le monitoring
 * d'erreurs affichait un tableau de bord vide qu'on lisait comme « rien ne
 * casse ».
 *
 * Le DSN est la seule source de vérité (il porte la région : `de.sentry.io`,
 * `us.sentry.io`, …). Écrire l'hôte en dur ici le ferait diverger le jour où
 * le projet change de région — et on remettrait des semaines à s'en rendre
 * compte, puisque l'échec est muet.
 *
 * Sans DSN configuré, rien n'est ajouté : on n'ouvre pas une porte inutile.
 */
function origineSentry(dsn: string | undefined): string | null {
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    // Un DSN malformé ne doit pas faire tomber TOUTE la CSP : sans elle, la
    // page se charge sans aucune protection. On préfère perdre Sentry.
    return null;
  }
}

/**
 * Security headers middleware.
 * Applied to ALL responses to harden the application against common attacks.
 */
export default defineEventHandler((event) => {
  // Skip CSP in development — Nuxt HMR/Vite WebSocket uses dynamic ports
  // that cannot be statically whitelisted without breaking the CSP.
  if (process.env.NODE_ENV !== 'production') {
    setHeaders(event, {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    });
    return;
  }

  const sentry = origineSentry(useRuntimeConfig().public?.sentryDsn as string | undefined);

  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // microphone=(self) : requis pour la dictée vocale de Maya (Web Speech API).
    // Était `microphone=()`, ce qui bloquait le micro sur tout le site.
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), payment=(self)',
    'Content-Security-Policy': [
      "default-src 'self'",
      // 'unsafe-inline' garde pour l'instant (Nuxt SSR inline state + scripts d'analytics).
      // 'unsafe-eval' supprime — aucune dependance critique ne l'exige en prod.
      // TODO: migrer vers nonce-based CSP (useHead + nonce server-generated par requete)
      // pour pouvoir retirer 'unsafe-inline' aussi.
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
      [
        "connect-src 'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.open-meteo.com',
        'https://api.stripe.com',
        'https://api-adresse.data.gouv.fr',
        'https://challenges.cloudflare.com',
        // Remontée des erreurs client. Absent, le SDK émettait dans le vide.
        ...(sentry ? [sentry] : []),
      ].join(' '),
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Reporte les violations a notre endpoint (utile pour detecter XSS tentes)
      'report-uri /api/security/csp-report',
    ].join('; '),
  };

  // HSTS only in production to avoid issues in local development
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  setHeaders(event, headers);
});
