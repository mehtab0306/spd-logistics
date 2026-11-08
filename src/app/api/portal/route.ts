import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCentralCollection } from '@/lib/server-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please log in to view portal' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedCustomerId = String(searchParams.get('customerId') || (user as any)?.customerId || '').trim();

    let customer: any = null;

    // 1. Resolve Customer by ID
    if (requestedCustomerId) {
      try {
        customer = await prisma.customer.findUnique({
          where: { id: requestedCustomerId },
          include: {
            account: {
              include: {
                transactions: { orderBy: { date: 'desc' } },
              },
            },
          },
        });
      } catch {}

      if (!customer && isSupabaseConfigured) {
        try {
          const { data: sbCust } = await supabase
            .from('customers')
            .select('*')
            .eq('id', requestedCustomerId)
            .maybeSingle();
          if (sbCust) {
            customer = {
              id: sbCust.id,
              name: sbCust.name,
              companyName: sbCust.name,
              email: sbCust.email,
              phone: sbCust.phone,
              city: sbCust.city || 'Karachi',
              address: sbCust.address || '',
              status: 'ACTIVE',
            };
          }
        } catch {}
      }

      if (!customer) {
        const centralCustomers = getCentralCollection('customers') || [];
        customer = centralCustomers.find((c: any) => c.id === requestedCustomerId);
      }
    }

    // 2. Resolve Customer by User ID or Email
    if (!customer && user.userId) {
      try {
        customer = await prisma.customer.findFirst({
          where: { userId: user.userId },
          include: {
            account: {
              include: {
                transactions: { orderBy: { date: 'desc' } },
              },
            },
          },
        });
      } catch {}
    }

    if (!customer && user.email) {
      const cleanEmail = user.email.toLowerCase().trim();
      try {
        customer = await prisma.customer.findFirst({
          where: { email: cleanEmail },
          include: {
            account: {
              include: {
                transactions: { orderBy: { date: 'desc' } },
              },
            },
          },
        });
      } catch {}

      if (!customer && isSupabaseConfigured) {
        try {
          const { data: sbCust } = await supabase
            .from('customers')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (sbCust) {
            customer = {
              id: sbCust.id,
              name: sbCust.name,
              companyName: sbCust.name,
              email: sbCust.email,
              phone: sbCust.phone,
              city: sbCust.city || 'Karachi',
              address: sbCust.address || '',
              status: 'ACTIVE',
            };
          }
        } catch {}
      }

      if (!customer) {
        const centralCustomers = getCentralCollection('customers') || [];
        customer = centralCustomers.find(
          (c: any) => (c.email || '').toLowerCase().trim() === cleanEmail
        );
      }
    }

    // Admin preview fallback: if admin is viewing portal without specific customerId, return first available customer or empty profile
    if (!customer && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      try {
        customer = await prisma.customer.findFirst({
          include: {
            account: {
              include: {
                transactions: { orderBy: { date: 'desc' } },
              },
            },
          },
        });
      } catch {}

      if (!customer && isSupabaseConfigured) {
        try {
          const { data: sbCust } = await supabase.from('customers').select('*').limit(1).maybeSingle();
          if (sbCust) {
            customer = {
              id: sbCust.id,
              name: sbCust.name,
              companyName: sbCust.name,
              email: sbCust.email,
              phone: sbCust.phone,
              city: sbCust.city || 'Karachi',
              address: sbCust.address || '',
              status: 'ACTIVE',
            };
          }
        } catch {}
      }
    }

    if (!customer) {
      // Customer profile strictly not found — return real empty profile without fake seeded data
      return NextResponse.json({
        success: true,
        data: {
          customer: {
            id: user.userId || 'guest',
            name: user.name || 'Valued Client',
            email: user.email || '',
            companyName: user.name || 'Valued Client',
            status: 'ACTIVE',
          },
          consignments: [],
          activeShipments: [],
          deliveredShipments: [],
          stats: {
            totalShipments: 0,
            activeCount: 0,
            deliveredCount: 0,
            totalFreight: 0,
            totalPaid: 0,
            outstandingBalance: 0,
          },
          ledger: [],
        },
      });
    }

    // 3. Fetch consignments strictly belonging to this genuine customer
    const customerId = customer.id;
    const customerName = (customer.name || customer.companyName || '').toLowerCase().trim();

    let rawConsignments: any[] = [];
    try {
      rawConsignments = await prisma.consignment.findMany({
        where: {
          shipmentStatus: { not: 'DELETED' },
          OR: [
            { customerId: customerId },
            { senderId: customerId },
            { receiverId: customerId },
          ],
        },
        include: {
          driver: true,
          vehicle: true,
          trackingEvents: { orderBy: { timestamp: 'desc' } },
          payments: true,
        },
        orderBy: { date: 'desc' },
      });
    } catch {}

    // Also fetch from Supabase bilties table
    if (isSupabaseConfigured) {
      try {
        const { data: sbBilties } = await supabase
          .from('bilties')
          .select('*')
          .order('created_at', { ascending: false });

        if (Array.isArray(sbBilties)) {
          for (const r of sbBilties) {
            if (r.status === 'DELETED') continue;
            const bCustId = String(r.customer_id || '');
            const bSender = String(r.sender_name || '').toLowerCase().trim();
            const bReceiver = String(r.receiver_name || '').toLowerCase().trim();

            const isMatch =
              (bCustId && bCustId === customerId) ||
              (customerName && (bSender.includes(customerName) || bReceiver.includes(customerName)));

            if (isMatch) {
              rawConsignments.push({
                id: r.id || r.bilty_number,
                biltyNumber: r.bilty_number || r.id,
                trackingId: r.bilty_number || r.id,
                customerId: r.customer_id,
                senderName: r.sender_name || 'Shipper',
                receiverName: r.receiver_name || 'Consignee',
                receiverPhone: r.receiver_phone || '',
                origin: r.origin_station || r.origin || 'Karachi',
                destination: r.destination_station || r.destination || 'Lahore',
                warehouse: r.origin_station || 'Karachi',
                packageDetails: r.item_description || r.cargo_details || 'General Commercial Merchandise',
                quantity: Number(r.packages_count) || 1,
                weight: Number(r.weight) || 0,
                freight: Number(r.freight_amount ?? r.total_freight ?? 0),
                totalAmount: Number(r.freight_amount ?? r.total_freight ?? 0),
                paidAmount: Number(r.advance_paid ?? 0),
                remainingBalance: Number(r.remaining_balance ?? 0),
                paymentStatus: (Number(r.remaining_balance ?? 0) <= 0) ? 'PAID' : (Number(r.advance_paid ?? 0) > 0) ? 'PARTIALLY_PAID' : 'UNPAID',
                shipmentStatus: (r.status || 'BOOKED').toUpperCase(),
                vehicleNumber: r.vehicle_number,
                driverName: r.driver_name,
                createdAt: r.created_at,
                date: r.created_at,
              });
            }
          }
        }
      } catch {}
    }

    // Also check central store
    const centralBilties = getCentralCollection('bilties') || [];
    for (const b of centralBilties) {
      if (b.shipmentStatus === 'DELETED') continue;
      const bCustId = String(b.customerId || '');
      const bSender = String(b.senderName || '').toLowerCase().trim();
      const bReceiver = String(b.receiverName || '').toLowerCase().trim();

      const isMatch =
        (bCustId && bCustId === customerId) ||
        (customerName && (bSender.includes(customerName) || bReceiver.includes(customerName)));

      if (isMatch) {
        rawConsignments.push(b);
      }
    }

    // Deduplicate consignments by biltyNumber / id
    const dedupedConsignments: any[] = [];
    const seenIds = new Set<string>();
    for (const c of rawConsignments) {
      const key = String(c.biltyNumber || c.id || '');
      if (!key || seenIds.has(key)) continue;
      seenIds.add(key);
      dedupedConsignments.push(c);
    }

    // Sort by date descending
    dedupedConsignments.sort(
      (a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
    );

    const activeShipments = dedupedConsignments.filter(
      (c) => c.shipmentStatus !== 'DELIVERED' && c.shipmentStatus !== 'CANCELLED'
    );
    const deliveredShipments = dedupedConsignments.filter(
      (c) => c.shipmentStatus === 'DELIVERED'
    );

    const totalFreight = dedupedConsignments.reduce((sum, c) => sum + (Number(c.totalAmount || c.freight) || 0), 0);
    const totalPaid = dedupedConsignments.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);
    const outstandingBalance = dedupedConsignments.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);

    // Build ledger entries from genuine consignments and account transactions
    const ledger = customer.account?.transactions || dedupedConsignments.map((c) => ({
      id: `tx-${c.id}`,
      date: c.date || c.createdAt,
      reference: c.biltyNumber,
      description: `Bilty Freight Charges - ${c.origin} to ${c.destination}`,
      type: 'DEBIT',
      debit: Number(c.totalAmount || c.freight) || 0,
      credit: Number(c.paidAmount) || 0,
      balance: Number(c.remainingBalance) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        customer,
        consignments: dedupedConsignments,
        activeShipments,
        deliveredShipments,
        stats: {
          totalShipments: dedupedConsignments.length,
          activeCount: activeShipments.length,
          deliveredCount: deliveredShipments.length,
          totalFreight,
          totalPaid,
          outstandingBalance,
        },
        ledger,
      },
    });
  } catch (error: any) {
    console.error('Error fetching portal data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Self-service password changes are restricted for customer accounts
    if (action === 'CHANGE_PASSWORD') {
      return NextResponse.json(
        {
          success: false,
          error: 'Password modifications are managed exclusively by SPD Administration. Please contact administration for credential updates.',
        },
        { status: 403 }
      );
    }

    // Update Profile Action
    const { phone, whatsapp, address, city } = body;
    const customer = await prisma.customer.findFirst({ where: { userId: user.userId } });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: phone !== undefined ? phone : customer.phone,
        whatsapp: whatsapp !== undefined ? whatsapp : customer.whatsapp,
        address: address !== undefined ? address : customer.address,
        city: city !== undefined ? city : customer.city,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating customer portal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update' },
      { status: 500 }
    );
  }
}
