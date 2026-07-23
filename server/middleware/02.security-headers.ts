import { defineEventHandler, setHeaders } from 'h3';

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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://api.stripe.com https://api-adresse.data.gouv.fr https://challenges.cloudflare.com",
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
