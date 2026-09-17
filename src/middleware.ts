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
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

  if (!token) {
    // Redirect to appropriate login page
    const loginUrl = (pathname.startsWith('/portal') || pathname.startsWith('/customer'))
      ? '/customer-login'
      : pathname.startsWith('/driver')
      ? '/driver-login'
      : '/admin-login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

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
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-email', payload.email as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Invalid token — redirect to login
    const loginUrl = (pathname.startsWith('/portal') || pathname.startsWith('/customer'))
      ? '/customer-login'
      : pathname.startsWith('/driver')
      ? '/driver-login'
      : '/admin-login';
    const response = NextResponse.redirect(new URL(loginUrl, request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*', '/portal/:path*', '/driver/:path*'],
};
