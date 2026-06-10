import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';

// Initialisation lazy — évite le throw au module-load pendant le prerender Vercel
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not configured');
  _db = drizzle(
    postgres(connectionString, {
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
    }),
    { schema },
  );
  return _db;
}

// Compat : proxy transparent — `db.select()` etc. fonctionnent sans changer tous les callers
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
