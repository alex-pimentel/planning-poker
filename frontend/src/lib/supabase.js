import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Copy frontend/.env.example to frontend/.env.local and fill in your Supabase project credentials.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

let anonUser = null;

export async function ensureAnonAuth() {
  if (anonUser) return anonUser;

  // Reuse the persisted session. Calling signInAnonymously() on every join
  // creates a brand-new user, which changes auth.uid() and silently breaks
  // mediator-only operations (RLS) for rooms created by the previous session.
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    anonUser = sessionData.session.user;
    return anonUser;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Anonymous auth failed:', error.message);
    return null;
  }
  anonUser = session.user;
  return anonUser;
}
