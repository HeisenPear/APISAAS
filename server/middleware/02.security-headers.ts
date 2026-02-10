import { defineEventHandler, setHeaders } from 'h3';

/**
 * Security headers middleware.
 * Applied to ALL responses to harden the application against common attacks.
 */
export default defineEventHandler((event) => {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  };

  // HSTS only in production to avoid issues in local development
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  setHeaders(event, headers);
});
