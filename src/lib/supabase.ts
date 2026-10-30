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

/**
 * Validates whether a given string is a valid PostgreSQL UUID.
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Generates a standard RFC4122 v4 UUID.
 * Never generates numeric timestamps or non-UUID integer strings.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CustomerPayload {
  id?: string;
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

export async function safeUpsertCustomer(
  payload: CustomerPayload
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  const validId = isValidUUID(payload.id) ? payload.id!.trim() : undefined;

  // Schema-sanitized payload: name, phone (optional), city, address, current_balance, avatar_url
  const fullPayload: any = {
    name: payload.name.trim(),
    phone: payload.phone ? payload.phone.trim() : null,
    email: payload.email ? payload.email.trim() : null,
    address: payload.address ? payload.address.trim() : null,
    city: payload.city ? payload.city.trim() : 'Karachi',
    opening_balance: payload.opening_balance ?? 0,
    current_balance: payload.current_balance ?? payload.opening_balance ?? 0,
    avatar_url: payload.avatar_url || null,
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  // Attempt 1: If valid UUID provided, attempt upsert/update
  if (validId) {
    fullPayload.id = validId;
    const { data, error } = await supabase.from('customers').upsert([fullPayload]).select().maybeSingle();
    if (!error) return { success: true, data };
    if (!error.message?.includes('uuid') && !error.message?.includes('schema cache') && !error.message?.includes('column')) {
      return { success: false, error };
    }
  }

  // Attempt 2: Insert without ID so Supabase defaults to gen_random_uuid()
  const payloadNoId = { ...fullPayload };
  delete payloadNoId.id;

  const { data: insData, error: insError } = await supabase
    .from('customers')
    .insert([payloadNoId])
    .select()
    .maybeSingle();

  if (!insError) return { success: true, data: insData };

  // Attempt 3: Schema cache mismatch fallback - strip optional balance / avatar columns
  const errMsg = insError.message || '';
  if (errMsg.includes('current_balance') || errMsg.includes('opening_balance') || errMsg.includes('avatar_url') || errMsg.includes('column')) {
    const corePayload: any = {
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : null,
      city: payload.city ? payload.city.trim() : 'Karachi',
      address: payload.address ? payload.address.trim() : null,
    };
    if (payload.email) corePayload.email = payload.email.trim();

    const { data: coreData, error: coreError } = await supabase
      .from('customers')
      .insert([corePayload])
      .select()
      .maybeSingle();

    if (!coreError) return { success: true, data: coreData };
    return { success: false, error: coreError };
  }

  return { success: false, error: insError };
}

export interface DriverPayload {
  id?: string;
  name: string;
  phone?: string | null;
  cnic?: string | null;
  license_number?: string | null;
  vehicle_number?: string | null;
  status?: string;
  avatar_url?: string | null;
  created_at?: string;
}

export async function safeUpsertDriver(
  payload: DriverPayload
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  const validId = isValidUUID(payload.id) ? payload.id!.trim() : undefined;

  // Schema-sanitized payload: name, phone (optional), cnic, license_number, vehicle_number, avatar_url, status
  const fullPayload: any = {
    name: payload.name.trim(),
    phone: payload.phone ? payload.phone.trim() : null,
    cnic: payload.cnic ? payload.cnic.trim() : null,
    license_number: payload.license_number ? payload.license_number.trim() : null,
    vehicle_number: payload.vehicle_number ? payload.vehicle_number.trim() : null,
    status: payload.status || 'Active',
    avatar_url: payload.avatar_url || null,
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  // Attempt 1: If valid UUID provided, attempt upsert
  if (validId) {
    fullPayload.id = validId;
    const { data, error } = await supabase.from('drivers').upsert([fullPayload]).select().maybeSingle();
    if (!error) return { success: true, data };
    if (!error.message?.includes('uuid') && !error.message?.includes('schema cache') && !error.message?.includes('column')) {
      return { success: false, error };
    }
  }

  // Attempt 2: Insert without ID so Supabase defaults to gen_random_uuid()
  const payloadNoId = { ...fullPayload };
  delete payloadNoId.id;

  const { data: insData, error: insError } = await supabase
    .from('drivers')
    .insert([payloadNoId])
    .select()
    .maybeSingle();

  if (!insError) return { success: true, data: insData };

  // Attempt 3: Schema fallback for core columns
  const errMsg = insError.message || '';
  if (errMsg.includes('avatar_url') || errMsg.includes('vehicle_number') || errMsg.includes('column')) {
    const corePayload: any = {
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : null,
      cnic: payload.cnic ? payload.cnic.trim() : null,
      license_number: payload.license_number ? payload.license_number.trim() : null,
      status: payload.status || 'Active',
    };

    const { data: coreData, error: coreError } = await supabase
      .from('drivers')
      .insert([corePayload])
      .select()
      .maybeSingle();

    if (!coreError) return { success: true, data: coreData };
    return { success: false, error: coreError };
  }

  return { success: false, error: insError };
}

export interface VehiclePayload {
  id?: string;
  vehicle_number: string;
  vehicle_type?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  status?: string | null;
  created_at?: string;
}

export async function safeUpsertVehicle(
  payload: VehiclePayload
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  const validId = isValidUUID(payload.id) ? payload.id!.trim() : undefined;

  // Schema-sanitized payload: vehicle_number, vehicle_type, driver_name, driver_phone, status
  const fullPayload: any = {
    vehicle_number: payload.vehicle_number.trim().toUpperCase(),
    vehicle_type: payload.vehicle_type || 'Heavy Truck (22-Wheeler)',
    driver_name: payload.driver_name ? payload.driver_name.trim() : null,
    driver_phone: payload.driver_phone ? payload.driver_phone.trim() : null,
    status: payload.status || 'AVAILABLE',
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  if (validId) {
    fullPayload.id = validId;
    const { data, error } = await supabase.from('vehicles').upsert([fullPayload]).select().maybeSingle();
    if (!error) return { success: true, data };
    if (!error.message?.includes('uuid') && !error.message?.includes('schema cache')) {
      return { success: false, error };
    }
  }

  const payloadNoId = { ...fullPayload };
  delete payloadNoId.id;

  const { data: insData, error: insError } = await supabase
    .from('vehicles')
    .insert([payloadNoId])
    .select()
    .maybeSingle();

  if (!insError) return { success: true, data: insData };
  return { success: false, error: insError };
}

export interface BrokerPayload {
  id?: string;
  name: string;
  phone?: string | null;
  company_name?: string | null;
  city?: string | null;
  balance?: number;
  avatar_url?: string | null;
  status?: string | null;
  created_at?: string;
}

export async function safeUpsertBroker(
  payload: BrokerPayload
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') };

  const validId = isValidUUID(payload.id) ? payload.id!.trim() : undefined;

  // Schema-sanitized payload: name, phone (optional), company_name, city, balance, avatar_url
  const fullPayload: any = {
    name: payload.name.trim(),
    phone: payload.phone ? payload.phone.trim() : null,
    company_name: payload.company_name ? payload.company_name.trim() : payload.name.trim(),
    city: payload.city ? payload.city.trim() : 'Karachi',
    balance: payload.balance ?? 0,
    avatar_url: payload.avatar_url || null,
    status: payload.status || 'ACTIVE',
  };
  if (payload.created_at) fullPayload.created_at = payload.created_at;

  if (validId) {
    fullPayload.id = validId;
    const { data, error } = await supabase.from('brokers').upsert([fullPayload]).select().maybeSingle();
    if (!error) return { success: true, data };
    if (!error.message?.includes('uuid') && !error.message?.includes('schema cache')) {
      return { success: false, error };
    }
  }

  const payloadNoId = { ...fullPayload };
  delete payloadNoId.id;

  const { data: insData, error: insError } = await supabase
    .from('brokers')
    .insert([payloadNoId])
    .select()
    .maybeSingle();

  if (!insError) return { success: true, data: insData };
  return { success: false, error: insError };
}

export default supabase;
