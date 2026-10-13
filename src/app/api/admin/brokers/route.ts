import { NextResponse } from 'next/server';
import {
  getCentralCollection,
  saveCentralRecord,
  updateCentralRecord,
  deleteCentralRecord,
  BrokerRecord,
} from '@/lib/server-store';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const city = searchParams.get('city') || '';
    const status = searchParams.get('status') || '';

    let brokers = (getCentralCollection('brokers') as BrokerRecord[]) || [];
    const challans = (getCentralCollection('challans') as any[]) || [];
    const brokerPayments = (getCentralCollection('brokerPayments') as any[]) || [];

    // Calculate dynamic ledger figures for each broker based on assigned challans & payments
    brokers = brokers.map((b) => {
      const assignedChallans = challans.filter(
        (c) =>
          c.brokerId === b.id ||
          (c.brokerName && c.brokerName.toLowerCase().trim() === b.name.toLowerCase().trim())
      );

      const totalTrips = assignedChallans.length || b.totalTrips || 0;
      const totalFreightAgreed = assignedChallans.reduce((sum, c) => sum + (parseFloat(c.brokerFreight) || 0), 0) || b.totalFreightAgreed || 0;
      const totalAdvancePaid = assignedChallans.reduce((sum, c) => sum + (parseFloat(c.brokerAdvance) || 0), 0) || b.totalAdvancePaid || 0;
      const totalDeductions = assignedChallans.reduce((sum, c) => sum + (parseFloat(c.brokerDeduction) || 0), 0) || b.totalDeductions || 0;

      const directPayments = brokerPayments
        .filter((p) => p.brokerId === b.id || p.brokerName?.toLowerCase() === b.name.toLowerCase())
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const netPayableBalance =
        (b.openingBalance || 0) +
        totalFreightAgreed -
        totalAdvancePaid -
        totalDeductions -
        directPayments;

      return {
        ...b,
        totalTrips,
        totalFreightAgreed,
        totalAdvancePaid,
        totalDeductions,
        directPayments,
        netPayableBalance,
      };
    });

    // Filter
    if (city && city !== 'ALL') {
      brokers = brokers.filter((b) => b.city?.toLowerCase() === city.toLowerCase());
    }
    if (status && status !== 'ALL') {
      brokers = brokers.filter((b) => b.status === status);
    }
    if (search) {
      brokers = brokers.filter(
        (b) =>
          b.name.toLowerCase().includes(search) ||
          b.contactPerson?.toLowerCase().includes(search) ||
          b.phone?.toLowerCase().includes(search) ||
          b.city?.toLowerCase().includes(search) ||
          b.cnic?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: brokers,
      total: brokers.length,
    });
  } catch (error: any) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json({
      success: true,
      data: getCentralCollection('brokers'),
      total: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Record Broker Payment (with Cash Book deduction)
    if (action === 'RECORD_PAYMENT') {
      const {
        brokerId,
        brokerName,
        cashBookId,
        cashBookName,
        amount,
        paymentMethod = 'CASH',
        voucherNumber,
        notes,
        date = new Date().toISOString(),
      } = body;

      if (!brokerId || !amount || parseFloat(amount) <= 0) {
        return NextResponse.json(
          { success: false, error: 'Broker and valid payment amount are required.' },
          { status: 400 }
        );
      }

      const numAmount = parseFloat(amount);
      const paymentRecord = {
        id: `bp-${Date.now()}`,
        brokerId,
        brokerName: brokerName || 'Fleet Broker',
        cashBookId,
        cashBookName,
        amount: numAmount,
        paymentMethod,
        voucherNumber: voucherNumber || `VCH-BRK-${Date.now().toString().slice(-6)}`,
        notes,
        date,
        createdAt: new Date().toISOString(),
      };

      saveCentralRecord('brokerPayments', paymentRecord);

      // Deduct from Cash Book if specified
      if (cashBookId) {
        try {
          const cashBook = await prisma.cashBook.findUnique({
            where: { id: cashBookId },
            include: { transactions: { select: { debit: true, credit: true } } },
          });

          if (cashBook) {
            const prevCredits = cashBook.transactions.reduce((acc, t) => acc + (t.credit || 0), 0);
            const prevDebits = cashBook.transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
            const prevBalance = (cashBook.openingBalance || 0) + prevCredits - prevDebits;
            const newBalance = prevBalance - numAmount;

            await prisma.cashBookTransaction.create({
              data: {
                cashBookId,
                date: new Date(date),
                voucherNumber: paymentRecord.voucherNumber,
                category: 'Broker Payment',
                party: brokerName || 'Fleet Broker',
                description: `Payment to Broker: ${brokerName} (${paymentRecord.voucherNumber})`,
                debit: numAmount,
                credit: 0,
                balance: newBalance,
                paymentMethod,
                notes: notes || null,
              },
            });
          }
        } catch (cbErr) {
          console.warn('[brokers] Warning syncing cash book transaction:', cbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Payment of ₨ ${numAmount.toLocaleString()} recorded successfully for ${brokerName}.`,
        data: paymentRecord,
      });
    }

    // Action 2: Create New Broker
    const {
      name,
      contactPerson,
      phone,
      whatsapp,
      cnic,
      ntn,
      city = 'Lahore',
      commissionType = 'FIXED',
      commissionRate = 0,
      openingBalance = 0,
      bankDetails,
      notes,
      status = 'ACTIVE',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Broker or Agency name is required.' },
        { status: 400 }
      );
    }

    const brokerRecord: BrokerRecord = {
      id: body.id || `brk-${Date.now()}`,
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone?.trim() || '',
      whatsapp: whatsapp?.trim() || phone?.trim() || '',
      cnic: cnic?.trim() || '',
      ntn: ntn?.trim() || '',
      city: city || 'Lahore',
      commissionType: commissionType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
      commissionRate: parseFloat(commissionRate) || 0,
      openingBalance: parseFloat(openingBalance) || 0,
      bankDetails: bankDetails?.trim() || '',
      notes: notes?.trim() || '',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      totalTrips: 0,
      totalFreightAgreed: 0,
      totalAdvancePaid: 0,
      totalDeductions: 0,
      netPayableBalance: parseFloat(openingBalance) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCentralRecord('brokers', brokerRecord);

    return NextResponse.json({
      success: true,
      message: 'Broker registered successfully.',
      data: brokerRecord,
    });
  } catch (error: any) {
    console.error('Error in brokers POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Broker ID is required for update.' },
        { status: 400 }
      );
    }

    const updated = updateCentralRecord('brokers', id, updates);
    if (!updated) {
      // If not found, save as new
      const saved = saveCentralRecord('brokers', { id, ...updates });
      return NextResponse.json({ success: true, data: saved });
    }

    return NextResponse.json({
      success: true,
      message: 'Broker updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating broker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update broker.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Broker ID is required for deletion.' },
        { status: 400 }
      );
    }

    // Soft delete / archive
    updateCentralRecord('brokers', id, { status: 'INACTIVE' });

    return NextResponse.json({
      success: true,
      message: 'Broker archived successfully.',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting broker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete broker.' },
      { status: 500 }
    );
  }
}
