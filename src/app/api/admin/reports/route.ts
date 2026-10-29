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
    let totalFreightRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let allConsignments: any[] = [];
    let cashBooks: any[] = [];
    let recentPayments: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const [bRes, cRes, dRes, vRes] = await Promise.allSettled([
          supabase
            .from('bilties')
            .select('*')
            .or('is_deleted.is.null,is_deleted.eq.false')
            .neq('status', 'DELETED'),
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('drivers').select('*', { count: 'exact', head: true }),
          supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        ]);

        if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data)) {
          const activeBilties = bRes.value.data.filter(
            (b: any) => !b.is_deleted && b.status !== 'DELETED'
          );
          totalConsignments = activeBilties.length;
          lahoreConsignments = activeBilties.filter((b: any) =>
            (b.origin_station || b.origin || '').toLowerCase().includes('lahore')
          ).length;
          karachiConsignments = activeBilties.filter((b: any) =>
            (b.origin_station || b.origin || '').toLowerCase().includes('karachi')
          ).length;
          deliveredConsignments = activeBilties.filter((b: any) =>
            (b.status || '').toUpperCase() === 'DELIVERED'
          ).length;
          inTransitConsignments = activeBilties.filter((b: any) =>
            ['IN_TRANSIT', 'DISPATCHED'].includes((b.status || '').toUpperCase())
          ).length;

          totalFreightRevenue = activeBilties.reduce(
            (acc: number, b: any) => acc + (Number(b.freight_amount ?? b.total_freight ?? 0) || 0),
            0
          );
          totalCollected = activeBilties.reduce(
            (acc: number, b: any) => acc + (Number(b.advance_paid ?? 0) || 0),
            0
          );
          totalOutstanding = activeBilties.reduce((acc: number, b: any) => {
            const freight = Number(b.freight_amount ?? b.total_freight ?? 0) || 0;
            const paid = Number(b.advance_paid ?? 0) || 0;
            const rem =
              b.remaining_balance !== undefined && b.remaining_balance !== null
                ? Number(b.remaining_balance)
                : Math.max(0, freight - paid);
            return acc + (isNaN(rem) ? 0 : rem);
          }, 0);
        }

        if (cRes.status === 'fulfilled' && typeof cRes.value.count === 'number') {
          totalCustomers = cRes.value.count;
        }
        if (dRes.status === 'fulfilled' && typeof dRes.value.count === 'number') {
          totalDrivers = dRes.value.count;
        }
        if (vRes.status === 'fulfilled' && typeof vRes.value.count === 'number') {
          totalVehicles = vRes.value.count;
        }
      } catch (sbErr) {
        console.warn('Supabase reports query notice:', sbErr);
      }
    } else {
      try {
        const [cCount, dCount, vCount, bCount, lCount, kCount, delCount, transCount, consignments] =
          await Promise.all([
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
                totalAmount: true,
                paidAmount: true,
                remainingBalance: true,
              },
            }),
          ]);

        totalCustomers = cCount;
        totalDrivers = dCount;
        totalVehicles = vCount;
        totalConsignments = bCount;
        lahoreConsignments = lCount;
        karachiConsignments = kCount;
        deliveredConsignments = delCount;
        inTransitConsignments = transCount;

        totalFreightRevenue = consignments.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
        totalCollected = consignments.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
        totalOutstanding = consignments.reduce((acc, c) => acc + (c.remainingBalance || 0), 0);
      } catch (dbErr) {
        console.warn('DB error generating reports (serving 0-state metrics):', dbErr);
      }
    }

    try {
      const cbData = await prisma.cashBook.findMany({
        include: {
          transactions: {
            select: { debit: true, credit: true },
          },
        },
      });
      if (Array.isArray(cbData) && cbData.length > 0) {
        cashBooks = cbData.map((cb) => {
          const cr = cb.transactions ? cb.transactions.reduce((acc: number, t: any) => acc + (t.credit || 0), 0) : 0;
          const dr = cb.transactions ? cb.transactions.reduce((acc: number, t: any) => acc + (t.debit || 0), 0) : 0;
          return {
            id: cb.id,
            name: cb.name,
            city: cb.city || 'Lahore',
            balance: (cb.openingBalance || 0) + cr - dr,
          };
        });
      }
    } catch {}

    try {
      const pmts = await prisma.payment.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      });
      if (Array.isArray(pmts)) {
        recentPayments = pmts;
      }
    } catch {}

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
        cashBooks,
        recentPayments,
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
