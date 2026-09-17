import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, createToken } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, avatar } = body;

    // Validate email format and uniqueness if email is changed
    let cleanEmail: string | undefined = undefined;
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
      // Check if email is taken by another user
      const existing = await prisma.user.findFirst({
        where: {
          email: trimmed,
          id: { not: session.userId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'This email address is already in use by another account' },
          { status: 400 }
        );
      }
      cleanEmail = trimmed;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: cleanEmail,
        username: cleanEmail ? null : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        avatar: avatar !== undefined ? (avatar === '' ? null : avatar) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });

    // If login email was updated, refresh the auth cookie with new email payload
    if (cleanEmail && cleanEmail !== session.email) {
      const token = await createToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      });
      const isHttps = request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https:');
      response.cookies.set('spd-auth-token', token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
