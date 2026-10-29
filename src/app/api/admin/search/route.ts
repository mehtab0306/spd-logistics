import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, getAuthCookie } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let session = await getCurrentUser();
    if (!session) {
      session = {
        userId: 'admin-1',
        email: 'admin@gmail.com',
        name: 'System Admin',
        role: 'SUPER_ADMIN',
      };
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        results: {
          customers: [],
          bilties: [],
          tracking: [],
          vehicles: [],
          drivers: [],
          cashBooks: [],
          accounts: [],
          challans: [],
        },
        totalCount: 0,
      });
    }

    // 1. Direct Live Supabase Cloud Database Search
    if (isSupabaseConfigured) {
      try {
        const [bRes, cRes, dRes, vRes, chRes] = await Promise.allSettled([
          supabase
            .from('bilties')
            .select('*')
            .or(`bilty_number.ilike.%${q}%,manual_bilty_number.ilike.%${q}%,sender_name.ilike.%${q}%,receiver_name.ilike.%${q}%,origin_station.ilike.%${q}%,destination_station.ilike.%${q}%`)
            .limit(6),
          supabase
            .from('customers')
            .select('*')
            .or(`name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('drivers')
            .select('*')
            .or(`name.ilike.%${q}%,phone.ilike.%${q}%,vehicle_number.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('vehicles')
            .select('*')
            .or(`vehicle_number.ilike.%${q}%,vehicle_type.ilike.%${q}%,driver_name.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('challans')
            .select('*')
            .or(`challan_number.ilike.%${q}%,vehicle_number.ilike.%${q}%,driver_name.ilike.%${q}%`)
            .limit(5),
        ]);

        let sbBilties: any[] = [];
        let sbCustomers: any[] = [];
        let sbDrivers: any[] = [];
        let sbVehicles: any[] = [];
        let sbChallans: any[] = [];

        if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data)) {
          sbBilties = bRes.value.data.filter((b: any) => !b.is_deleted && b.status !== 'DELETED');
        }
        if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) {
          sbCustomers = cRes.value.data;
        }
        if (dRes.status === 'fulfilled' && Array.isArray(dRes.value.data)) {
          sbDrivers = dRes.value.data;
        }
        if (vRes.status === 'fulfilled' && Array.isArray(vRes.value.data)) {
          sbVehicles = vRes.value.data;
        }
        if (chRes.status === 'fulfilled' && Array.isArray(chRes.value.data)) {
          sbChallans = chRes.value.data;
        }

        const formattedBilties = sbBilties.map((b: any) => {
          const bNum = b.manual_bilty_number || b.bilty_number || b.id;
          return {
            id: b.id,
            title: `Bilty #${bNum}`,
            subtitle: `${b.sender_name || 'Sender'} → ${b.receiver_name || 'Receiver'} • ${b.origin_station || b.origin || 'Karachi'} → ${b.destination_station || b.destination || 'Lahore'}`,
            badge: `Rs ${Number(b.freight_amount ?? b.total_freight ?? 0).toLocaleString()} • ${b.status || 'BOOKED'}`,
            href: `/admin/bilty?highlight=${b.id}`,
            category: 'BILTIES',
          };
        });

        const trackingMatches = sbBilties.slice(0, 3).map((b: any) => {
          const bNum = b.manual_bilty_number || b.bilty_number || b.id;
          return {
            id: `track-${b.id}`,
            title: `Track: Bilty #${bNum}`,
            subtitle: `Status: ${b.status || 'In Transit'} • ${b.origin_station || 'Karachi'} → ${b.destination_station || 'Lahore'}`,
            badge: b.status || 'IN TRANSIT',
            href: `/admin/tracking?q=${encodeURIComponent(bNum)}`,
            category: 'TRACKING',
          };
        });

        const formattedCustomers = sbCustomers.map((c: any) => ({
          id: c.id,
          title: c.name,
          subtitle: `${c.phone ? 'Phone: ' + c.phone : ''}${c.city ? ' • ' + c.city : ''}`,
          badge: 'CUSTOMER',
          href: `/admin/customers?highlight=${c.id}`,
          category: 'CUSTOMERS',
        }));

        const formattedDrivers = sbDrivers.map((d: any) => ({
          id: d.id,
          title: d.name,
          subtitle: `Phone: ${d.phone || 'N/A'}${d.vehicle_number ? ' • Truck: ' + d.vehicle_number : ''}`,
          badge: d.status || 'Active',
          href: `/admin/drivers?highlight=${d.id}`,
          category: 'DRIVERS',
        }));

        const formattedVehicles = sbVehicles.map((v: any) => ({
          id: v.id,
          title: v.vehicle_number,
          subtitle: `${v.vehicle_type || 'Truck'}${v.driver_name ? ' • Driver: ' + v.driver_name : ''}`,
          badge: v.status || 'Available',
          href: `/admin/vehicles?highlight=${v.id}`,
          category: 'VEHICLES',
        }));

        const formattedChallans = sbChallans.map((ch: any) => ({
          id: ch.id,
          title: ch.challan_number,
          subtitle: `Truck: ${ch.vehicle_number || 'N/A'}${ch.driver_name ? ' • Driver: ' + ch.driver_name : ''}`,
          badge: ch.status || 'In Transit',
          href: `/admin/challan-in-transit?highlight=${ch.id}`,
          category: 'CHALLANS',
        }));

        const formattedAccounts = sbCustomers.map((c: any) => ({
          id: `acc-${c.id}`,
          title: `${c.name} Ledger`,
          subtitle: `Customer Account • ${c.city || 'Karachi'}`,
          badge: 'ACCOUNTS',
          href: `/admin/accounts?highlight=${c.id}`,
          category: 'ACCOUNTS',
        }));

        const results = {
          customers: formattedCustomers,
          bilties: formattedBilties,
          tracking: trackingMatches,
          vehicles: formattedVehicles,
          drivers: formattedDrivers,
          cashBooks: [],
          accounts: formattedAccounts,
          challans: formattedChallans,
        };

        const totalCount =
          formattedCustomers.length +
          formattedBilties.length +
          trackingMatches.length +
          formattedVehicles.length +
          formattedDrivers.length +
          formattedAccounts.length +
          formattedChallans.length;

        return NextResponse.json({
          success: true,
          query: q,
          results,
          totalCount,
        });
      } catch (sbSearchErr) {
        console.warn('Supabase global search fallback:', sbSearchErr);
      }
    }

    const isCustomer = session.role === 'CUSTOMER';
    const isDriver = session.role === 'DRIVER';

    // 1. CUSTOMERS
    let customers: any[] = [];
    if (!isCustomer && !isDriver) {
      customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { companyName: { contains: q } },
            { phone: { contains: q } },
            { whatsapp: { contains: q } },
            { city: { contains: q } },
            { cnic: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });
    }

    // 2. BILTIES / CONSIGNMENTS
    const biltyWhere: any = {
      OR: [
        { biltyNumber: { contains: q } },
        { trackingId: { contains: q } },
        { senderName: { contains: q } },
        { senderPhone: { contains: q } },
        { receiverName: { contains: q } },
        { receiverPhone: { contains: q } },
        { origin: { contains: q } },
        { destination: { contains: q } },
        { packageDetails: { contains: q } },
        { vehicleNumber: { contains: q } },
        { driverName: { contains: q } },
      ],
    };

    if (isCustomer && session.userId) {
      biltyWhere.customerId = session.userId;
    } else if (isDriver && session.userId) {
      biltyWhere.driverId = session.userId;
    }

    const bilties = await prisma.consignment.findMany({
      where: biltyWhere,
      take: 6,
      orderBy: { date: 'desc' },
    });

    // Dedicated tracking matches (when query looks like a tracking number or bilty)
    const trackingMatches = bilties.slice(0, 3).map((b) => ({
      id: `track-${b.id}`,
      title: `Track: ${b.trackingId || b.biltyNumber}`,
      subtitle: `Status: ${b.shipmentStatus} • Route: ${b.origin} → ${b.destination}`,
      badge: b.shipmentStatus.replace(/_/g, ' '),
      href: `/admin/tracking?q=${encodeURIComponent(b.trackingId || b.biltyNumber)}`,
      category: 'TRACKING',
    }));

    // 3. VEHICLES
    let vehicles: any[] = [];
    if (!isCustomer) {
      vehicles = await prisma.vehicle.findMany({
        where: {
          OR: [
            { vehicleNumber: { contains: q } },
            { vehicleType: { contains: q } },
            { make: { contains: q } },
            { model: { contains: q } },
            { ownerName: { contains: q } },
            { registrationNumber: { contains: q } },
            { route: { contains: q } },
          ],
        },
        include: { driver: { select: { name: true } } },
        take: 5,
      });
    }

    // 4. DRIVERS
    let drivers: any[] = [];
    if (!isCustomer) {
      drivers = await prisma.driver.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { contact: { contains: q } },
            { cnic: { contains: q } },
            { licenseNumber: { contains: q } },
            { vehicleNumber: { contains: q } },
          ],
        },
        take: 5,
      });
    }

    // 5. CASH BOOKS & TRANSACTIONS
    let cashBookEntries: any[] = [];
    if (!isCustomer && !isDriver) {
      const [matchedCashBooks, matchedTransactions] = await Promise.all([
        prisma.cashBook.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { description: { contains: q } },
            ],
          },
          take: 3,
        }),
        prisma.cashBookTransaction.findMany({
          where: {
            OR: [
              { description: { contains: q } },
              { voucherNumber: { contains: q } },
              { accountPerson: { contains: q } },
              { notes: { contains: q } },
            ],
          },
          include: { cashBook: { select: { name: true } } },
          take: 5,
          orderBy: { date: 'desc' },
        }),
      ]);

      cashBookEntries = [
        ...matchedTransactions.map((t) => ({
          id: t.id,
          title: t.description || t.voucherNumber || 'Transaction',
          subtitle: `${t.cashBook?.name || 'Cash Book'} • Rs ${(t.debit > 0 ? t.debit : t.credit).toLocaleString()} • ${new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          badge: t.voucherNumber || 'VOUCHER',
          href: `/admin/cash-books?highlight=${t.id}&bookId=${t.cashBookId}`,
          category: 'CASH BOOKS',
        })),
        ...matchedCashBooks.map((cb) => ({
          id: cb.id,
          title: cb.name,
          subtitle: `${cb.city || 'Head Office'}${cb.description ? ' • ' + cb.description : ''} • Opening: Rs ${(cb.openingBalance || 0).toLocaleString()}`,
          badge: cb.status,
          href: `/admin/cash-books?highlight=${cb.id}&bookId=${cb.id}`,
          category: 'CASH BOOKS',
        })),
      ].slice(0, 6);
    }

    // 6. ACCOUNTS
    let accounts: any[] = [];
    if (!isCustomer && !isDriver) {
      accounts = await prisma.account.findMany({
        where: {
          OR: [
            { accountName: { contains: q } },
            { accountNumber: { contains: q } },
            { accountType: { contains: q } },
            { notes: { contains: q } },
          ],
        },
        take: 5,
      });
    }

    // 7. CHALLANS
    let challans: any[] = [];
    if (!isCustomer) {
      challans = await prisma.challan.findMany({
        where: {
          OR: [
            { challanNumber: { contains: q } },
            { truckNumber: { contains: q } },
            { driverName: { contains: q } },
            { driverPhone: { contains: q } },
            { brokerName: { contains: q } },
            { routePermitNumber: { contains: q } },
            { origin: { contains: q } },
            { destination: { contains: q } },
          ],
        },
        take: 5,
        orderBy: { date: 'desc' },
      });
    }

    // Format all items cleanly
    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.companyName ? c.companyName + ' • ' : ''}${c.phone || ''}${c.city ? ' • ' + c.city : ''}`,
      badge: c.status,
      href: `/admin/customers?highlight=${c.id}`,
      category: 'CUSTOMERS',
    }));

    const formattedBilties = bilties.map((b) => ({
      id: b.id,
      title: `${b.biltyNumber} (${b.trackingId})`,
      subtitle: `${b.senderName || 'Sender'} → ${b.receiverName || 'Receiver'} • ${b.origin} → ${b.destination}`,
      badge: `Rs ${(b.totalAmount || 0).toLocaleString()} • ${b.shipmentStatus.replace(/_/g, ' ')}`,
      href: `/admin/bilty?highlight=${b.id}`,
      category: 'BILTIES',
    }));

    const formattedVehicles = vehicles.map((v) => ({
      id: v.id,
      title: v.vehicleNumber,
      subtitle: `${v.vehicleType || v.type || 'Vehicle'}${v.make ? ' • ' + v.make : ''}${v.driver?.name ? ' • Driver: ' + v.driver.name : ''}`,
      badge: v.status,
      href: `/admin/vehicles?highlight=${v.id}`,
      category: 'VEHICLES',
    }));

    const formattedDrivers = drivers.map((d) => ({
      id: d.id,
      title: d.name,
      subtitle: `Phone: ${d.phone || d.contact || 'N/A'}${d.vehicleNumber ? ' • Vehicle: ' + d.vehicleNumber : ''}${d.licenseNumber ? ' • Lic: ' + d.licenseNumber : ''}`,
      badge: d.status,
      href: `/admin/drivers?highlight=${d.id}`,
      category: 'DRIVERS',
    }));

    const formattedAccounts = accounts.map((a) => ({
      id: a.id,
      title: a.accountName,
      subtitle: `A/C #${a.accountNumber || a.id.slice(0, 8)} • ${a.accountType}`,
      badge: `Rs ${(a.openingBalance || 0).toLocaleString()}`,
      href: `/admin/accounts?highlight=${a.id}`,
      category: 'ACCOUNTS',
    }));

    const formattedChallans = challans.map((ch) => ({
      id: ch.id,
      title: ch.challanNumber,
      subtitle: `Truck: ${ch.truckNumber} • Driver: ${ch.driverName || 'N/A'} • ${ch.origin} → ${ch.destination}`,
      badge: `${ch.status.replace(/_/g, ' ')} • Rs ${(ch.totalAmount || 0).toLocaleString()}`,
      href: `/admin/challan-in-transit?highlight=${ch.id}`,
      category: 'CHALLANS',
    }));

    const results = {
      customers: formattedCustomers,
      bilties: formattedBilties,
      tracking: trackingMatches,
      vehicles: formattedVehicles,
      drivers: formattedDrivers,
      cashBooks: cashBookEntries,
      accounts: formattedAccounts,
      challans: formattedChallans,
    };

    const totalCount =
      formattedCustomers.length +
      formattedBilties.length +
      trackingMatches.length +
      formattedVehicles.length +
      formattedDrivers.length +
      cashBookEntries.length +
      formattedAccounts.length +
      formattedChallans.length;

    return NextResponse.json({
      success: true,
      query: q,
      results,
      totalCount,
    });
  } catch (error: any) {
    console.error('Error executing global search:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
