import { vi } from 'vitest';

// ─────────────────────────────────────────────
// Global mocks for Nuxt / Supabase modules
// ─────────────────────────────────────────────

// Mock #supabase/server — used by server API routes
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@apiculture360.fr',
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
