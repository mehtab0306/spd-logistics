import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          status: true,
        },
      });
    } catch {
      // Graceful fallback to session data
    }

    return NextResponse.json({
      success: true,
      data: dbUser || {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        status: 'ACTIVE',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
}
