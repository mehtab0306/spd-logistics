import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let totalCustomers = 0;
    let totalDrivers = 0;
    let totalVehicles = 0;
    let totalConsignments = 0;
    let lahoreConsignments = 0;
    let karachiConsignments = 0;
    let deliveredConsignments = 0;
    let inTransitConsignments = 0;
    let allConsignments: any[] = [];
    let cashBooks: any[] = [];
    let recentPayments: any[] = [];

    try {
      [
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
    } catch (dbErr) {
      console.warn('DB error generating reports (serving 0-state metrics):', dbErr);
    }

    if (isSupabaseConfigured) {
      try {
        const { data: sbBilties } = await supabase.from('bilties').select('*');
        if (Array.isArray(sbBilties) && sbBilties.length > 0) {
          totalConsignments = sbBilties.length;
          lahoreConsignments = sbBilties.filter((b: any) =>
            (b.origin_station || b.origin || '').toLowerCase().includes('lahore')
          ).length;
          karachiConsignments = sbBilties.filter((b: any) =>
            (b.origin_station || b.origin || '').toLowerCase().includes('karachi')
          ).length;
          deliveredConsignments = sbBilties.filter((b: any) =>
            (b.status || '').toUpperCase() === 'DELIVERED'
          ).length;
          inTransitConsignments = sbBilties.filter((b: any) =>
            ['IN_TRANSIT', 'DISPATCHED'].includes((b.status || '').toUpperCase())
          ).length;

          allConsignments = sbBilties.map((b: any) => ({
            totalAmount: Number(b.freight_amount ?? b.total_freight ?? 0),
            paidAmount: Number(b.advance_paid ?? 0),
            remainingBalance: Number(b.remaining_balance ?? Math.max(0, (Number(b.freight_amount ?? b.total_freight ?? 0)) - (Number(b.advance_paid ?? 0)))),
          }));
        }

        const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
        if (typeof custCount === 'number' && custCount > 0) totalCustomers = custCount;

        const { count: drvCount } = await supabase.from('drivers').select('*', { count: 'exact', head: true });
        if (typeof drvCount === 'number' && drvCount > 0) totalDrivers = drvCount;
      } catch (sbErr) {
        console.warn('Supabase reports query notice:', sbErr);
      }
    }

    const totalFreightRevenue = allConsignments && allConsignments.length > 0
      ? allConsignments.reduce((acc, c) => acc + (c.totalAmount || 0), 0)
      : 0;
    const totalCollected = allConsignments && allConsignments.length > 0
      ? allConsignments.reduce((acc, c) => acc + (c.paidAmount || 0), 0)
      : 0;
    const totalOutstanding = allConsignments && allConsignments.length > 0
      ? allConsignments.reduce((acc, c) => acc + (c.remainingBalance || 0), 0)
      : 0;

    const cashBookBalances = cashBooks && cashBooks.length > 0
      ? cashBooks.map((cb) => {
          const cr = cb.transactions ? cb.transactions.reduce((acc: number, t: any) => acc + (t.credit || 0), 0) : 0;
          const dr = cb.transactions ? cb.transactions.reduce((acc: number, t: any) => acc + (t.debit || 0), 0) : 0;
          return {
            id: cb.id,
            name: cb.name,
            city: cb.city || 'Lahore',
            balance: (cb.openingBalance || 0) + cr - dr,
          };
        })
      : [];

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
        recentPayments: recentPayments || [],
      },
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCustomers: 0,
          totalDrivers: 0,
          totalVehicles: 0,
          totalConsignments: 0,
          deliveredConsignments: 0,
          inTransitConsignments: 0,
          totalFreightRevenue: 0,
          totalCollected: 0,
          totalOutstanding: 0,
        },
        warehouseComparison: {
          lahore: { count: 0, percentage: 0 },
          karachi: { count: 0, percentage: 0 },
        },
        cashBooks: [],
        recentPayments: [],
      },
    });
  }
}
