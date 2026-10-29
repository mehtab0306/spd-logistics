import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !url.includes('APNA_SUPABASE')
    );
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidUrl(rawUrl) &&
  !!rawKey &&
  !rawKey.includes('APNA_ANON');

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

// Client with zero-cache enforcement (cache: 'no-store') for real-time mobile & desktop sync
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        cache: 'no-store',
      });
    },
  },
});

export const supabaseClient = supabase;
export default supabase;
