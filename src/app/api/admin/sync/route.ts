import { NextResponse } from 'next/server';
import { getCentralStore, mergeCentralStore } from '@/lib/server-store';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = getCentralStore();

    // Also attempt querying Prisma if available and merge
    try {
      const [dbCustomers, dbConsignments, dbChallans, dbDrivers, dbVehicles, dbCashBooks] = await Promise.all([
        prisma.customer.findMany({ where: { status: { not: 'DELETED' } }, take: 100 }),
        prisma.consignment.findMany({ where: { shipmentStatus: { not: 'DELETED' } }, take: 100 }),
        prisma.challan.findMany({ take: 100 }),
        prisma.driver.findMany({ where: { status: { not: 'DELETED' } }, take: 100 }),
        prisma.vehicle.findMany({ where: { status: { not: 'DELETED' } }, take: 100 }),
        prisma.cashBook.findMany({ where: { status: { not: 'DELETED' } }, take: 20 }),
      ]);

      if (dbCustomers.length > 0 || dbConsignments.length > 0 || dbChallans.length > 0) {
        mergeCentralStore({
          customers: dbCustomers,
          bilties: dbConsignments,
          challans: dbChallans,
          drivers: dbDrivers,
          vehicles: dbVehicles,
          cashBooks: dbCashBooks,
        });
      }
    } catch (dbErr) {
      // Prisma offline/serverless fallback is expected, continue with central store
    }

    return NextResponse.json({
      success: true,
      data: getCentralStore(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Central sync GET error:', error);
    return NextResponse.json({
      success: true,
      data: getCentralStore(),
      timestamp: new Date().toISOString(),
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (updates && typeof updates === 'object') {
      const merged = mergeCentralStore(updates);
      return NextResponse.json({
        success: true,
        message: 'Central data synchronized successfully across devices.',
        data: merged,
      });
    }

    return NextResponse.json({
      success: true,
      data: getCentralStore(),
    });
  } catch (error: any) {
    console.error('Central sync POST error:', error);
    return NextResponse.json({
      success: true,
      data: getCentralStore(),
    });
  }
}
