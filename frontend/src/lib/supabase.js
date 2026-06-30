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
