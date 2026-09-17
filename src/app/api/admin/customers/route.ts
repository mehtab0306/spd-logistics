import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createSystemNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouse = searchParams.get('warehouse') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      where.status = { not: 'DELETED' };
    }
    if (warehouse) where.warehouse = warehouse;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, status: true, lastLoginAt: true },
        },
        account: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 5,
            },
          },
        },
        _count: {
          select: {
            consignmentsAsCustomer: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      companyName,
      email,
      password,
      phone,
      whatsapp,
      cnic,
      businessRef,
      address,
      city,
      warehouse = 'LAHORE',
      creditLimit = 0,
      openingBalance = 0,
      photo,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Customer or business name is required' },
        { status: 400 }
      );
    }

    const userEmail = (email || `${(phone || name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@spdcustomer.com`).toLowerCase();

    // Check if email already in use
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `User with email "${userEmail}" already exists` },
        { status: 400 }
      );
    }

    const rawPassword = password || 'spd12345';
    const hashedPassword = await hashPassword(rawPassword);

    // Create User, Customer, Account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          name: companyName ? `${companyName} (${name})` : name,
          phone: phone || null,
          role: 'CUSTOMER',
          avatar: photo || null,
          status: 'ACTIVE',
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: newUser.id,
          name,
          companyName: companyName || null,
          email: userEmail,
          phone: phone || null,
          whatsapp: whatsapp || phone || null,
          cnic: cnic || null,
          businessRef: businessRef || null,
          address: address || null,
          city: city || 'Lahore',
          warehouse,
          creditLimit: parseFloat(creditLimit) || 0,
          openingBalance: parseFloat(openingBalance) || 0,
          photo: photo || null,
          notes: notes || null,
          status: 'ACTIVE',
        },
      });

      const account = await tx.account.create({
        data: {
          customerId: customer.id,
          accountName: companyName || `${name} Account`,
          accountType: 'CUSTOMER',
          openingBalance: parseFloat(openingBalance) || 0,
          status: 'ACTIVE',
        },
      });

      if (parseFloat(openingBalance) !== 0) {
        await tx.accountTransaction.create({
          data: {
            accountId: account.id,
            description: 'Opening Balance',
            debit: parseFloat(openingBalance) > 0 ? parseFloat(openingBalance) : 0,
            credit: parseFloat(openingBalance) < 0 ? Math.abs(parseFloat(openingBalance)) : 0,
            balance: parseFloat(openingBalance),
          },
        });
      }

      return { customer, user: newUser, account };
    });

    // Create system notification
    createSystemNotification({
      type: 'CUSTOMER',
      title: `New Customer Registered: ${name}`,
      message: `${companyName ? companyName + ' — ' : ''}${city} (${phone || 'No phone'})`,
      link: '/admin/customers',
    }).catch((err) => console.warn('[Notification Error]', err));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, password, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Handle password reset
    if (password && customer.userId) {
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { id: customer.userId },
        data: { password: hashedPassword },
      });
    }

    // If status is updated, also update User status
    if (updateData.status && customer.userId) {
      await prisma.user.update({
        where: { id: customer.userId },
        data: { status: updateData.status },
      });
    }

    // If photo is updated, also update User avatar
    if (updateData.photo !== undefined && customer.userId) {
      await prisma.user.update({
        where: { id: customer.userId },
        data: { avatar: updateData.photo },
      });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: updateData.name ?? customer.name,
        companyName: updateData.companyName !== undefined ? updateData.companyName : customer.companyName,
        phone: updateData.phone !== undefined ? updateData.phone : customer.phone,
        whatsapp: updateData.whatsapp !== undefined ? updateData.whatsapp : customer.whatsapp,
        cnic: updateData.cnic !== undefined ? updateData.cnic : customer.cnic,
        businessRef: updateData.businessRef !== undefined ? updateData.businessRef : customer.businessRef,
        address: updateData.address !== undefined ? updateData.address : customer.address,
        city: updateData.city !== undefined ? updateData.city : customer.city,
        warehouse: updateData.warehouse !== undefined ? updateData.warehouse : customer.warehouse,
        creditLimit: updateData.creditLimit !== undefined ? parseFloat(updateData.creditLimit) : customer.creditLimit,
        notes: updateData.notes !== undefined ? updateData.notes : customer.notes,
        status: updateData.status ?? customer.status,
        photo: updateData.photo !== undefined ? updateData.photo : customer.photo,
      },
      include: { user: true, account: true },
    });

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer' },
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
      return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        account: {
          include: {
            _count: { select: { transactions: true } },
          },
        },
        _count: {
          select: {
            consignmentsAsCustomer: true,
            consignmentsAsSender: true,
            consignmentsAsReceiver: true,
            payments: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const hasHistory = (
      (customer._count?.consignmentsAsCustomer || 0) > 0 ||
      (customer._count?.consignmentsAsSender || 0) > 0 ||
      (customer._count?.consignmentsAsReceiver || 0) > 0 ||
      (customer._count?.payments || 0) > 0 ||
      (customer.account?._count?.transactions || 0) > 0
    );

    if (hasHistory) {
      // Soft delete to protect business ledger and historical bilties
      await prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id },
          data: { status: 'DELETED' },
        });
        if (customer.userId) {
          await tx.user.update({
            where: { id: customer.userId },
            data: { status: 'DELETED' },
          });
        }
        if (customer.account) {
          await tx.account.update({
            where: { id: customer.account.id },
            data: { status: 'DELETED' },
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully.',
        softDeleted: true,
      });
    } else {
      // No historical records: safe to clean up completely
      await prisma.$transaction(async (tx) => {
        if (customer.account) {
          await tx.accountTransaction.deleteMany({ where: { accountId: customer.account.id } });
          await tx.account.delete({ where: { id: customer.account.id } });
        }
        await tx.customer.delete({ where: { id } });
        if (customer.userId) {
          await tx.user.delete({ where: { id: customer.userId } });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully.',
      });
    }
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unable to delete customer. Please try again.' },
      { status: 500 }
    );
  }
}
