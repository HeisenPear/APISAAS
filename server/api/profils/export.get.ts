import { logAudit } from '~~/server/utils/audit';
import { construireExportPersonnel } from '~~/server/utils/exportPersonnel';

/**
 * GET /api/profils/export
 *
 * Export des données personnelles — RGPD article 15 (accès) et 20 (portabilité).
 *
 * ⚠️ CETTE ROUTE NE DOIT JAMAIS ÊTRE GATÉE. Elle est volontairement absente de
 * `app/config/route-gates.ts`, et le middleware `04.subscription.ts` laisse
 * passer toute route absente de la table (`if (!gate) return`). Le droit d'accès
 * ne se vend pas : un compte Découverte doit pouvoir l'exercer. La ligne des
 * paramètres pointait auparavant sur `/api/finances/export`, gatée
 * `{ feature: 'exportCsv' }` — donc refusée au plan gratuit.
 *
 * Le contenu, sa classification et les exclusions motivées vivent dans
 * `server/utils/exportPersonnel.ts`, sous banc d'invariant.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const payload = await construireExportPersonnel(user.id, user.email, new Date());

  const horodatage = payload.exportedAt.slice(0, 10);
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8');
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="apigo-donnees-personnelles-${horodatage}.json"`,
  );

  await logAudit({ event, action: 'account.exported', userId: user.id });

  return payload;
});
