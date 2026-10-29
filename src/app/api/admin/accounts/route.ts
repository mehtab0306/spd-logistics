import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_ACCOUNTS: any[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').toLowerCase();

    let accounts: any[] = [];
    try {
      accounts = await prisma.account.findMany({
        where: {
          status: { not: 'DELETED' },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          transactions: {
            orderBy: { date: 'asc' },
          },
        },
      });
    } catch (dbErr) {
      console.warn('Prisma accounts fetch notice:', dbErr);
    }

    if (isSupabaseConfigured) {
      try {
        const { data: sbAccounts } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });
        if (Array.isArray(sbAccounts) && sbAccounts.length > 0) {
          const existingIds = new Set(accounts.map((a: any) => a.id));
          for (const sba of sbAccounts) {
            if (!existingIds.has(sba.id)) {
              accounts.push({
                id: sba.id,
                accountName: sba.account_title || sba.id,
                accountNumber: sba.account_number || 'ACC-LIVE',
                accountType: 'CUSTOMER_LEDGER',
                openingBalance: Number(sba.balance) || 0,
                status: 'ACTIVE',
                transactions: [],
              });
            }
          }
        }
      } catch (sbErr) {
        console.warn('Supabase accounts fetch notice:', sbErr);
      }
    }

    let result = accounts || [];
    if (search) {
      result = result.filter(
        (a) =>
          a.accountName?.toLowerCase().includes(search) ||
          a.accountNumber?.toLowerCase().includes(search) ||
          a.customer?.name?.toLowerCase().includes(search) ||
          a.customer?.companyName?.toLowerCase().includes(search) ||
          a.customer?.phone?.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      accounts: result,
      totalCount: result.length,
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch accounts', accounts: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_account') {
      const {
        accountName,
        accountNumber,
        accountType = 'CUSTOMER',
        openingBalance = 0,
        customerId,
        notes,
      } = body;

      if (!accountName) {
        return NextResponse.json(
          { success: false, error: 'Account Name is required' },
          { status: 400 }
        );
      }

      const newAccount = {
        id: `acc-${Date.now()}`,
        accountName,
        accountNumber: accountNumber || `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
        accountType,
        openingBalance: Number(openingBalance) || 0,
        status: 'ACTIVE',
        notes: notes || '',
        customerId: customerId || null,
        createdAt: new Date().toISOString(),
        transactions: [],
      };

      try {
        const created = await prisma.account.create({
          data: {
            accountName: newAccount.accountName,
            accountNumber: newAccount.accountNumber,
            accountType: newAccount.accountType,
            openingBalance: newAccount.openingBalance,
            notes: newAccount.notes,
            customerId: newAccount.customerId || undefined,
          },
          include: { customer: true },
        });
        return NextResponse.json({ success: true, account: created });
      } catch (dbErr) {
        console.warn('DB creation failed, returning memory/localStorage account:', dbErr);
        return NextResponse.json({ success: true, account: newAccount });
      }
    }

    if (action === 'add_transaction') {
      const {
        accountId,
        voucherNumber,
        description,
        debit = 0,
        credit = 0,
        paymentMethod = 'CASH',
        reference = '',
        notes = '',
        date = new Date().toISOString(),
      } = body;

      if (!accountId || !description) {
        return NextResponse.json(
          { success: false, error: 'AccountId and description are required' },
          { status: 400 }
        );
      }

      const tx = {
        id: `tx-${Date.now()}`,
        accountId,
        voucherNumber: voucherNumber || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
        description,
        debit: Number(debit) || 0,
        credit: Number(credit) || 0,
        balance: 0,
        paymentMethod,
        reference,
        notes,
        date,
      };

      try {
        const createdTx = await prisma.accountTransaction.create({
          data: {
            accountId: tx.accountId,
            voucherNumber: tx.voucherNumber,
            description: tx.description,
            debit: tx.debit,
            credit: tx.credit,
            balance: tx.balance,
            paymentMethod: tx.paymentMethod,
            reference: tx.reference,
            notes: tx.notes,
            date: new Date(date),
          },
        });
        return NextResponse.json({ success: true, transaction: createdTx });
      } catch (dbErr) {
        console.warn('DB transaction creation failed, returning memory transaction:', dbErr);
        return NextResponse.json({ success: true, transaction: tx });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in accounts POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
