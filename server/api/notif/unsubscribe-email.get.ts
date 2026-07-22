import { sql } from 'drizzle-orm';
import { verifierDesinscription } from '~~/server/utils/notifToken';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/notif/unsubscribe-email?u=<userId>&t=<token>
// Désinscription ONE-CLICK des emails d'urgence (RGPD) — PUBLIQUE (sans login,
// obligation légale). Le token HMAC empêche de couper les emails d'un tiers.
// Renvoie une page HTML de confirmation (pas de JSON : c'est un lien cliqué).
// ═══════════════════════════════════════════════════════════════════════════

function page(titre: string, corps: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre} · APIGO</title></head>
<body style="margin:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:460px;margin:64px auto;padding:0 16px;text-align:center">
    <div style="font-size:24px;font-weight:700;color:#1c1c1e;margin-bottom:24px">🐝 APIGO</div>
    <div style="background:#fff;border-radius:16px;border:1px solid rgba(214,211,209,0.6);padding:32px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1c1c1e">${titre}</h1>
      <p style="margin:0;color:#57534e;line-height:1.6">${corps}</p>
      <a href="https://apigo.fr/parametres" style="display:inline-block;margin-top:20px;padding:10px 22px;background:#f5a623;color:#fff;border-radius:10px;font-weight:600;text-decoration:none">Gérer mes notifications</a>
    </div>
  </div>
</body></html>`;
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const userId = String(q.u ?? '');
  const token = String(q.t ?? '');

  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8');

  if (!verifierDesinscription(userId, token)) {
    setResponseStatus(event, 400);
    return page(
      'Lien invalide',
      "Ce lien de désinscription n'est pas valide ou a expiré. Vous pouvez gérer vos notifications depuis vos paramètres.",
    );
  }

  await db
    .execute(
      sql`
      UPDATE profils
      SET push_notif_prefs = coalesce(push_notif_prefs, '{}'::jsonb)
            || jsonb_build_object('email_urgent', false)
      WHERE id = ${userId}
    `,
    )
    .catch(() => {});

  return page(
    'Désinscription confirmée',
    "Vous ne recevrez plus les <strong>emails d'alerte urgente</strong>. Les notifications push (si activées) restent actives. Vous pouvez réactiver les emails à tout moment dans vos paramètres.",
  );
});
