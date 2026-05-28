import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { connexions } from '~~/server/database/schema';

/**
 * Enregistre une connexion reussie et detecte les anomalies.
 *
 * On stocke un hash de IP+UserAgent (fingerprint) plutot que les valeurs
 * brutes — limite l'exposition en cas de fuite de la table.
 *
 * Si le fingerprint n'a jamais ete vu pour cet user → c'est une "nouvelle
 * connexion" et on flag pour notifier (le mail est envoye par un worker
 * separe, async, pour ne pas ralentir le login).
 *
 * Retourne `isNewDevice = true` si c'est la 1ere fois qu'on voit cette
 * combinaison IP+UA pour ce user.
 */
export function fingerprint(ip: string, userAgent: string | null): string {
  return createHash('sha256')
    .update(`${ip}::${userAgent ?? ''}`)
    .digest('hex');
}

export async function trackConnexion(opts: {
  userId: string;
  ip: string;
  userAgent: string | null;
  pays?: string | null;
}): Promise<{ isNewDevice: boolean }> {
  const fp = fingerprint(opts.ip, opts.userAgent);

  const existing = await db
    .select({ id: connexions.id })
    .from(connexions)
    .where(and(eq(connexions.userId, opts.userId), eq(connexions.fingerprint, fp)))
    .limit(1);

  const isNewDevice = existing.length === 0;

  try {
    await db.insert(connexions).values({
      userId: opts.userId,
      ip: opts.ip,
      userAgent: opts.userAgent,
      fingerprint: fp,
      pays: opts.pays ?? null,
      // Si nouveau device, on flag pour qu'un worker async envoie l'alerte
      notified: !isNewDevice,
    });
  } catch (err) {
    console.error('[connexion-tracker] insert failed', err);
  }

  return { isNewDevice };
}
