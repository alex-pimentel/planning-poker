import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
    },
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

describe('ensureAnonAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    mockClient.auth.getSession.mockReset();
    mockClient.auth.signInAnonymously.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reuses an existing session instead of creating a new anonymous user', async () => {
    mockClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const { ensureAnonAuth } = await import('../src/lib/supabase');
    const user = await ensureAnonAuth();

    expect(user).toEqual({ id: 'user-1' });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates an anonymous user when there is no session', async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { session: { user: { id: 'anon-1' } } },
      error: null,
    });

    const { ensureAnonAuth } = await import('../src/lib/supabase');
    const user = await ensureAnonAuth();

    expect(user).toEqual({ id: 'anon-1' });
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
});
