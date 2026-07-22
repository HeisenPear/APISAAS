import { createHmac, timingSafeEqual } from 'node:crypto';

// ═══════════════════════════════════════════════════════════════════════════
// Jeton de DÉSINSCRIPTION email (RGPD) — signé HMAC, sans session.
// Un lien one-click dans les emails d'urgence doit fonctionner SANS login
// (obligation RGPD). On signe l'userId avec un secret serveur ; le token n'est
// pas devinable et ne donne AUCUN autre pouvoir que couper `email_urgent`.
// ═══════════════════════════════════════════════════════════════════════════

function secret(): string {
  // Réutilise le secret cron (déjà présent en prod). Fallback dev only.
  return process.env.NUXT_CRON_SECRET || process.env.CRON_SECRET || 'apigo-notif-dev-secret';
}

/** Signature déterministe de l'userId (32 hex). Pur (hors env). */
export function signerDesinscription(userId: string): string {
  return createHmac('sha256', secret()).update(`unsub-email:${userId}`).digest('hex').slice(0, 32);
}

/** Vérifie un token de désinscription en temps constant. */
export function verifierDesinscription(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  const attendu = signerDesinscription(userId);
  if (token.length !== attendu.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(attendu));
  } catch {
    return false;
  }
}

/** URL complète de désinscription email pour un utilisateur (pied des emails). */
export function lienDesinscriptionEmail(userId: string): string {
  const base = process.env.NUXT_PUBLIC_BASE_URL || 'https://apigo.fr';
  return `${base}/api/notif/unsubscribe-email?u=${encodeURIComponent(userId)}&t=${signerDesinscription(userId)}`;
}
