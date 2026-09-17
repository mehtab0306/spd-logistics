import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search } },
        { vehicleType: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
        { currentLocation: { contains: search } },
        { route: { contains: search } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, phone: true, status: true },
        },
        consignments: {
          include: {
            sender: { select: { id: true, name: true, companyName: true, phone: true } },
            receiver: { select: { id: true, name: true, companyName: true, phone: true } },
            driver: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: { consignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vehicleNumber,
      registrationNumber,
      vehicleType,
      make,
      model,
      year,
      capacity,
      ownerName,
      currentLocation,
      route,
      insuranceExpiry,
      fitnessExpiry,
      driverId,
      status = 'AVAILABLE',
      notes,
    } = body;

    if (!vehicleNumber) {
      return NextResponse.json(
        { success: false, error: 'Vehicle number / plate is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.vehicle.findUnique({
      where: { vehicleNumber },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Vehicle with number "${vehicleNumber}" already exists` },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber,
        registrationNumber: registrationNumber || null,
        vehicleType: vehicleType || 'Heavy Truck',
        make: make || null,
        model: model || null,
        year: year ? parseInt(year) : null,
        capacity: capacity ? parseFloat(capacity) : null,
        ownerName: ownerName || 'SPD Logistics Fleet',
        currentLocation: currentLocation || 'Lahore Hub',
        route: route || 'Lahore - Karachi Express',
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        driverId: driverId || null,
        status,
        notes: notes || null,
      },
      include: { driver: true },
    });

    // Also update driver's vehicleNumber if driver assigned
    if (driverId) {
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          assignedVehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
        },
      });
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Vehicle ID is required' }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        vehicleNumber: updateData.vehicleNumber,
        registrationNumber: updateData.registrationNumber,
        vehicleType: updateData.vehicleType,
        make: updateData.make,
        model: updateData.model,
        year: updateData.year ? parseInt(updateData.year) : null,
        capacity: updateData.capacity ? parseFloat(updateData.capacity) : null,
        ownerName: updateData.ownerName,
        currentLocation: updateData.currentLocation,
        route: updateData.route,
        insuranceExpiry: updateData.insuranceExpiry ? new Date(updateData.insuranceExpiry) : null,
        fitnessExpiry: updateData.fitnessExpiry ? new Date(updateData.fitnessExpiry) : null,
        driverId: updateData.driverId !== undefined ? updateData.driverId : undefined,
        status: updateData.status,
        notes: updateData.notes,
      },
      include: { driver: true },
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}
