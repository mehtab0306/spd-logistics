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

export interface CustomerPayload {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  opening_balance?: number;
  current_balance?: number;
  avatar_url?: string | null;
  created_at?: string;
}

export async function safeUpsertCustomer(payload: CustomerPayload): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  // Attempt 1: Full structured payload
  const fullPayload: any = {
    id: payload.id,
    name: payload.name,
    phone: payload.phone || null,
    email: payload.email || null,
    address: payload.address || null,
    city: payload.city || 'Karachi',
    opening_balance: payload.opening_balance ?? 0,
    current_balance: payload.current_balance ?? payload.opening_balance ?? 0,
    avatar_url: payload.avatar_url || null,
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  const { error: fullError } = await supabase.from('customers').upsert([fullPayload]);
  if (!fullError) return { success: true };

  // Attempt 2: If schema cache complains about current_balance or opening_balance
  const errMsg = fullError.message || '';
  if (errMsg.includes('current_balance') || errMsg.includes('opening_balance') || errMsg.includes('schema cache') || errMsg.includes('column')) {
    const sanitizedPayload: any = {
      id: payload.id,
      name: payload.name,
      phone: payload.phone || null,
      address: payload.address || null,
      city: payload.city || 'Karachi',
      avatar_url: payload.avatar_url || null,
    };
    if (payload.email) sanitizedPayload.email = payload.email;

    const { error: sanError } = await supabase.from('customers').upsert([sanitizedPayload]);
    if (!sanError) return { success: true };

    // Attempt 3: If avatar_url also not in schema, try absolute minimal
    if (sanError.message?.includes('avatar_url') || sanError.message?.includes('column')) {
      const corePayload: any = {
        id: payload.id,
        name: payload.name,
        phone: payload.phone || null,
        city: payload.city || 'Karachi',
      };
      const { error: coreError } = await supabase.from('customers').upsert([corePayload]);
      if (!coreError) return { success: true };
      return { success: false, error: coreError };
    }
    return { success: false, error: sanError };
  }

  return { success: false, error: fullError };
}

export interface DriverPayload {
  id: string;
  name: string;
  phone?: string | null;
  cnic?: string | null;
  license_number?: string | null;
  vehicle_number?: string | null;
  status?: string;
  avatar_url?: string | null;
  created_at?: string;
}

export async function safeUpsertDriver(payload: DriverPayload): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  const fullPayload: any = {
    id: payload.id,
    name: payload.name,
    phone: payload.phone || null,
    cnic: payload.cnic || null,
    license_number: payload.license_number || null,
    vehicle_number: payload.vehicle_number || null,
    status: payload.status || 'Active',
    avatar_url: payload.avatar_url || null,
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  const { error: fullError } = await supabase.from('drivers').upsert([fullPayload]);
  if (!fullError) return { success: true };

  const errMsg = fullError.message || '';
  if (errMsg.includes('avatar_url') || errMsg.includes('vehicle_number') || errMsg.includes('schema cache') || errMsg.includes('column')) {
    const corePayload: any = {
      id: payload.id,
      name: payload.name,
      phone: payload.phone || null,
      cnic: payload.cnic || null,
      license_number: payload.license_number || null,
      status: payload.status || 'Active',
    };
    const { error: coreError } = await supabase.from('drivers').upsert([corePayload]);
    if (!coreError) return { success: true };
    return { success: false, error: coreError };
  }

  return { success: false, error: fullError };
}

export default supabase;
