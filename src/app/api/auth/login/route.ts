import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const identifier = (email || body.identifier || '').trim();

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Identifier (email/phone) and password are required' },
        { status: 400 }
      );
    }

    // Find user by email, username, or phone
    const lowerIdentifier = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: lowerIdentifier },
          { username: identifier },
          { username: lowerIdentifier },
          { phone: identifier },
        ],
      },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check status and ensure deleted/deactivated accounts cannot log in
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Account is inactive, suspended, or has been deleted.' },
        { status: 403 }
      );
    }
    if (user.customer && user.customer.status === 'DELETED') {
      return NextResponse.json(
        { success: false, error: 'Customer account has been deactivated or removed.' },
        { status: 403 }
      );
    }
    if (user.driver && user.driver.status === 'DELETED') {
      return NextResponse.json(
        { success: false, error: 'Driver account has been deactivated or removed.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your username and password.' },
        { status: 401 }
      );
    }

    // Role-specific access check if requested from a specific login portal
    const requestedRole = (body.role || '').toUpperCase();
    if (requestedRole === 'ADMIN' && !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Please sign in through the Customer or Driver portal.' },
        { status: 403 }
      );
    }
    if (requestedRole === 'CUSTOMER' && user.role !== 'CUSTOMER' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Customer portal requires a customer account.' },
        { status: 403 }
      );
    }
    if (requestedRole === 'DRIVER' && user.role !== 'DRIVER' && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Driver portal requires a registered driver account.' },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id,
      driverId: user.driver?.id,
    });

    // Update last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          module: 'AUTH',
          details: JSON.stringify({ email: user.email, role: user.role }),
        },
      });
    } catch (dbErr) {
      console.warn('Non-fatal: could not update lastLoginAt/auditLog:', dbErr);
    }

    // Compute role-based destination redirect
    let redirectUrl = '/admin/dashboard';
    if (user.role === 'CUSTOMER') {
      redirectUrl = '/customer/dashboard';
    } else if (user.role === 'DRIVER') {
      redirectUrl = '/driver/dashboard';
    }

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        redirectUrl,
        customer: user.customer,
        driver: user.driver,
      },
    });

    // Detect if connection is HTTPS. On HTTP (development/local/port-forward), secure must be false
    // so modern browsers will not drop or block the cookie over HTTP.
    const isHttps = request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https:');

    // Set cookie directly on response
    response.cookies.set('spd-auth-token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
