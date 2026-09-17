import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSystemNotification } from '@/lib/notifications';
import { sendEventEmail } from '@/lib/mailer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const consignmentId = searchParams.get('consignmentId');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (consignmentId) where.consignmentId = consignmentId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, companyName: true, phone: true } },
        consignment: { select: { id: true, biltyNumber: true, totalAmount: true, remainingBalance: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      consignmentId,
      cashBookId,
      amount,
      type = 'RECEIPT', // RECEIPT (customer paying) or PAYMENT (paying out to driver/vendor)
      paymentMethod = 'CASH',
      reference,
      notes,
    } = body;

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          type,
          customerId: customerId || null,
          consignmentId: consignmentId || null,
          cashBookId: cashBookId || null,
          amount: amountNum,
          paymentMethod,
          reference: reference || `PAY-${Date.now().toString().slice(-6)}`,
          notes: notes || null,
          status: 'COMPLETED',
        },
      });

      // 2. If linked to Consignment, update its paidAmount and balance
      if (consignmentId) {
        const consignment = await tx.consignment.findUnique({ where: { id: consignmentId } });
        if (consignment) {
          const newPaid = consignment.paidAmount + amountNum;
          const newRemaining = Math.max(0, consignment.totalAmount - newPaid);
          const paymentStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

          await tx.consignment.update({
            where: { id: consignmentId },
            data: {
              paidAmount: newPaid,
              remainingBalance: newRemaining,
              paymentStatus,
            },
          });
        }
      }

      // 3. If linked to Customer, update Customer Account Ledger
      if (customerId) {
        const account = await tx.account.findFirst({ where: { customerId } });
        if (account) {
          await tx.accountTransaction.create({
            data: {
              accountId: account.id,
              voucherNumber: reference || payment.reference,
              description: `Payment ${type} - ${paymentMethod}`,
              credit: type === 'RECEIPT' ? amountNum : 0,
              debit: type === 'PAYMENT' ? amountNum : 0,
              paymentMethod,
              reference,
              notes,
            },
          });
        }
      }

      // 4. If linked to Cash Book, record a cash book transaction
      if (cashBookId) {
        await tx.cashBookTransaction.create({
          data: {
            cashBookId,
            voucherNumber: reference || payment.reference,
            description: `Payment ${type} (${paymentMethod})${notes ? ` - ${notes}` : ''}`,
            credit: type === 'RECEIPT' ? amountNum : 0,
            debit: type === 'PAYMENT' ? amountNum : 0,
            paymentMethod,
            notes,
          },
        });
      }

      return payment;
    });

    // 1. Generate real persistent Notification in SQLite
    const payerName = customerId
      ? (await prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } }))?.name || 'Customer'
      : 'Walk-in Customer';

    createSystemNotification({
      type: 'PAYMENT',
      title: `Payment Recorded: PKR ${amountNum.toLocaleString()} (${type})`,
      message: `${type === 'RECEIPT' ? 'Received from' : 'Paid to'} ${payerName} via ${paymentMethod} — Ref: ${result.reference}`,
      link: type === 'RECEIPT' ? '/admin/receivables' : '/admin/payables',
    }).catch((err) => console.warn('[Notification Error]', err));

    // 2. Dispatch real email alert to Admin
    sendEventEmail({
      eventType: 'PAYMENT_RECORDED',
      subject: `[SPD Payment Alert] PKR ${amountNum.toLocaleString()} (${type}) Recorded`,
      title: `Payment ${type === 'RECEIPT' ? 'Receipt' : 'Disbursement'} Recorded`,
      summary: `A payment transaction of PKR ${amountNum.toLocaleString()} has been recorded in the financial system.`,
      fields: {
        'Transaction Type': type,
        'Amount': `PKR ${amountNum.toLocaleString()}`,
        'Customer / Account': payerName,
        'Payment Method': paymentMethod,
        'Reference Number': result.reference,
        'Linked Consignment': consignmentId || 'N/A',
        'Deposit Cash Book': cashBookId || 'Direct',
        'Notes': notes || 'N/A',
      },
      link: type === 'RECEIPT' ? '/admin/receivables' : '/admin/payables',
    }).catch((err) => console.warn('[Email Alert Error]', err));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
