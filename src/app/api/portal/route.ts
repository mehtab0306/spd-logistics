import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let customer = await prisma.customer.findFirst({
      where: { userId: user.userId },
      include: {
        account: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
            },
          },
        },
      },
    });

    // Fallback for admin previewing portal
    if (!customer && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      customer = await prisma.customer.findFirst({
        include: {
          account: {
            include: {
              transactions: {
                orderBy: { date: 'desc' },
              },
            },
          },
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer account not found' }, { status: 404 });
    }

    // Fetch bilties belonging strictly to this customer
    const consignments = await prisma.consignment.findMany({
      where: {
        shipmentStatus: { not: 'DELETED' },
        OR: [
          { customerId: customer.id },
          { senderId: customer.id },
          { receiverId: customer.id },
        ],
      },
      include: {
        driver: true,
        vehicle: true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
        payments: true,
      },
      orderBy: { date: 'desc' },
    });

    const activeShipments = consignments.filter(
      (c) => c.shipmentStatus !== 'DELIVERED' && c.shipmentStatus !== 'CANCELLED'
    );
    const deliveredShipments = consignments.filter(
      (c) => c.shipmentStatus === 'DELIVERED'
    );

    const totalFreight = consignments.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalPaid = consignments.reduce((acc, c) => acc + c.paidAmount, 0);
    const outstandingBalance = consignments.reduce((acc, c) => acc + c.remainingBalance, 0);

    return NextResponse.json({
      success: true,
      data: {
        customer,
        consignments,
        activeShipments,
        deliveredShipments,
        stats: {
          totalShipments: consignments.length,
          activeCount: activeShipments.length,
          deliveredCount: deliveredShipments.length,
          totalFreight,
          totalPaid,
          outstandingBalance,
        },
        ledger: customer.account?.transactions || [],
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
