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

// Admin-level roles
const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route needs protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get the auth token from cookie or Authorization header
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  // Check all cookies with COOKIE_NAME to ensure valid session if multiple cookies exist
  const allCookieValues = request.cookies.getAll(COOKIE_NAME).map((c) => c.value);
  if (bearerToken) {
    allCookieValues.unshift(bearerToken);
  }

  if (allCookieValues.length === 0) {
    // Redirect to appropriate login page
    const loginUrl = (pathname.startsWith('/portal') || pathname.startsWith('/customer'))
      ? '/customer-login'
      : pathname.startsWith('/driver')
      ? '/driver-login'
      : '/admin-login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  let verifiedPayload: any = null;
  for (const candidateToken of allCookieValues) {
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
    const loginUrl = (pathname.startsWith('/portal') || pathname.startsWith('/customer'))
      ? '/customer-login'
      : pathname.startsWith('/driver')
      ? '/driver-login'
      : '/admin-login';
    const redirectResponse = NextResponse.redirect(new URL(loginUrl, request.url));
    redirectResponse.cookies.delete(COOKIE_NAME);
    return redirectResponse;
  }

  const userRole = verifiedPayload.role as string;

  // Check admin route access
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isAdminRoute && !adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  // Check customer route access
  const isCustomerRoute = customerRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isCustomerRoute && userRole !== 'CUSTOMER' && !adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/customer-login', request.url));
  }

  // Check driver route access
  const isDriverRoute = driverRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isDriverRoute && userRole !== 'DRIVER' && !adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/driver-login', request.url));
  }

  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', verifiedPayload.userId as string);
  requestHeaders.set('x-user-role', userRole);
  requestHeaders.set('x-user-email', verifiedPayload.email as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*', '/portal/:path*', '/driver/:path*'],
};
