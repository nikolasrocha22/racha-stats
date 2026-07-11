import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback dummy client if credentials aren't set yet (to avoid crashing the app on startup)
const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('replace-with-your');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: async () => ({ data: { session: null } }),
        getUser: () => null,
        signOut: async () => {},
        signInWithPassword: async () => { throw new Error('Supabase não configurado localmente. Adicione as chaves no arquivo .env.'); },
        signUp: async () => { throw new Error('Supabase não configurado localmente. Adicione as chaves no arquivo .env.'); }
      },
      from: () => ({
        select: () => ({ order: () => ({ limit: () => ({ then: (cb) => cb({ data: [], error: null }) }) }), then: (cb) => cb({ data: [], error: null }) }),
        insert: () => ({ then: (cb) => cb({ data: null, error: new Error('Supabase não configurado.') }) }),
        update: () => ({ then: (cb) => cb({ data: null, error: new Error('Supabase não configurado.') }) }),
        delete: () => ({ then: (cb) => cb({ data: null, error: new Error('Supabase não configurado.') }) }),
      })
    };

export const SUPABASE_CONFIGURED = isConfigured;
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'nikolas@example.com';
