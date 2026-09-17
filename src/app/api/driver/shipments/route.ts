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

    // Find driver profile linked to this user
    let driver = await prisma.driver.findFirst({
      where: { userId: user.userId },
      include: {
        vehicles: true,
      },
    });

    // If logged in as admin inspecting driver portal, allow fallback to first available driver
    if (!driver && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      driver = await prisma.driver.findFirst({
        include: { vehicles: true },
      });
    }

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    // Fetch assigned shipments with full receiver, sender, and vehicle details
    const shipments = await prisma.consignment.findMany({
      where: {
        driverId: driver.id,
        shipmentStatus: { not: 'DELETED' },
      },
      include: {
        sender: true,
        receiver: true,
        vehicle: true,
        driver: true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    const activeShipments = shipments.filter(
      (s) => s.shipmentStatus !== 'DELIVERED' && s.shipmentStatus !== 'CANCELLED'
    );
    const completedShipments = shipments.filter(
      (s) => s.shipmentStatus === 'DELIVERED'
    );

    // Get Admin contact for Driver-to-Admin actions
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { name: true, email: true, phone: true },
    });
    const adminPhoneSetting = await prisma.setting.findFirst({ where: { key: 'companyPhone' } });
    const adminPhone = adminPhoneSetting?.value || adminUser?.phone || '0325 2024433';

    return NextResponse.json({
      success: true,
      data: {
        driver,
        adminContact: {
          name: adminUser?.name || 'SPD Central Dispatch',
          phone: adminPhone,
        },
        activeShipments,
        completedShipments,
        totalTrips: shipments.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching driver shipments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch driver shipments' },
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
    const { consignmentId, shipmentStatus, location, notes, receivedBy, deliveryDate, deliveryTime } = body;

    if (!consignmentId || !shipmentStatus) {
      return NextResponse.json(
        { success: false, error: 'Consignment ID and status are required' },
        { status: 400 }
      );
    }

    const consignment = await prisma.consignment.findUnique({
      where: { id: consignmentId },
      include: { driver: true, vehicle: true },
    });

    if (!consignment) {
      return NextResponse.json({ success: false, error: 'Consignment not found' }, { status: 404 });
    }

    // Strict Driver Isolation Check: Drivers cannot access or update other drivers' consignments
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({ where: { userId: user.userId } });
      if (!driver || consignment.driverId !== driver.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: You can only update shipments assigned to your driver account' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {
      shipmentStatus,
    };

    const now = new Date();
    if (shipmentStatus === 'DELIVERED') {
      updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : now;
      updateData.deliveryTime = deliveryTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      updateData.receivedBy = receivedBy || consignment.receiverName || 'Consignee Customer';
      updateData.receiverConfirmation = true;
      updateData.deliveryNotes = notes || null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.consignment.update({
        where: { id: consignmentId },
        data: updateData,
      });

      // Add permanent tracking event with automatic server date & time
      await tx.trackingEvent.create({
        data: {
          consignmentId,
          status: shipmentStatus,
          location: location || `${consignment.destination} Transit Hub`,
          description: notes
            ? `${notes} (Updated by ${consignment.driverName || 'Driver'})`
            : shipmentStatus === 'DELIVERED'
            ? `Successfully delivered to ${updateData.receivedBy} by driver ${consignment.driverName || 'Assigned Driver'} via vehicle ${consignment.vehicleNumber || 'Fleet Vehicle'}.`
            : `Shipment status updated to ${shipmentStatus.replace(/_/g, ' ')} by driver.`,
          timestamp: now,
        },
      });

      // If delivered, update driver and vehicle status to AVAILABLE
      if (shipmentStatus === 'DELIVERED') {
        if (res.driverId) {
          await tx.driver.update({
            where: { id: res.driverId },
            data: { status: 'AVAILABLE' },
          });
        }
        if (res.vehicleId) {
          await tx.vehicle.update({
            where: { id: res.vehicleId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      return res;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating shipment status by driver:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
