import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, createToken, hashPassword, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const lowerIdentifier = identifier.toLowerCase();
    const cleanPassword = (password || '').trim();

    // Direct hardcoded admin credentials check to completely bypass database dependency
    if ((lowerIdentifier === 'admin@gmail.com' || lowerIdentifier === 'admin') && cleanPassword === 'admin') {
      const token = 'spd-admin-session-token';
      const adminData = {
        token,
        id: 'admin-1',
        email: 'admin@gmail.com',
        username: 'admin',
        name: 'System Admin',
        role: 'SUPER_ADMIN',
        redirectUrl: '/admin',
      };

      const response = NextResponse.json({
        success: true,
        redirectUrl: '/admin',
        user: {
          id: 'admin-1',
          email: 'admin@gmail.com',
          name: 'System Admin',
          role: 'SUPER_ADMIN',
        },
        data: adminData,
      });

      const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1');
      const isHttps = !isLocalhost && (request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https:'));

      response.cookies.set('spd-auth-token', token, {
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // Direct hardcoded customer credentials check strictly configured to customer@gmail.com / admin
    if ((lowerIdentifier === 'customer@gmail.com' || lowerIdentifier === 'customer') && cleanPassword === 'admin') {
      const token = 'spd-customer-session-token';
      const customerData = {
        token,
        id: 'cust-user-1',
        email: 'customer@gmail.com',
        username: 'customer',
        name: 'Standard Customer',
        role: 'CUSTOMER',
        redirectUrl: '/customer/dashboard',
        customer: {
          id: 'c-customer-1',
          name: 'Standard Customer',
          email: 'customer@gmail.com',
          companyName: 'Prime Logistics & Trade',
          phone: '0300 1234567',
        },
      };

      const response = NextResponse.json({
        success: true,
        redirectUrl: '/customer/dashboard',
        user: {
          id: 'cust-user-1',
          email: 'customer@gmail.com',
          name: 'Standard Customer',
          role: 'CUSTOMER',
        },
        data: customerData,
      });

      const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1');
      const isHttps = !isLocalhost && (request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https:'));

      response.cookies.set('spd-auth-token', token, {
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // Find user by email, username, or phone
    let user = null;
    try {
      user = await prisma.user.findFirst({
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
    } catch (dbFindErr) {
      console.warn('Database user search failed (falling back):', dbFindErr);
    }

    // Production bootstrap: If database has 0 admin accounts and official credentials are used, initialize SUPER_ADMIN
    if (!user && (lowerIdentifier === 'admin@gmail.com' || lowerIdentifier === 'admin')) {
      const adminCount = await prisma.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      });
      if (adminCount === 0) {
        const hashedPassword = await hashPassword('admin');
        user = await prisma.user.create({
          data: {
            email: 'admin@gmail.com',
            username: 'admin',
            name: 'System Admin',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            password: hashedPassword,
          },
          include: {
            customer: true,
            driver: true,
          },
        });
      }
    }

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

    // Verify password (check raw and trimmed password to avoid accidental whitespace lockouts)
    let isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid && typeof password === 'string' && password.trim() !== password) {
      isPasswordValid = await comparePassword(password.trim(), user.password);
    }
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
    let redirectUrl = '/admin';
    if (user.role === 'CUSTOMER') {
      redirectUrl = '/customer/dashboard';
    } else if (user.role === 'DRIVER') {
      redirectUrl = '/driver/dashboard';
    }

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
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

    // Detect if connection is genuinely HTTPS and not localhost
    const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1');
    const isHttps = !isLocalhost && (request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https:'));

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
      { success: false, error: 'Invalid credentials. Please verify your email and password.' },
      { status: 401 }
    );
  }
}
