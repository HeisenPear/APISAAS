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

// Codes postgres.js observés en prod quand le pooler Supabase (pgbouncer,
// port 6543) tue une socket sous la lambda gelée — cf. resetDb. Un retry sur
// le MÊME pool retombe systématiquement sur la même erreur tant qu'on ne l'a
// pas recyclé nous-mêmes : c'est ce watchdog qui doit le déclencher, pas
// seulement son propre timeout applicatif (DbTimeoutError).
const DEAD_CONNECTION_CODES = new Set([
  'CONNECTION_DESTROYED',
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  '08P01', // invalid frontend message type — socket pgbouncer corrompue
]);

/**
 * Le code d'erreur postgres.js, où qu'il se cache dans la chaîne des causes.
 *
 * Drizzle enveloppe les erreurs du driver à partir de la 0.44 : `DrizzleQueryError`
 * n'expose PAS `.code`, il déplace l'erreur d'origine dans `.cause`. Lire `.code`
 * à la racine renverrait alors toujours `undefined` — et ce silence serait
 * TOTAL : le typecheck ne voit rien (on caste), aucun banc ne touche la base.
 *
 * Concrètement, ce qui casserait sans ce déroulé : `dbWatchdog` cesserait de
 * recycler le pool sur socket morte, `withDbRetry` cesserait de relancer, et on
 * retomberait sur les 504 de l'incident CONNECTION_DESTROYED. On remonte donc la
 * chaîne dès aujourd'hui — inutile en 0.38, indispensable après.
 */
export function codeErreurBase(err: unknown): string | undefined {
  let courant: unknown = err;
  // Bornée : une chaîne de causes circulaire ferait boucler indéfiniment.
  for (let i = 0; i < 5 && courant; i++) {
    const code = (courant as { code?: unknown }).code;
    if (typeof code === 'string') return code;
    courant = (courant as { cause?: unknown }).cause;
  }
  return undefined;
}

export function isDeadConnectionError(err: unknown): boolean {
  const code = codeErreurBase(err);
  return code !== undefined && DEAD_CONNECTION_CODES.has(code);
}

/**
 * Garde-fou applicatif sur une promesse DB. postgres.js n'a AUCUN timeout de
 * requête intégré : sur socket mort (cf. resetDb), la promesse ne se règle
 * jamais et la fonction tourne jusqu'au timeout Vercel → 504 après 10-30 s.
 * Ici : échec rapide (l'appelant peut servir un fallback/cache) + recyclage
 * du pool pour que la requête suivante reparte sur des sockets neufs — que
 * l'échec vienne de NOTRE timeout (DbTimeoutError) OU d'une connexion morte
 * détectée par postgres.js lui-même (sinon un retry sur le même pool échoue
 * identiquement, cf. incident CONNECTION_DESTROYED admin/overview).
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
    } else if (isDeadConnectionError(err)) {
      console.error(
        `[dbWatchdog] « ${label} » connexion morte (${codeErreurBase(err)}) — pool recyclé`,
      );
      resetDb().catch(() => {});
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * `dbWatchdog` + une relance sur pool fraîchement recyclé, factorisé pour éviter
 * de dupliquer ce bloc dans chaque route (cf. incident CONNECTION_DESTROYED sur
 * /api/dashboard/production et /api/dashboard/upcoming, qui n'avaient aucune
 * protection). `factory` (et pas une promesse déjà lancée) permet de relancer
 * la VRAIE requête, pas une promesse déjà réglée en échec.
 */
export async function withDbRetry<T>(
  factory: () => Promise<T>,
  label: string,
  ms = 8000,
): Promise<T> {
  try {
    return await dbWatchdog(factory(), label, ms);
  } catch (err) {
    if (!(err instanceof DbTimeoutError) && !isDeadConnectionError(err)) throw err;
    return await dbWatchdog(factory(), `${label} (relance)`, ms);
  }
}

// Compat : proxy transparent — `db.select()` etc. fonctionnent sans changer tous les callers
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
