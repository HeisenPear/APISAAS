import { timingSafeEqual } from 'node:crypto';
import type { H3Event } from 'h3';
import { getHeader } from 'h3';

/**
 * Verifie le secret cron Vercel. Centralise la garde pour eviter la
 * duplication dans chaque handler — et garantit un comportement coherent
 * (notamment : refus si CRON_SECRET vide ou non defini).
 *
 * Le header Vercel pour cron est `Authorization: Bearer <CRON_SECRET>`.
 * Vercel ne supporte pas la verification de signature, donc on doit
 * compter sur le secret partage. Comparaison en temps constant pour ne pas
 * exposer le secret a une attaque par timing.
 */
export function assertCronAuth(event: H3Event): void {
  const authHeader = getHeader(event, 'authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET || process.env.NUXT_CRON_SECRET;

  if (!cronSecret || !timingSafeStringEqual(authHeader, `Bearer ${cronSecret}`)) {
    throw createError({ statusCode: 401, message: 'Non autorise' });
  }
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual exige des longueurs egales ; la longueur seule ne revele
  // pas le contenu du secret.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Traite une liste d'items par batches avec un parallelisme borne.
 *
 * Pourquoi : iterer N items en series (for..of await) prend O(N) latence.
 * Tout paralleliser avec Promise.all sature le pool de connexions DB
 * (Supabase pooler = 60 connexions par defaut). Le batching donne le
 * meilleur des deux : N/batchSize tours, batchSize requetes en parallele
 * a chaque tour.
 *
 * Retourne `{ results, errors }` plutot que de jeter — utile pour les
 * crons qui doivent rapporter quels users ont reussi/echoue sans tout
 * annuler.
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<{ results: R[]; errors: Array<{ item: T; error: unknown }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: unknown }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((item, j) => fn(item, i + j)));

    settled.forEach((s, j) => {
      const item = batch[j];
      if (item === undefined) return;
      if (s.status === 'fulfilled') {
        results.push(s.value);
      } else {
        errors.push({ item, error: s.reason });
      }
    });
  }

  return { results, errors };
}

/**
 * Paginer une grande table en chunks. Plus prudent que de tout charger en
 * memoire (et plus scalable). Utilise les ids (cle primaire) pour eviter
 * les soucis d'offset sur grandes tables.
 *
 * Pour les tables avec id UUID, on pagine par ORDER BY id et WHERE id > cursor.
 *
 * Exemple :
 *   for await (const batch of paginate(profils, profils.id, 500)) { ... }
 */
export async function* paginateByCursor<T extends { id: string }>(
  fetchPage: (cursor: string | null, limit: number) => Promise<T[]>,
  pageSize = 500,
): AsyncGenerator<T[], void, unknown> {
  let cursor: string | null = null;

  while (true) {
    const page = await fetchPage(cursor, pageSize);
    if (page.length === 0) break;

    yield page;

    if (page.length < pageSize) break;
    const last = page[page.length - 1];
    if (!last) break;
    cursor = last.id;
  }
}
