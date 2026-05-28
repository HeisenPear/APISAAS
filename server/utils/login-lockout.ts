import { and, eq, gte, sql } from 'drizzle-orm';
import { loginAttempts } from '~~/server/database/schema';

/**
 * Account lockout progressif.
 *
 * Compte le nombre de tentatives echouees sur un email dans les 24h.
 * Plus le compteur est haut, plus la fenetre de verrouillage est longue.
 *
 * Cle par EMAIL (pas par IP) : un attaquant qui rotate les IP n'echappe
 * pas au lockout. Risque marginal de DoS d'un user legitime (un attaquant
 * peut volontairement bloquer un email), mais le compromis vaut le coup
 * vu la simplicite : le user peut reset son mot de passe pour debloquer.
 *
 * Combine avec le rate-limit IP du middleware 03 → defense en profondeur.
 */

const WINDOW_MS = 24 * 60 * 60 * 1000; // fenetre d'observation : 24h

interface LockoutPolicy {
  threshold: number;
  lockSeconds: number;
}

const POLICIES: LockoutPolicy[] = [
  { threshold: 20, lockSeconds: 24 * 60 * 60 }, // 24h
  { threshold: 10, lockSeconds: 60 * 60 }, // 1h
  { threshold: 5, lockSeconds: 15 * 60 }, // 15min
];

/**
 * Verifie si l'email est actuellement verrouille.
 * Retourne `null` si OK, sinon un objet `{ until, retryAfterSeconds }`.
 */
export async function checkLockout(emailKey: string): Promise<{
  lockedUntil: Date;
  retryAfterSeconds: number;
} | null> {
  const since = new Date(Date.now() - WINDOW_MS);
  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      lastFailedAt: sql<Date | null>`max(${loginAttempts.createdAt})`,
    })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.emailKey, emailKey),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since),
      ),
    );

  const row = rows[0];
  if (!row) return null;
  const { count, lastFailedAt } = row;
  if (!count || count === 0 || !lastFailedAt) return null;

  const policy = POLICIES.find((p) => count >= p.threshold);
  if (!policy) return null;

  const lockedUntil = new Date(lastFailedAt.getTime() + policy.lockSeconds * 1000);
  const now = Date.now();
  if (lockedUntil.getTime() <= now) return null;

  return {
    lockedUntil,
    retryAfterSeconds: Math.ceil((lockedUntil.getTime() - now) / 1000),
  };
}

/**
 * Enregistre une tentative (reussie ou echouee).
 * Best-effort — ne propage pas les erreurs DB.
 */
export async function recordAttempt(
  emailKey: string,
  ip: string | null,
  success: boolean,
): Promise<void> {
  try {
    await db.insert(loginAttempts).values({ emailKey, ip, success });
  } catch (err) {
    console.error('[login-lockout] insert failed', err);
  }
}
