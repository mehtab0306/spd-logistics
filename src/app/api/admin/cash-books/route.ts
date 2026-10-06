import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cashBookId = searchParams.get('cashBookId');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const statusParam = searchParams.get('status');
    const isDeletedQuery = statusParam === 'DELETED' || searchParams.get('deleted') === 'true';
    const category = searchParams.get('category');
    const paymentMethod = searchParams.get('paymentMethod');
    const typeFilter = searchParams.get('type'); // "IN" or "OUT"
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. SPECIFIC CASH BOOK DETAILS & TRANSACTIONS
    if (cashBookId) {
      let cashBook = await prisma.cashBook.findUnique({
        where: { id: cashBookId },
        include: {
          transactions: {
            include: {
              customer: { select: { id: true, name: true, phone: true, companyName: true } },
              vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true } },
              driver: { select: { id: true, name: true, phone: true } },
              challan: { select: { id: true, challanNumber: true, truckNumber: true, origin: true, destination: true } },
              bilty: { select: { id: true, biltyNumber: true, trackingId: true } },
            },
            orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (!cashBook) {
        return NextResponse.json({ success: false, error: 'Cash Book not found' }, { status: 404 });
      }

      // Calculate sequential running balance across all transactions
      let running = cashBook.openingBalance || 0;
      const allWithRunning = cashBook.transactions.map((t) => {
        const cred = t.credit || 0;
        const deb = t.debit || 0;
        running = running + cred - deb;
        return {
          ...t,
          runningBalance: running,
        };
      });

      // Filter transactions based on query
      let filtered = allWithRunning;

      if (search) {
        filtered = filtered.filter((t) => {
          const s = search;
          return (
            t.description?.toLowerCase().includes(s) ||
            t.accountPerson?.toLowerCase().includes(s) ||
            t.party?.toLowerCase().includes(s) ||
            t.voucherNumber?.toLowerCase().includes(s) ||
            t.category?.toLowerCase().includes(s) ||
            t.vehicleNumber?.toLowerCase().includes(s) ||
            t.driverName?.toLowerCase().includes(s) ||
            t.challanNumber?.toLowerCase().includes(s) ||
            t.biltyNumber?.toLowerCase().includes(s) ||
            t.customer?.name?.toLowerCase().includes(s) ||
            t.customer?.companyName?.toLowerCase().includes(s) ||
            t.notes?.toLowerCase().includes(s)
          );
        });
      }

      if (category && category !== 'ALL') {
        filtered = filtered.filter((t) => t.category?.toLowerCase() === category.toLowerCase());
      }

      if (paymentMethod && paymentMethod !== 'ALL') {
        filtered = filtered.filter((t) => t.paymentMethod?.toUpperCase() === paymentMethod.toUpperCase());
      }

      if (typeFilter === 'IN') {
        filtered = filtered.filter((t) => (t.credit || 0) > 0);
      } else if (typeFilter === 'OUT') {
        filtered = filtered.filter((t) => (t.debit || 0) > 0);
      }

      if (startDate) {
        const start = new Date(startDate);
        filtered = filtered.filter((t) => new Date(t.date) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((t) => new Date(t.date) <= end);
      }

      // Aggregates for current filtered view
      const totalCredits = filtered.reduce((acc, t) => acc + (t.credit || 0), 0);
      const totalDebits = filtered.reduce((acc, t) => acc + (t.debit || 0), 0);
      const netMovement = totalCredits - totalDebits;

      // Reverse order for presentation (most recent at top)
      const presentationList = [...filtered].reverse();

      return NextResponse.json({
        success: true,
        data: {
          id: cashBook.id,
          name: cashBook.name,
          city: cashBook.city,
          description: cashBook.description,
          openingBalance: cashBook.openingBalance,
          currentBalance: running, // Final cumulative balance
          totalCredits,
          totalDebits,
          netMovement,
          transactionCount: filtered.length,
          totalTransactionCount: cashBook.transactions.length,
          status: cashBook.status,
          transactions: presentationList,
        },
      });
    }

    // 2. LIST ALL CASH BOOKS
    const statusWhere = isDeletedQuery ? 'DELETED' : { not: 'DELETED' };
    const cashBooks = await prisma.cashBook.findMany({
      where: { status: statusWhere },
      include: {
        transactions: {
          select: { debit: true, credit: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = cashBooks.map((cb) => {
      const totalCredits = cb.transactions.reduce((acc, t) => acc + (t.credit || 0), 0);
      const totalDebits = cb.transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
      const currentBalance = (cb.openingBalance || 0) + totalCredits - totalDebits;
      return {
        id: cb.id,
        name: cb.name,
        city: cb.city,
        description: cb.description,
        openingBalance: cb.openingBalance,
        totalCredits,
        totalDebits,
        currentBalance,
        transactionCount: cb._count.transactions,
        status: cb.status,
        updatedAt: cb.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching cash books:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    const body = await request.json();
    const { action } = body;

    // Action 1: Create a new Cash Book
    if (action === 'CREATE_BOOK') {
      const { name, city, description, openingBalance = 0 } = body;
      if (!name || !city) {
        return NextResponse.json({ success: false, error: 'Name and city are required' }, { status: 400 });
      }

      const openBal = parseFloat(String(openingBalance)) || 0;
      const newBook = await prisma.cashBook.create({
        data: {
          name,
          city,
          description: description || `Operating cash book for ${city}`,
          openingBalance: openBal,
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...newBook,
          currentBalance: openBal,
          totalCredits: 0,
          totalDebits: 0,
          transactionCount: 0,
        },
      });
    }

    // Action: Restore a soft-deleted Cash Book
    if (action === 'RESTORE_BOOK') {
      const targetId = body.cashBookId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'Cash Book ID is required' }, { status: 400 });
      }

      await prisma.cashBook.update({
        where: { id: targetId },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({
        success: true,
        message: 'Cash Book restored successfully.',
        data: { id: targetId, status: 'ACTIVE' },
      });
    }

    // Action 2: Add Transaction (Cash IN or Cash OUT)
    const {
      cashBookId,
      type = 'IN', // "IN" | "OUT"
      amount = 0,
      date,
      voucherNumber,
      category,
      party,
      accountPerson,
      description,
      paymentMethod = 'CASH',
      notes,
      customerId,
      vehicleId,
      vehicleNumber: rawVehicleNumber,
      driverId,
      driverName: rawDriverName,
      biltyId,
      biltyNumber: rawBiltyNumber,
      challanId,
      challanNumber: rawChallanNumber,
      route,
      attachment,
    } = body;

    if (!cashBookId) {
      return NextResponse.json({ success: false, error: 'Cash Book ID is required' }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid amount greater than 0 is required' }, { status: 400 });
    }

    const isCashIn = type === 'IN' || type === 'CREDIT';
    const credit = isCashIn ? numAmount : 0;
    const debit = isCashIn ? 0 : numAmount;

    // Verify cash book exists
    const cashBook = await prisma.cashBook.findUnique({
      where: { id: cashBookId },
      include: {
        transactions: {
          select: { debit: true, credit: true },
        },
      },
    });

    if (!cashBook) {
      return NextResponse.json({ success: false, error: 'Cash book not found' }, { status: 404 });
    }

    // Compute previous balance & new balance
    const prevCredits = cashBook.transactions.reduce((acc, t) => acc + (t.credit || 0), 0);
    const prevDebits = cashBook.transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
    const prevBalance = (cashBook.openingBalance || 0) + prevCredits - prevDebits;
    const newBalance = prevBalance + credit - debit;

    // Validate and resolve foreign keys
    let validUserId: string | null = null;
    if (session?.userId) {
      const userExists = await prisma.user.findUnique({ where: { id: session.userId } });
      if (userExists) validUserId = userExists.id;
    }

    let resolvedParty = party || accountPerson || (isCashIn ? 'Customer Payment' : 'Operating Expense');
    let resolvedVehicleNumber = rawVehicleNumber;
    let resolvedDriverName = rawDriverName;
    let resolvedChallanNumber = rawChallanNumber;
    let resolvedBiltyNumber = rawBiltyNumber;

    let validCustomerId: string | null = null;
    if (customerId) {
      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (cust) {
        validCustomerId = cust.id;
        resolvedParty = cust.name;
      }
    }

    let validVehicleId: string | null = null;
    if (vehicleId) {
      const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (veh) {
        validVehicleId = veh.id;
        resolvedVehicleNumber = veh.vehicleNumber;
      }
    }

    let validDriverId: string | null = null;
    if (driverId) {
      const drv = await prisma.driver.findUnique({ where: { id: driverId } });
      if (drv) {
        validDriverId = drv.id;
        resolvedDriverName = drv.name;
      }
    }

    let validChallanId: string | null = null;
    if (challanId) {
      const chl = await prisma.challan.findUnique({ where: { id: challanId } });
      if (chl) {
        validChallanId = chl.id;
        resolvedChallanNumber = chl.challanNumber;
      }
    }

    let validBiltyId: string | null = null;
    if (biltyId) {
      const blt = await prisma.consignment.findUnique({ where: { id: biltyId } });
      if (blt) {
        validBiltyId = blt.id;
        resolvedBiltyNumber = blt.biltyNumber;
      }
    }

    const defaultDesc = isCashIn
      ? `${category || 'Cash IN'} received from ${resolvedParty}`
      : `${category || 'Expense'} - ${resolvedParty}${resolvedVehicleNumber ? ` (${resolvedVehicleNumber})` : ''}`;

    const vch = voucherNumber || `VCH-${Date.now().toString().slice(-6)}`;

    // Create the transaction record
    const transaction = await prisma.cashBookTransaction.create({
      data: {
        cashBookId,
        date: date ? new Date(date) : new Date(),
        voucherNumber: vch,
        category: category || (isCashIn ? 'Customer Payment' : 'Other Expense'),
        party: resolvedParty,
        accountPerson: resolvedParty,
        description: description || defaultDesc,
        debit,
        credit,
        balance: newBalance,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || null,
        customerId: validCustomerId,
        vehicleId: validVehicleId,
        vehicleNumber: resolvedVehicleNumber || null,
        driverId: validDriverId,
        driverName: resolvedDriverName || null,
        biltyId: validBiltyId,
        biltyNumber: resolvedBiltyNumber || null,
        challanId: validChallanId,
        challanNumber: resolvedChallanNumber || null,
        route: route || null,
        attachment: attachment || null,
        createdById: validUserId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true } },
        driver: { select: { id: true, name: true, phone: true } },
        challan: { select: { id: true, challanNumber: true, origin: true, destination: true } },
        bilty: { select: { id: true, biltyNumber: true, trackingId: true } },
      },
    });

    // 1. Customer Ledger Connection:
    // If Cash IN is linked to a customer, update customer ledger/account if exists
    if (customerId && isCashIn) {
      try {
        const customerAccount = await prisma.account.findFirst({
          where: { customerId },
        });

        if (customerAccount) {
          await prisma.accountTransaction.create({
            data: {
              accountId: customerAccount.id,
              date: date ? new Date(date) : new Date(),
              voucherNumber: vch,
              description: `Cash IN Receipt: ${description || category || 'Customer Payment'}`,
              credit: numAmount,
              debit: 0,
              paymentMethod: paymentMethod || 'CASH',
              reference: vch,
              notes: `Recorded via Cash Book: ${cashBook.name}`,
            },
          });
        }
      } catch (ledgerErr) {
        console.warn('Customer ledger update warning:', ledgerErr);
      }
    }

    // 2. Challan Connection:
    // If Cash OUT is linked to a Challan/Trip, update Challan vehicleExpense / labourCost
    if (challanId && !isCashIn) {
      try {
        const challan = await prisma.challan.findUnique({ where: { id: challanId } });
        if (challan) {
          const cat = (category || '').toLowerCase();
          const updateData: any = {};

          if (cat.includes('diesel') || cat.includes('vehicle') || cat.includes('fuel') || cat.includes('maintenance')) {
            updateData.vehicleExpense = (challan.vehicleExpense || 0) + numAmount;
          } else if (cat.includes('labour') || cat.includes('labor')) {
            updateData.labourCost = (challan.labourCost || 0) + numAmount;
          } else {
            updateData.otherExpenses = (challan.otherExpenses || 0) + numAmount;
          }

          const curVehExp = updateData.vehicleExpense ?? challan.vehicleExpense;
          const curLabExp = updateData.labourCost ?? challan.labourCost;
          const curOthExp = updateData.otherExpenses ?? challan.otherExpenses;
          const curComm = challan.commissionDeduction || 0;
          const totalAmt = challan.totalAmount || 0;

          updateData.estimatedProfit = totalAmt - curComm - curLabExp - curVehExp - curOthExp;

          await prisma.challan.update({
            where: { id: challanId },
            data: updateData,
          });
        }
      } catch (challanErr) {
        console.warn('Challan expense sync warning:', challanErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${vch} saved successfully!`,
      data: transaction,
      newBalance,
    });
  } catch (error: any) {
    console.error('Error in cash book operation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get('txId') || searchParams.get('id');
    const cashBookId = searchParams.get('cashBookId');

    // Delete a specific transaction
    if (txId) {
      const existing = await prisma.cashBookTransaction.findUnique({
        where: { id: txId },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
      }

      // Revert challan expense if linked
      if (existing.challanId && existing.debit > 0) {
        try {
          const challan = await prisma.challan.findUnique({ where: { id: existing.challanId } });
          if (challan) {
            const cat = (existing.category || '').toLowerCase();
            const updateData: any = {};
            if (cat.includes('diesel') || cat.includes('vehicle') || cat.includes('fuel')) {
              updateData.vehicleExpense = Math.max(0, (challan.vehicleExpense || 0) - existing.debit);
            } else if (cat.includes('labour') || cat.includes('labor')) {
              updateData.labourCost = Math.max(0, (challan.labourCost || 0) - existing.debit);
            } else {
              updateData.otherExpenses = Math.max(0, (challan.otherExpenses || 0) - existing.debit);
            }

            const curVeh = updateData.vehicleExpense ?? challan.vehicleExpense;
            const curLab = updateData.labourCost ?? challan.labourCost;
            const curOth = updateData.otherExpenses ?? challan.otherExpenses;
            updateData.estimatedProfit = (challan.totalAmount || 0) - (challan.commissionDeduction || 0) - curLab - curVeh - curOth;

            await prisma.challan.update({
              where: { id: existing.challanId },
              data: updateData,
            });
          }
        } catch (revertErr) {
          console.warn('Revert challan expense warning:', revertErr);
        }
      }

      await prisma.cashBookTransaction.delete({
        where: { id: txId },
      });

      return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
    }

    // Soft delete / archive entire Cash Book
    if (cashBookId) {
      await prisma.cashBook.update({
        where: { id: cashBookId },
        data: { status: 'DELETED' },
      });

      return NextResponse.json({ success: true, message: 'Cash book archived successfully' });
    }

    return NextResponse.json({ success: false, error: 'Missing txId or cashBookId' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting cash book entry:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
