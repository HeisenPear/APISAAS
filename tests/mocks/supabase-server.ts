import { vi } from 'vitest';
import type { H3Event } from 'h3';

// ─────────────────────────────────────────────
// Mock: #supabase/server
// ─────────────────────────────────────────────

interface FakeUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

const fakeUser: FakeUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@apiculture360.fr',
  app_metadata: {},
  user_metadata: { nom: 'Dupont', prenom: 'Jean' },
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
};

/**
 * Returns a fake authenticated user.
 * Override the return value in individual tests with:
 *   vi.mocked(serverSupabaseUser).mockResolvedValueOnce(...)
 */
export const serverSupabaseUser = vi.fn(
  (_event: H3Event): Promise<FakeUser> => Promise.resolve(fakeUser),
);

/** Chainable fake Supabase client */
function createFakeClient() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
}

export const serverSupabaseClient = vi.fn((_event: H3Event) => Promise.resolve(createFakeClient()));

export const serverSupabaseServiceRole = vi.fn((_event: H3Event) =>
  Promise.resolve(createFakeClient()),
);
