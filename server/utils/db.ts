import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';

// Initialisation lazy — évite le throw au module-load pendant le prerender Vercel
let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not configured');
  _client = postgres(connectionString, {
    // Vercel serverless + Supabase pooler : un pool restreint par instance
    // (chaque lambda chaude garde ses connexions), assez large pour les
    // Promise.all internes (dashboard ~12 requetes paralleles).
    max: Number(process.env.DB_POOL_MAX ?? 4),
    // Libere vite les connexions d'une lambda idle au lieu de saturer le pooler
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
    // Requis derriere pgbouncer en transaction mode (port 6543 Supabase) :
    // les prepared statements nommes ne survivent pas au multiplexage.
    prepare: false,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

/**
 * Détruit le pool de connexions courant ; le prochain accès à `db` en crée un
 * neuf. Raison d'être : en serverless, la lambda est GELÉE entre deux
 * invocations — les sockets TCP du pool meurent silencieusement pendant le gel
 * (timeout NAT/pooler) sans que postgres.js le sache. Au réveil, une requête
 * écrite sur un socket mort n'obtient JAMAIS de réponse : l'instance est
 * « empoisonnée » et chaque appel finit en 504 jusqu'au recyclage de la
 * lambda. Recycler le pool nous-mêmes guérit l'instance immédiatement.
 */
export async function resetDb(): Promise<void> {
  const client = _client;
  _client = undefined;
  _db = undefined;
  if (client) {
    try {
      // timeout: 0 → force-close les sockets ; les requêtes pendantes rejettent
      await client.end({ timeout: 0 });
    } catch {
      /* le pool était déjà inutilisable */
    }
  }
}

export class DbTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`[dbWatchdog] « ${label} » sans réponse après ${ms} ms — pool recyclé`);
    this.name = 'DbTimeoutError';
  }
}

/**
 * Garde-fou applicatif sur une promesse DB. postgres.js n'a AUCUN timeout de
 * requête intégré : sur socket mort (cf. resetDb), la promesse ne se règle
 * jamais et la fonction tourne jusqu'au timeout Vercel → 504 après 10-30 s.
 * Ici : échec rapide (l'appelant peut servir un fallback/cache) + recyclage
 * du pool pour que la requête suivante reparte sur des sockets neufs.
 */
export async function dbWatchdog<T>(promise: Promise<T>, label: string, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new DbTimeoutError(label, ms)), ms);
      }),
    ]);
  } catch (err) {
    if (err instanceof DbTimeoutError) {
      console.error(err.message);
      resetDb().catch(() => {});
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Compat : proxy transparent — `db.select()` etc. fonctionnent sans changer tous les callers
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
