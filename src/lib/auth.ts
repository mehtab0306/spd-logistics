import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'spd-logistics-default-secret';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const COOKIE_NAME = 'spd-auth-token';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  if (!JWT_SECRET || JWT_SECRET.length === 0) {
    throw new Error('JWT_SECRET is missing or invalid');
  }

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token with cryptographic integrity check.
 * Strictly rejects any hardcoded placeholder tokens, expired tokens, or forged signatures.
 */
export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  if (!token || typeof token !== 'string') return null;

  // Explicitly reject hardcoded placeholder tokens
  if (
    token === 'spd-admin-session-token' ||
    token === 'admin-session-token' ||
    token === 'mock-admin-token' ||
    token.startsWith('spd-cust-') ||
    token.startsWith('spd-drv-')
  ) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (!payload || !payload.userId || !payload.role) {
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Set authentication cookie
 */
export async function setAuthCookie(token: string, isSecure = false): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch {
    // Gracefully handle if outside request scope
  }
}

/**
 * Get authentication cookie
 */
export async function getAuthCookie(req?: Request): Promise<string | undefined> {
  // 1. Direct request header inspection
  if (req && typeof req.headers?.get === 'function') {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
      if (match) return decodeURIComponent(match[1]);
    }
  }

  // 2. Next.js cookies() store
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

/**
 * Remove authentication cookie
 */
export async function removeAuthCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Gracefully handle if outside request scope
  }
}

/**
 * Get current authenticated user from cookie or Authorization header
 */
export async function getCurrentUser(req?: Request): Promise<JWTPayload | null> {
  // 1. Check cookies first
  let token = await getAuthCookie(req);

  // 2. Check Authorization header if cookie not present
  if (!token) {
    try {
      let authHeader: string | null = null;
      if (req && typeof req.headers?.get === 'function') {
        authHeader = req.headers.get('authorization');
      } else {
        const headerStore = await headers();
        authHeader = headerStore.get('authorization');
      }
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // Headers not accessible in this context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Central Session & Authorization Validator for Admin APIs
 * 
 * Verifies:
 * 1. Cryptographic token presence, signature, and expiration (401 if missing/invalid/expired)
 * 2. User database existence and active status in Supabase/Prisma (401 if deleted/inactive)
 * 3. Server-side role authorization against allowedRoles (403 if unauthorized)
 */
export type AdminSessionResult =
  | { session: JWTPayload; user: JWTPayload; errorResponse: null; authenticated: true }
  | { session: null; user: null; errorResponse: NextResponse; authenticated: false };

export async function validateAdminSession(
  request?: Request,
  allowedRoles: string[] = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
): Promise<AdminSessionResult> {
  const session = await getCurrentUser(request);

  if (!session || !session.userId) {
    return {
      session: null,
      user: null,
      authenticated: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Valid authentication session required' },
        { status: 401 }
      ),
    };
  }

  // Server-side role authorization check (403 Forbidden)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      return {
        session: null,
        user: null,
        authenticated: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Forbidden: Insufficient privileges for this resource' },
          { status: 403 }
        ),
      };
    }
  }

  // Verify account exists in database and is active
  let isUserValid = false;

  if (isSupabaseConfigured) {
    try {
      if (['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role)) {
        const { data: dbAdmin, error: sbErr } = await supabase
          .from('admin_users')
          .select('id, email')
          .or(`id.eq.${session.userId},email.ilike.${session.email}`)
          .limit(1)
          .maybeSingle();

        if (dbAdmin && !sbErr) {
          isUserValid = true;
        }
      } else if (session.role === 'CUSTOMER') {
        const { data: dbCust } = await supabase
          .from('customers')
          .select('id')
          .eq('id', session.userId)
          .maybeSingle();
        if (dbCust) isUserValid = true;
      } else if (session.role === 'DRIVER') {
        const { data: dbDriver } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', session.userId)
          .maybeSingle();
        if (dbDriver) isUserValid = true;
      }
    } catch (err) {
      console.warn('[validateAdminSession] Supabase verification notice:', err);
    }
  }

  // Redundant check in Prisma SQLite
  if (!isUserValid) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ id: session.userId }, { email: session.email }],
          status: { notIn: ['DELETED', 'INACTIVE', 'SUSPENDED'] },
        },
      });
      if (dbUser) isUserValid = true;
    } catch {}
  }

  if (!isUserValid) {
    return {
      session: null,
      user: null,
      authenticated: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: User account does not exist or has been deactivated' },
        { status: 401 }
      ),
    };
  }

  return { session, user: session, authenticated: true, errorResponse: null };
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  STAFF: 60,
  DRIVER: 40,
  CUSTOMER: 20,
};

/**
 * Check if user role has sufficient privileges
 */
export function hasMinimumRole(
  userRole: string,
  minimumRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= requiredLevel;
}
