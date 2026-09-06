import { vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// CEINTURE DE SÉCURITÉ — aucune connexion réelle, jamais.
//
// Ce dépôt n'a PAS de base de test. Le `.env` de référence porte la base de
// PRODUCTION (le .gitignore le documente : même un `.env.test` n'en différait
// que par le bloc Stripe). `scripts/garde-base.ts` protège `db:push` et
// `db:seed` — rien ne protégeait les tests.
//
// Vitest ne charge pas `.env` de lui-même (il n'injecte que les variables
// `VITE_*` de Vite), mais un `DATABASE_URL` exporté dans le shell suffirait.
// On coupe donc aux DEUX bouts : la variable est effacée, et le pilote
// postgres refuse de s'instancier. Un test qui atteindrait une vraie requête
// échoue bruyamment au lieu d'écrire chez un client.
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('postgres', () => ({
  default: () => {
    throw new Error(
      '[tests] Connexion Postgres réelle interdite. Utilisez le double de base ' +
        '(tests/helpers/fauxDb.ts) — voir l’en-tête de tests/setup.ts.',
    );
  },
}));

delete process.env.DATABASE_URL;

// ─────────────────────────────────────────────
// Global mocks for Nuxt / Supabase modules
// ─────────────────────────────────────────────

// Mock #supabase/server — used by server API routes
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@apigo.fr',
    app_metadata: {},
    user_metadata: { nom: 'Dupont', prenom: 'Jean' },
    aud: 'authenticated',
    created_at: '2025-01-01T00:00:00.000Z',
  }),
  serverSupabaseClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  serverSupabaseServiceRole: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock #imports (Nuxt auto-imports)
vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn().mockReturnValue({
    supabaseServiceKey: 'fake-service-key',
    stripeSecretKey: 'fake-stripe-key',
    stripeWebhookSecret: 'fake-webhook-secret',
    public: {
      baseUrl: 'http://localhost:3000',
      supabaseUrl: 'https://fake.supabase.co',
      supabaseKey: 'fake-anon-key',
    },
  }),
}));
