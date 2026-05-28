import { getClientIp } from '~~/server/utils/client-ip';

/**
 * Endpoint de reception des violations CSP.
 *
 * Les navigateurs envoient automatiquement les violations a `report-uri` /
 * `report-to` declares dans le header CSP. Ces rapports indiquent :
 *   - une tentative d'XSS bloquee
 *   - une erreur de config CSP (script legitime trop restreint)
 *   - une extension malveillante injectant du JS
 *
 * On log en console (Vercel logs / Sentry) pour analyse manuelle. Pas de
 * stockage en DB pour eviter le flood (un seul site malveillant peut
 * generer des centaines de rapports).
 */
export default defineEventHandler(async (event) => {
  // Le body est en JSON mais le Content-Type est `application/csp-report`
  const body = await readBody(event).catch(() => null);
  const ip = getClientIp(event);
  const userAgent = getHeader(event, 'user-agent') ?? 'unknown';
  const referer = getHeader(event, 'referer') ?? 'unknown';

  if (body) {
    console.warn('[CSP violation]', {
      ip,
      userAgent,
      referer,
      report: body,
    });
  }

  // Reponse 204 — navigateurs n'attendent rien
  setResponseStatus(event, 204);
  return null;
});
