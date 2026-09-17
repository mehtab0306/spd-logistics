import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cashBookId = searchParams.get('cashBookId');
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status');
    const isDeletedQuery = statusParam === 'DELETED' || searchParams.get('deleted') === 'true';

    // If a specific cash book is requested, return its transactions
    if (cashBookId) {
      const cashBook = await prisma.cashBook.findUnique({
        where: { id: cashBookId },
        include: {
          transactions: {
            where: search
              ? {
                  OR: [
                    { description: { contains: search } },
                    { accountPerson: { contains: search } },
                    { voucherNumber: { contains: search } },
                  ],
                }
              : undefined,
            orderBy: { date: 'asc' },
          },
        },
      });

      if (!cashBook) {
        return NextResponse.json({ success: false, error: 'Cash book not found' }, { status: 404 });
      }

      // Calculate running balances accurately
      let running = cashBook.openingBalance;
      const transactionsWithBalance = cashBook.transactions.map((tx) => {
        running = running + tx.credit - tx.debit; // Credit = money in (income), Debit = money out (expense)
        return {
          ...tx,
          runningBalance: running,
        };
      });

      const totalCredits = cashBook.transactions.reduce((acc, t) => acc + t.credit, 0);
      const totalDebits = cashBook.transactions.reduce((acc, t) => acc + t.debit, 0);

      return NextResponse.json({
        success: true,
        data: {
          ...cashBook,
          currentBalance: running,
          totalCredits,
          totalDebits,
          transactions: transactionsWithBalance.reverse(), // Show newest first for table display
        },
      });
    }

    // Otherwise, list cash books with their summary stats (filtered by status)
    const cashBooks = await prisma.cashBook.findMany({
      where: isDeletedQuery
        ? { status: 'DELETED' }
        : { status: { not: 'DELETED' } },
      include: {
        transactions: {
          select: {
            debit: true,
            credit: true,
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = cashBooks.map((cb) => {
      const totalCredits = cb.transactions.reduce((acc, t) => acc + t.credit, 0);
      const totalDebits = cb.transactions.reduce((acc, t) => acc + t.debit, 0);
      const currentBalance = cb.openingBalance + totalCredits - totalDebits;
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
      { success: false, error: 'Failed to fetch cash books' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Create a new Cash Book
    if (action === 'CREATE_BOOK') {
      const { name, city, description, openingBalance = 0 } = body;
      if (!name || !city) {
        return NextResponse.json({ success: false, error: 'Name and city are required' }, { status: 400 });
      }

      const newBook = await prisma.cashBook.create({
        data: {
          name,
          city,
          description: description || `Cash book operations for ${city}`,
          openingBalance: parseFloat(openingBalance) || 0,
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, data: newBook });
    }

    // Action: Restore a soft-deleted Cash Book
    if (action === 'RESTORE_BOOK') {
      const targetId = body.cashBookId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'Cash Book ID is required' }, { status: 400 });
      }

      const existing = await prisma.cashBook.findUnique({ where: { id: targetId } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Cash Book not found' }, { status: 404 });
      }

      const restoredBook = await prisma.cashBook.update({
        where: { id: targetId },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({
        success: true,
        message: 'Cash Book restored successfully.',
        data: restoredBook,
      });
    }

    // Action 2: Add Transaction to an existing Cash Book
    const {
      cashBookId,
      date,
      voucherNumber,
      description,
      accountPerson,
      debit = 0,
      credit = 0,
      paymentMethod = 'CASH',
      notes,
    } = body;

    if (!cashBookId || !description) {
      return NextResponse.json(
        { success: false, error: 'Cash book ID and description are required' },
        { status: 400 }
      );
    }

    const debitNum = parseFloat(debit) || 0;
    const creditNum = parseFloat(credit) || 0;

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

    const prevCredits = cashBook.transactions.reduce((acc, t) => acc + t.credit, 0);
    const prevDebits = cashBook.transactions.reduce((acc, t) => acc + t.debit, 0);
    const newBalance = cashBook.openingBalance + prevCredits + creditNum - (prevDebits + debitNum);

    const transaction = await prisma.cashBookTransaction.create({
      data: {
        cashBookId,
        date: date ? new Date(date) : new Date(),
        voucherNumber: voucherNumber || `VCH-${Date.now().toString().slice(-6)}`,
        description,
        accountPerson: accountPerson || null,
        debit: debitNum,
        credit: creditNum,
        balance: newBalance,
        paymentMethod,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Error in cash book operation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process cash book operation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let cashBookId = searchParams.get('cashBookId');
    let action = searchParams.get('action');

    if (!id && !cashBookId) {
      try {
        const body = await request.json();
        id = body.id;
        cashBookId = body.cashBookId;
        action = body.action || action;
      } catch (_) {}
    }

    // 1. Check if this is a request to delete a complete Cash Book
    const targetBookId = cashBookId || (action === 'DELETE_BOOK' ? id : null);
    if (targetBookId) {
      const existingBook = await prisma.cashBook.findUnique({
        where: { id: targetBookId },
      });

      if (!existingBook) {
        return NextResponse.json(
          { success: false, error: 'Cash Book not found' },
          { status: 404 }
        );
      }

      // Reversible safe soft-delete: preserves all transactions and historical records
      await prisma.cashBook.update({
        where: { id: targetBookId },
        data: { status: 'DELETED' },
      });

      return NextResponse.json({
        success: true,
        message: 'Cash Book deleted.',
        id: targetBookId,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Cash Book ID is required' },
        { status: 400 }
      );
    }

    // 2. Locate the transaction to ensure it exists and get its cashBookId
    const transaction = await prisma.cashBookTransaction.findUnique({
      where: { id },
      include: { cashBook: true },
    });

    if (!transaction) {
      // Check if this ID belongs to a CashBook directly
      const book = await prisma.cashBook.findUnique({ where: { id } });
      if (book) {
        await prisma.cashBook.update({
          where: { id },
          data: { status: 'DELETED' },
        });
        return NextResponse.json({
          success: true,
          message: 'Cash Book deleted.',
          id,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Cash Book entry not found' },
        { status: 404 }
      );
    }

    const txCashBookId = transaction.cashBookId;

    // 2. Safely delete the transaction and recalculate sequential balances
    await prisma.$transaction(async (tx) => {
      await tx.cashBookTransaction.delete({
        where: { id },
      });

      // Recalculate and update the stored balance field of all remaining transactions
      const remainingTransactions = await tx.cashBookTransaction.findMany({
        where: { cashBookId: txCashBookId },
        orderBy: { date: 'asc' },
      });

      const cashBook = await tx.cashBook.findUnique({
        where: { id: txCashBookId },
      });

      if (cashBook) {
        let running = cashBook.openingBalance;
        for (const item of remainingTransactions) {
          running = running + item.credit - item.debit;
          if (item.balance !== running) {
            await tx.cashBookTransaction.update({
              where: { id: item.id },
              data: { balance: running },
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cash Book entry deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting cash book entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete cash book entry' },
      { status: 500 }
    );
  }
}
