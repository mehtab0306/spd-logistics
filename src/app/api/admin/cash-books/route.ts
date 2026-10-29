import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  getCentralCollection,
  saveCentralRecord,
  updateCentralRecord,
  deleteCentralRecord,
  INITIAL_CASH_BOOKS,
} from '@/lib/server-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_CASH_BOOKS = INITIAL_CASH_BOOKS;

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
      let cashBook: any = null;
      try {
        cashBook = await prisma.cashBook.findUnique({
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
      } catch (dbErr) {
        console.warn('DB error fetching cash book (serving fallback):', dbErr);
      }

      if (!cashBook) {
        const centralBooks = (getCentralCollection('cashBooks') || []) as any[];
        const fallback =
          centralBooks.find((c) => c.id === cashBookId) ||
          DEFAULT_CASH_BOOKS.find((c) => c.id === cashBookId) ||
          DEFAULT_CASH_BOOKS[0];

        const centralTxs = (getCentralCollection('cashTransactions') || []) as any[];
        const bookTxs = centralTxs.filter((t) => t.cashBookId === cashBookId);

        let txList = bookTxs;

        let running = fallback.openingBalance || 0;
        const allWithRunning = txList.map((t: any) => {
          const cred = t.credit || 0;
          const deb = t.debit || 0;
          running = running + cred - deb;
          return {
            ...t,
            runningBalance: running,
          };
        });

        const credSum = txList.reduce((acc: number, t: any) => acc + (t.credit || 0), 0);
        const debSum = txList.reduce((acc: number, t: any) => acc + (t.debit || 0), 0);

        return NextResponse.json({
          success: true,
          data: {
            ...fallback,
            openingBalance: fallback.openingBalance || 0,
            currentBalance: (fallback.openingBalance || 0) + credSum - debSum,
            totalCredits: credSum,
            totalDebits: debSum,
            netMovement: credSum - debSum,
            transactionCount: txList.length,
            totalTransactionCount: txList.length,
            status: 'ACTIVE',
            transactions: allWithRunning,
          },
        });
      }

      // Calculate sequential running balance across all transactions
      let running = cashBook.openingBalance || 0;
      const allWithRunning = cashBook.transactions.map((t: any) => {
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
        filtered = filtered.filter((t: any) => {
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
        filtered = filtered.filter((t: any) => t.category?.toLowerCase() === category.toLowerCase());
      }

      if (paymentMethod && paymentMethod !== 'ALL') {
        filtered = filtered.filter((t: any) => t.paymentMethod?.toLowerCase() === paymentMethod.toLowerCase());
      }

      if (typeFilter && typeFilter !== 'ALL') {
        if (typeFilter === 'IN') {
          filtered = filtered.filter((t: any) => (t.credit || 0) > 0);
        } else if (typeFilter === 'OUT') {
          filtered = filtered.filter((t: any) => (t.debit || 0) > 0);
        }
      }

      if (startDate) {
        const sTime = new Date(startDate).getTime();
        filtered = filtered.filter((t: any) => new Date(t.date).getTime() >= sTime);
      }

      if (endDate) {
        const eTime = new Date(endDate).getTime() + 86400000;
        filtered = filtered.filter((t: any) => new Date(t.date).getTime() <= eTime);
      }

      const totalCredits = filtered.reduce((acc: number, t: any) => acc + (t.credit || 0), 0);
      const totalDebits = filtered.reduce((acc: number, t: any) => acc + (t.debit || 0), 0);
      const allCredits = allWithRunning.reduce((acc: number, t: any) => acc + (t.credit || 0), 0);
      const allDebits = allWithRunning.reduce((acc: number, t: any) => acc + (t.debit || 0), 0);
      const currentBalance = (cashBook.openingBalance || 0) + allCredits - allDebits;

      return NextResponse.json({
        success: true,
        data: {
          ...cashBook,
          openingBalance: cashBook.openingBalance || 0,
          currentBalance,
          totalCredits,
          totalDebits,
          netMovement: totalCredits - totalDebits,
          transactionCount: filtered.length,
          totalTransactionCount: cashBook.transactions.length,
          transactions: filtered,
        },
      });
    }

    // 2. LIST ALL CASH BOOKS
    const statusWhere = isDeletedQuery ? 'DELETED' : { not: 'DELETED' };
    let cashBooks: any[] = [];
    try {
      cashBooks = await prisma.cashBook.findMany({
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
    } catch (dbErr) {
      console.warn('DB error fetching cash books (serving fallback):', dbErr);
    }

    const centralBooks = (getCentralCollection('cashBooks') || []) as any[];

    if (!cashBooks || cashBooks.length === 0) {
      const activeCentral = centralBooks.filter((b) =>
        isDeletedQuery ? b.status === 'DELETED' : b.status !== 'DELETED'
      );
      return NextResponse.json({
        success: true,
        data: activeCentral.length > 0 ? activeCentral : DEFAULT_CASH_BOOKS,
      });
    }

    const summary = cashBooks.map((cb) => {
      const totalCredits = cb.transactions.reduce((acc: number, t: any) => acc + (t.credit || 0), 0);
      const totalDebits = cb.transactions.reduce((acc: number, t: any) => acc + (t.debit || 0), 0);
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
        transactionCount: cb._count?.transactions || 0,
        status: cb.status,
        updatedAt: cb.updatedAt,
      };
    });

    // Merge any central books not already in Prisma
    const existingIds = new Set(summary.map((s) => s.id));
    for (const cb of centralBooks) {
      if (!existingIds.has(cb.id)) {
        if (isDeletedQuery ? cb.status === 'DELETED' : cb.status !== 'DELETED') {
          summary.push(cb);
        }
      }
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching cash books:', error);
    const centralBooks = (getCentralCollection('cashBooks') || []) as any[];
    return NextResponse.json({
      success: true,
      data: centralBooks.length > 0 ? centralBooks : DEFAULT_CASH_BOOKS,
    });
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
      let newBook: any = null;

      try {
        newBook = await prisma.cashBook.create({
          data: {
            name,
            city,
            description: description || `Operating cash book for ${city}`,
            openingBalance: openBal,
            status: 'ACTIVE',
          },
        });
      } catch (dbErr) {
        console.warn('Prisma cashBook.create error (falling back to central store):', dbErr);
      }

      const bookToSave = newBook
        ? {
            ...newBook,
            currentBalance: openBal,
            totalCredits: 0,
            totalDebits: 0,
            transactionCount: 0,
          }
        : {
            id: `cb-${Date.now()}`,
            name,
            city,
            description: description || `Operating cash book for ${city}`,
            openingBalance: openBal,
            totalCredits: 0,
            totalDebits: 0,
            currentBalance: openBal,
            transactionCount: 0,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      saveCentralRecord('cashBooks', bookToSave);

      return NextResponse.json({
        success: true,
        message: 'Cash book created successfully',
        data: bookToSave,
      });
    }

    // Action: Restore a soft-deleted Cash Book
    if (action === 'RESTORE_BOOK') {
      const targetId = body.cashBookId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'Cash Book ID is required' }, { status: 400 });
      }

      try {
        await prisma.cashBook.update({
          where: { id: targetId },
          data: { status: 'ACTIVE' },
        });
      } catch (dbErr) {
        console.warn('Prisma restore book warning:', dbErr);
      }

      updateCentralRecord('cashBooks', targetId, { status: 'ACTIVE' });

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
    let cashBook: any = null;
    try {
      cashBook = await prisma.cashBook.findUnique({
        where: { id: cashBookId },
        include: {
          transactions: {
            select: { debit: true, credit: true },
          },
        },
      });
    } catch (dbErr) {
      console.warn('DB error checking cash book (fallback):', dbErr);
    }

    if (!cashBook) {
      const centralBooks = (getCentralCollection('cashBooks') || []) as any[];
      cashBook =
        centralBooks.find((b: any) => b.id === cashBookId) ||
        DEFAULT_CASH_BOOKS.find((b: any) => b.id === cashBookId);
    }

    const prevCredits = cashBook?.transactions
      ? cashBook.transactions.reduce((acc: number, t: any) => acc + (t.credit || 0), 0)
      : cashBook?.totalCredits || 0;
    const prevDebits = cashBook?.transactions
      ? cashBook.transactions.reduce((acc: number, t: any) => acc + (t.debit || 0), 0)
      : cashBook?.totalDebits || 0;
    const prevBalance = (cashBook?.openingBalance || 0) + prevCredits - prevDebits;
    const newBalance = prevBalance + credit - debit;

    let resolvedParty = party || accountPerson || (isCashIn ? 'Customer Payment' : 'Operating Expense');
    let resolvedVehicleNumber = rawVehicleNumber;
    let resolvedDriverName = rawDriverName;
    let resolvedChallanNumber = rawChallanNumber;
    let resolvedBiltyNumber = rawBiltyNumber;

    const defaultDesc = isCashIn
      ? `${category || 'Cash IN'} received from ${resolvedParty}`
      : `${category || 'Expense'} - ${resolvedParty}${resolvedVehicleNumber ? ` (${resolvedVehicleNumber})` : ''}`;

    const vch = voucherNumber || `VCH-${Date.now().toString().slice(-6)}`;

    let transaction: any = null;
    try {
      // Validate and resolve foreign keys
      let validUserId: string | null = null;
      if (session?.userId) {
        try {
          const userExists = await prisma.user.findUnique({ where: { id: session.userId } });
          if (userExists) validUserId = userExists.id;
        } catch {}
      }

      let validCustomerId: string | null = null;
      if (customerId) {
        try {
          const cust = await prisma.customer.findUnique({ where: { id: customerId } });
          if (cust) {
            validCustomerId = cust.id;
            resolvedParty = cust.name;
          }
        } catch {}
      }

      let validVehicleId: string | null = null;
      if (vehicleId) {
        try {
          const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
          if (veh) {
            validVehicleId = veh.id;
            resolvedVehicleNumber = veh.vehicleNumber;
          }
        } catch {}
      }

      let validDriverId: string | null = null;
      if (driverId) {
        try {
          const drv = await prisma.driver.findUnique({ where: { id: driverId } });
          if (drv) {
            validDriverId = drv.id;
            resolvedDriverName = drv.name;
          }
        } catch {}
      }

      let validChallanId: string | null = null;
      if (challanId) {
        try {
          const chl = await prisma.challan.findUnique({ where: { id: challanId } });
          if (chl) {
            validChallanId = chl.id;
            resolvedChallanNumber = chl.challanNumber;
          }
        } catch {}
      }

      let validBiltyId: string | null = null;
      if (biltyId) {
        try {
          const blt = await prisma.consignment.findUnique({ where: { id: biltyId } });
          if (blt) {
            validBiltyId = blt.id;
            resolvedBiltyNumber = blt.biltyNumber;
          }
        } catch {}
      }

      // Create transaction via Prisma
      transaction = await prisma.cashBookTransaction.create({
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

      // Customer Ledger Connection
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
                notes: `Recorded via Cash Book: ${cashBook?.name || ''}`,
              },
            });
          }
        } catch (ledgerErr) {
          console.warn('Customer ledger update warning:', ledgerErr);
        }
      }

      // Challan Connection
      if (challanId && !isCashIn) {
        try {
          const chl = await prisma.challan.findUnique({ where: { id: challanId } });
          if (chl) {
            const cat = (category || '').toLowerCase();
            const updateData: any = {};

            if (cat.includes('diesel') || cat.includes('vehicle') || cat.includes('fuel') || cat.includes('maintenance')) {
              updateData.vehicleExpense = (chl.vehicleExpense || 0) + numAmount;
            } else if (cat.includes('labour') || cat.includes('labor')) {
              updateData.labourCost = (chl.labourCost || 0) + numAmount;
            } else {
              updateData.otherExpenses = (chl.otherExpenses || 0) + numAmount;
            }

            const curVehExp = updateData.vehicleExpense ?? chl.vehicleExpense;
            const curLabExp = updateData.labourCost ?? chl.labourCost;
            const curOthExp = updateData.otherExpenses ?? chl.otherExpenses;
            const curComm = chl.commissionDeduction || 0;
            const totalAmt = chl.totalAmount || 0;

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
    } catch (txErr) {
      console.warn('Prisma transaction create failed (falling back to central store):', txErr);
    }

    if (!transaction) {
      transaction = {
        id: `cbt-${Date.now()}`,
        cashBookId,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
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
        vehicleNumber: resolvedVehicleNumber || null,
        driverName: resolvedDriverName || null,
        challanNumber: resolvedChallanNumber || null,
        biltyNumber: resolvedBiltyNumber || null,
        route: route || null,
        createdAt: new Date().toISOString(),
      };
    }

    // Persist transaction & update cash book in central store
    saveCentralRecord('cashTransactions', transaction);
    updateCentralRecord('cashBooks', cashBookId, {
      totalCredits: prevCredits + credit,
      totalDebits: prevDebits + debit,
      currentBalance: newBalance,
      transactionCount: (cashBook?.transactionCount || 0) + 1,
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${vch} saved successfully!`,
      data: transaction,
      newBalance,
    });
  } catch (error: any) {
    console.error('Error in cash book operation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
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
      try {
        const existing = await prisma.cashBookTransaction.findUnique({
          where: { id: txId },
        });

        if (existing) {
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
                updateData.estimatedProfit =
                  (challan.totalAmount || 0) - (challan.commissionDeduction || 0) - curLab - curVeh - curOth;

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
        }
      } catch (dbErr) {
        console.warn('Prisma delete tx warning:', dbErr);
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.from('cash_books').delete().eq('id', txId);
        } catch (sbErr) {
          console.warn('Supabase delete tx error:', sbErr);
        }
      }

      deleteCentralRecord('cashTransactions', txId);
      return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
    }

    // Delete / archive entire Cash Book
    if (cashBookId) {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('cash_books').delete().eq('id', cashBookId);
        } catch (sbErr) {
          console.warn('Supabase delete cash_book error:', sbErr);
        }
      }

      try {
        await prisma.cashBook.delete({ where: { id: cashBookId } });
      } catch {
        try {
          await prisma.cashBook.update({
            where: { id: cashBookId },
            data: { status: 'DELETED' },
          });
        } catch (dbErr) {
          console.warn('Prisma archive book warning:', dbErr);
        }
      }

      deleteCentralRecord('cashBooks', cashBookId);
      return NextResponse.json({ success: true, message: 'Cash book removed successfully' });
    }

    return NextResponse.json({ success: false, error: 'Missing txId or cashBookId' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting cash book entry:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
