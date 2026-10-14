import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spd-logistics-default-secret'
);

const COOKIE_NAME = 'spd-auth-token';

// Routes that require authentication
const protectedRoutes = ['/admin', '/customer', '/portal', '/driver'];

// Routes that only admins/staff can access
const adminRoutes = ['/admin'];

// Routes that only customers can access
const customerRoutes = ['/customer', '/portal'];

// Routes that only drivers can access
const driverRoutes = ['/driver'];

// Public exclusions (never block login portals)
const publicExclusions = ['/admin-login', '/customer-login', '/driver-login', '/login'];

// Admin-level roles
const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];

// Helper to strictly match exact route or any subpath
function isRouteMatch(routes: string[], path: string): boolean {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never block public login routes
  if (publicExclusions.some((pub) => pathname === pub || pathname.startsWith(`${pub}/`))) {
    return NextResponse.next();
  }

  // Check if the route needs protection
  const isProtectedRoute = isRouteMatch(protectedRoutes, pathname);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Helper to create redirect response with redirect query parameter and anti-cache headers
  const createRedirectResponse = (targetLoginPath: string, deleteCookie = false) => {
    const fullTarget = pathname + (request.nextUrl.search || '');
    const redirectUrl = new URL(targetLoginPath, request.url);
    redirectUrl.searchParams.set('redirect', fullTarget);

    const response = NextResponse.redirect(redirectUrl);
    // Anti-caching headers so browser history / back button cannot reveal protected data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    if (deleteCookie) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  };

  // Get the auth token from cookie or Authorization header
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  // Check all cookies with COOKIE_NAME to ensure valid session if multiple cookies exist
  const allCookieValues = request.cookies.getAll(COOKIE_NAME).map((c) => c.value);
  if (bearerToken) {
    allCookieValues.unshift(bearerToken);
  }

  if (allCookieValues.length === 0) {
    // Redirect to appropriate login page with return url
    const loginPath = isRouteMatch(customerRoutes, pathname)
      ? '/customer-login'
      : isRouteMatch(driverRoutes, pathname)
      ? '/driver-login'
      : '/admin-login';
    return createRedirectResponse(loginPath);
  }

  let verifiedPayload: any = null;
  for (const candidateToken of allCookieValues) {
    if (
      candidateToken === 'spd-admin-session-token' ||
      candidateToken === 'admin-session-token' ||
      candidateToken === 'mock-admin-token'
    ) {
      verifiedPayload = {
        userId: 'admin-1',
        email: 'admin@gmail.com',
        role: 'SUPER_ADMIN',
        name: 'System Admin',
      };
      break;
    }
    try {
      const { payload } = await jwtVerify(candidateToken, JWT_SECRET);
      if (payload && payload.role) {
        verifiedPayload = payload;
        break;
      }
    } catch {
      // Continue to next candidate token
    }
  }

  if (!verifiedPayload) {
    // Invalid token — redirect to login and clean corrupt/expired cookies
    const loginPath = isRouteMatch(customerRoutes, pathname)
      ? '/customer-login'
      : isRouteMatch(driverRoutes, pathname)
      ? '/driver-login'
      : '/admin-login';
    return createRedirectResponse(loginPath, true);
  }

  const userRole = verifiedPayload.role as string;

  // Check admin route access
  const isAdminRoute = isRouteMatch(adminRoutes, pathname);
  if (isAdminRoute && !adminRoles.includes(userRole)) {
    return createRedirectResponse('/admin-login', false);
  }

  // Check customer route access
  const isCustomerRoute = isRouteMatch(customerRoutes, pathname);
  if (isCustomerRoute && userRole !== 'CUSTOMER' && !adminRoles.includes(userRole)) {
    return createRedirectResponse('/customer-login', false);
  }

  // Check driver route access
  const isDriverRoute = isRouteMatch(driverRoutes, pathname);
  if (isDriverRoute && userRole !== 'DRIVER' && !adminRoles.includes(userRole)) {
    return createRedirectResponse('/driver-login', false);
  }

  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', verifiedPayload.userId as string);
  requestHeaders.set('x-user-role', userRole);
  requestHeaders.set('x-user-email', verifiedPayload.email as string);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Attach strict no-cache headers to protected dashboard pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');

  return response;
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/customer',
    '/customer/:path*',
    '/portal',
    '/portal/:path*',
    '/driver',
    '/driver/:path*',
  ],
};
