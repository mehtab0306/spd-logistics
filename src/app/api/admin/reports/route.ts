import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const [
      totalCustomers,
      totalDrivers,
      totalVehicles,
      totalConsignments,
      lahoreConsignments,
      karachiConsignments,
      deliveredConsignments,
      inTransitConsignments,
      allConsignments,
      cashBooks,
      recentPayments,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.driver.count(),
      prisma.vehicle.count(),
      prisma.consignment.count(),
      prisma.consignment.count({ where: { warehouse: { contains: 'LAHORE' } } }),
      prisma.consignment.count({ where: { warehouse: { contains: 'KARACHI' } } }),
      prisma.consignment.count({ where: { shipmentStatus: 'DELIVERED' } }),
      prisma.consignment.count({
        where: {
          shipmentStatus: { in: ['IN_TRANSIT', 'DRIVER_ON_THE_WAY', 'OUT_FOR_DELIVERY', 'PICKED_UP'] },
        },
      }),
      prisma.consignment.findMany({
        select: {
          id: true,
          biltyNumber: true,
          totalAmount: true,
          paidAmount: true,
          remainingBalance: true,
          warehouse: true,
          date: true,
        },
      }),
      prisma.cashBook.findMany({
        include: {
          transactions: {
            select: { debit: true, credit: true },
          },
        },
      }),
      prisma.payment.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
    ]);

    const totalFreightRevenue = allConsignments.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalCollected = allConsignments.reduce((acc, c) => acc + c.paidAmount, 0);
    const totalOutstanding = allConsignments.reduce((acc, c) => acc + c.remainingBalance, 0);

    const cashBookBalances = cashBooks.map((cb) => {
      const cr = cb.transactions.reduce((acc, t) => acc + t.credit, 0);
      const dr = cb.transactions.reduce((acc, t) => acc + t.debit, 0);
      return {
        id: cb.id,
        name: cb.name,
        city: cb.city,
        balance: cb.openingBalance + cr - dr,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalDrivers,
          totalVehicles,
          totalConsignments,
          deliveredConsignments,
          inTransitConsignments,
          totalFreightRevenue,
          totalCollected,
          totalOutstanding,
        },
        warehouseComparison: {
          lahore: {
            count: lahoreConsignments,
            percentage: totalConsignments > 0 ? Math.round((lahoreConsignments / totalConsignments) * 100) : 0,
          },
          karachi: {
            count: karachiConsignments,
            percentage: totalConsignments > 0 ? Math.round((karachiConsignments / totalConsignments) * 100) : 0,
          },
        },
        cashBooks: cashBookBalances,
        recentPayments,
      },
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
