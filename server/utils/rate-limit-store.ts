/**
 * Store de rate-limit PARTAGÉ (Upstash Redis REST) — env-gated.
 *
 * Le rate-limiter du middleware 03 est EN MÉMOIRE par instance serverless : sur
 * Vercel les limites ne sont ni globales ni persistantes (reset au cold start).
 * Quand `UPSTASH_REDIS_REST_URL` + `_TOKEN` sont définis, on borne les buckets
 * SENSIBLES (création de compte, écritures publiques) via un compteur Redis
 * atomique global. Sinon : `sharedStoreEnabled = false` → le middleware retombe
 * sur le store mémoire (comportement inchangé).
 *
 * Fail-open : toute erreur réseau/HTTP laisse passer la requête — on ne bloque
 * jamais le trafic légitime à cause d'un incident Redis.
 */
const REST_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.NUXT_UPSTASH_REDIS_REST_URL || '';
const REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.NUXT_UPSTASH_REDIS_REST_TOKEN || '';

export const sharedStoreEnabled = Boolean(REST_URL && REST_TOKEN);

/**
 * Incrémente un compteur atomique Redis (INCR) avec TTL posé une seule fois
 * (PEXPIRE ... NX). Retourne `true` si sous la limite, `false` si dépassée.
 */
export async function upstashCheck(key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, String(windowMs), 'NX'],
      ]),
    });
    if (!res.ok) return true; // fail-open
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 0);
    return count <= max;
  } catch {
    return true; // fail-open
  }
}
