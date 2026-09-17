import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createSystemNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      where.status = { not: 'DELETED' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { contact: { contains: search } },
        { cnic: { contains: search } },
        { licenseNumber: { contains: search } },
        { vehicleNumber: { contains: search } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, status: true, lastLoginAt: true },
        },
        vehicles: true,
        consignments: {
          take: 5,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            biltyNumber: true,
            shipmentStatus: true,
            origin: true,
            destination: true,
            date: true,
          },
        },
        _count: {
          select: {
            consignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      password = 'driver123',
      cnic,
      licenseNumber,
      licenseExpiry,
      address,
      emergencyContact,
      assignedVehicleId,
      vehicleNumber,
      status = 'AVAILABLE',
      photo,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Driver name and phone are required' },
        { status: 400 }
      );
    }

    const driverEmail = (email || `driver.${phone.replace(/[^0-9]/g, '')}@spdlogistics.com`).toLowerCase();

    // Check if user email already exists
    const existing = await prisma.user.findUnique({ where: { email: driverEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Email/Account "${driverEmail}" already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User with role DRIVER
      const user = await tx.user.create({
        data: {
          email: driverEmail,
          password: hashedPassword,
          name,
          phone,
          role: 'DRIVER',
          avatar: photo || null,
          status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
      });

      // 2. Create Driver linked to User
      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          name,
          phone,
          contact: phone,
          cnic: cnic || null,
          licenseNumber: licenseNumber || null,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          address: address || null,
          emergencyContact: emergencyContact || null,
          vehicleNumber: vehicleNumber || null,
          assignedVehicleId: assignedVehicleId || null,
          status,
          photo: photo || null,
          notes: notes || null,
        },
      });

      // 3. Link assigned vehicle if provided
      if (assignedVehicleId) {
        await tx.vehicle.update({
          where: { id: assignedVehicleId },
          data: { driverId: driver.id },
        });
      }

      return { driver, user };
    });

    // Create system notification
    createSystemNotification({
      type: 'DRIVER',
      title: `New Driver Registered: ${name}`,
      message: `Assigned vehicle: ${vehicleNumber || 'None'} | Contact: ${phone}`,
      link: '/admin/drivers',
    }).catch((err) => console.warn('[Notification Error]', err));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create driver' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, password, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Driver ID is required' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    // Password reset if requested
    if (password && driver.userId) {
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { id: driver.userId },
        data: { password: hashedPassword },
      });
    }

    // User status update if changed
    if (updateData.status && driver.userId) {
      await prisma.user.update({
        where: { id: driver.userId },
        data: { status: updateData.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' },
      });
    }

    // Avatar update if changed
    if (updateData.photo !== undefined && driver.userId) {
      await prisma.user.update({
        where: { id: driver.userId },
        data: { avatar: updateData.photo },
      });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        name: updateData.name ?? driver.name,
        phone: updateData.phone ?? driver.phone,
        contact: updateData.phone ?? driver.contact,
        cnic: updateData.cnic !== undefined ? updateData.cnic : driver.cnic,
        licenseNumber: updateData.licenseNumber !== undefined ? updateData.licenseNumber : driver.licenseNumber,
        licenseExpiry: updateData.licenseExpiry ? new Date(updateData.licenseExpiry) : driver.licenseExpiry,
        address: updateData.address !== undefined ? updateData.address : driver.address,
        emergencyContact: updateData.emergencyContact !== undefined ? updateData.emergencyContact : driver.emergencyContact,
        vehicleNumber: updateData.vehicleNumber !== undefined ? updateData.vehicleNumber : driver.vehicleNumber,
        assignedVehicleId: updateData.assignedVehicleId !== undefined ? updateData.assignedVehicleId : driver.assignedVehicleId,
        status: updateData.status ?? driver.status,
        photo: updateData.photo !== undefined ? updateData.photo : driver.photo,
        notes: updateData.notes !== undefined ? updateData.notes : driver.notes,
      },
      include: { user: true, vehicles: true },
    });

    // If assigned vehicle changed
    if (updateData.assignedVehicleId && updateData.assignedVehicleId !== driver.assignedVehicleId) {
      await prisma.vehicle.update({
        where: { id: updateData.assignedVehicleId },
        data: { driverId: driver.id },
      });
    }

    return NextResponse.json({ success: true, data: updatedDriver });
  } catch (error: any) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update driver' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Driver ID is required' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: true,
        vehicles: true,
        _count: {
          select: { consignments: true },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    const hasHistory = (driver._count?.consignments || 0) > 0;

    await prisma.$transaction(async (tx) => {
      // Unlink any assigned vehicles
      await tx.vehicle.updateMany({
        where: { driverId: driver.id },
        data: { driverId: null, status: 'AVAILABLE' },
      });

      if (hasHistory) {
        // Soft delete to protect consignment history and old delivery records
        await tx.driver.update({
          where: { id },
          data: {
            status: 'DELETED',
            assignedVehicleId: null,
          },
        });

        if (driver.userId) {
          await tx.user.update({
            where: { id: driver.userId },
            data: { status: 'DELETED' },
          });
        }
      } else {
        // Clean delete if no historical consignments
        await tx.driver.delete({ where: { id } });
        if (driver.userId) {
          await tx.user.delete({ where: { id: driver.userId } });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully.',
      softDeleted: hasHistory,
    });
  } catch (error: any) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unable to delete driver. Please try again.' },
      { status: 500 }
    );
  }
}
