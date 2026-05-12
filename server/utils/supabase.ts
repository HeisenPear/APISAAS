import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Client admin lazy — créé à la première utilisation pour éviter un crash au démarrage
// si SUPABASE_SERVICE_KEY n'est pas encore défini (ex: build CI sans vars)
let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_KEY ?? '';

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      message: 'Configuration serveur manquante — SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis',
    });
  }

  _adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _adminClient;
}

// Proxy transparent — se comporte comme un SupabaseClient normal
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    return (getAdminClient() as unknown as Record<string, unknown>)[prop];
  },
});
