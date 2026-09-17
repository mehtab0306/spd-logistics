import { NextResponse } from 'next/server';
import { removeAuthCookie, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'LOGOUT',
          module: 'AUTH',
          details: JSON.stringify({ email: user.email }),
        },
      });
    }

    try {
      await removeAuthCookie();
    } catch {
      // ignore if outside request scope
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('spd-auth-token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    try {
      await removeAuthCookie();
    } catch {
      // ignore
    }
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.delete('spd-auth-token');
    return response;
  }
}
