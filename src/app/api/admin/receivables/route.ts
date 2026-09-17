import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSystemNotification } from "@/lib/notifications";
import { sendEventEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "ALL").toUpperCase();
    const customerFilter = searchParams.get("customerId") || "";

    // 1. Fetch active consignments
    const consignments = await prisma.consignment.findMany({
      where: {
        shipmentStatus: { not: "DELETED" },
        ...(customerFilter ? {
          OR: [
            { customerId: customerFilter },
            { senderId: customerFilter },
            { receiverId: customerFilter },
          ],
        } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, city: true, companyName: true } },
        sender: { select: { id: true, name: true, phone: true, city: true, companyName: true } },
        receiver: { select: { id: true, name: true, phone: true, city: true, companyName: true } },
        payments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { date: "desc" },
    });

    // 2. Fetch all registered customers to ensure complete customer directory
    const allCustomers = await prisma.customer.findMany({
      where: {
        status: { not: "DELETED" },
        ...(customerFilter ? { id: customerFilter } : {}),
      },
      include: {
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    // 3. Group and aggregate customer-wise
    type CustomerReceivable = {
      customerId: string;
      customerName: string;
      phone: string;
      city: string;
      companyName: string;
      totalBiltiesCount: number;
      totalFreightAmount: number;
      totalInvoicedAmount: number;
      totalPaidAmount: number;
      totalOutstandingBalance: number;
      paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
      bilties: any[];
      payments: any[];
    };

    const customerMap = new Map<string, CustomerReceivable>();

    // Initialize registered customers
    for (const c of allCustomers) {
      customerMap.set(c.id, {
        customerId: c.id,
        customerName: c.name || "Unnamed Customer",
        phone: c.phone || "N/A",
        city: c.city || "General",
        companyName: c.companyName || "",
        totalBiltiesCount: 0,
        totalFreightAmount: 0,
        totalInvoicedAmount: 0,
        totalPaidAmount: 0,
        totalOutstandingBalance: 0,
        paymentStatus: "PAID",
        bilties: [],
        payments: c.payments || [],
      });
    }

    // Process consignments
    for (const c of consignments) {
      const primaryCustId = c.customerId || c.senderId || (c.senderName ? `walkin_${c.senderName.toLowerCase().replace(/\s+/g, '_')}` : "walkin_general");
      const displayName = c.customer?.name || c.sender?.name || c.senderName || "Walk-in Shipper";
      const displayPhone = c.customer?.phone || c.sender?.phone || c.senderPhone || "N/A";
      const displayCity = c.customer?.city || c.sender?.city || c.origin || "General";
      const displayCompany = c.customer?.companyName || c.sender?.companyName || "";

      if (!customerMap.has(primaryCustId)) {
        customerMap.set(primaryCustId, {
          customerId: primaryCustId,
          customerName: displayName,
          phone: displayPhone,
          city: displayCity,
          companyName: displayCompany,
          totalBiltiesCount: 0,
          totalFreightAmount: 0,
          totalInvoicedAmount: 0,
          totalPaidAmount: 0,
          totalOutstandingBalance: 0,
          paymentStatus: "PAID",
          bilties: [],
          payments: [],
        });
      }

      const entry = customerMap.get(primaryCustId)!;
      entry.totalBiltiesCount += 1;
      entry.totalFreightAmount += (c.freight || 0);
      entry.totalInvoicedAmount += (c.totalAmount || 0);
      entry.totalPaidAmount += (c.paidAmount || 0);

      const biltyRecord = {
        id: c.id,
        biltyNumber: c.biltyNumber,
        trackingId: c.trackingId,
        date: c.date,
        senderName: c.senderName || c.sender?.name || "Shipper",
        receiverName: c.receiverName || c.receiver?.name || "Consignee",
        senderPhone: c.senderPhone || c.sender?.phone || "",
        receiverPhone: c.receiverPhone || c.receiver?.phone || "",
        origin: c.origin,
        destination: c.destination,
        freight: c.freight || 0,
        additionalCharges: c.additionalCharges || 0,
        discount: c.discount || 0,
        totalAmount: c.totalAmount || 0,
        paidAmount: c.paidAmount || 0,
        remainingBalance: c.remainingBalance || 0,
        paymentStatus: c.paymentStatus || (c.remainingBalance <= 0 ? "PAID" : c.paidAmount > 0 ? "PARTIAL" : "UNPAID"),
        shipmentStatus: c.shipmentStatus,
        payments: c.payments || [],
      };

      entry.bilties.push(biltyRecord);

      // Collect payments if not already collected
      if (c.payments && c.payments.length > 0) {
        for (const p of c.payments) {
          if (!entry.payments.some((ep) => ep.id === p.id)) {
            entry.payments.push(p);
          }
        }
      }
    }

    // Finalize status and outstanding balance for all entries
    let customerList = Array.from(customerMap.values()).map((entry) => {
      const outstanding = Math.max(0, entry.totalInvoicedAmount - entry.totalPaidAmount);
      entry.totalOutstandingBalance = outstanding;

      if (entry.totalInvoicedAmount === 0) {
        entry.paymentStatus = "PAID";
      } else if (outstanding <= 0) {
        entry.paymentStatus = "PAID";
      } else if (entry.totalPaidAmount > 0) {
        entry.paymentStatus = "PARTIAL";
      } else {
        entry.paymentStatus = "UNPAID";
      }

      return entry;
    });

    // Only keep customers with bilties or registered customers with positive balances or activity
    customerList = customerList.filter(
      (c) => c.totalBiltiesCount > 0 || c.payments.length > 0
    );

    // Apply Search Filter
    if (search) {
      customerList = customerList.filter((c) => {
        const matchCustomer =
          c.customerName.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search) ||
          c.companyName.toLowerCase().includes(search);

        const matchBilty = c.bilties.some(
          (b) =>
            b.biltyNumber.toLowerCase().includes(search) ||
            b.trackingId.toLowerCase().includes(search) ||
            b.receiverName.toLowerCase().includes(search) ||
            b.origin.toLowerCase().includes(search) ||
            b.destination.toLowerCase().includes(search)
        );

        return matchCustomer || matchBilty;
      });
    }

    // Apply Status Filter
    if (statusFilter !== "ALL") {
      customerList = customerList.filter((c) => c.paymentStatus === statusFilter);
    }

    // Calculate Global Totals
    const summary = {
      totalInvoiced: customerList.reduce((acc, c) => acc + c.totalInvoicedAmount, 0),
      totalReceived: customerList.reduce((acc, c) => acc + c.totalPaidAmount, 0),
      totalOutstanding: customerList.reduce((acc, c) => acc + c.totalOutstandingBalance, 0),
      totalBilties: customerList.reduce((acc, c) => acc + c.totalBiltiesCount, 0),
      unpaidCustomerCount: customerList.filter((c) => c.totalOutstandingBalance > 0).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        customers: customerList,
      },
    });
  } catch (error: any) {
    console.error("[Receivables GET API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch receivables data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      consignmentId,
      amount,
      paymentMethod = "CASH",
      reference,
      notes,
      cashBookId,
    } = body;

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid positive payment amount is required" },
        { status: 400 }
      );
    }

    let targetConsignment: any = null;
    if (consignmentId) {
      targetConsignment = await prisma.consignment.findUnique({
        where: { id: consignmentId },
      });
      if (!targetConsignment) {
        return NextResponse.json(
          { success: false, error: "Consignment bilty not found" },
          { status: 404 }
        );
      }
    }

    const paymentRef = reference || `REC-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          type: "RECEIPT",
          customerId: customerId && !customerId.startsWith("walkin_") ? customerId : null,
          consignmentId: consignmentId || null,
          cashBookId: cashBookId || null,
          amount: amountNum,
          paymentMethod,
          reference: paymentRef,
          notes: notes || `Customer payment recorded via Receivables`,
          status: "COMPLETED",
          createdById: session.userId,
        },
      });

      // 2. Update Consignment if applicable
      if (consignmentId && targetConsignment) {
        const newPaid = (targetConsignment.paidAmount || 0) + amountNum;
        const newRemaining = Math.max(0, targetConsignment.totalAmount - newPaid);
        const paymentStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

        await tx.consignment.update({
          where: { id: consignmentId },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRemaining,
            paymentStatus,
          },
        });
      }

      // 3. Update Customer Account Ledger if valid customer
      if (customerId && !customerId.startsWith("walkin_")) {
        const account = await tx.account.findFirst({ where: { customerId } });
        if (account) {
          await tx.accountTransaction.create({
            data: {
              accountId: account.id,
              voucherNumber: paymentRef,
              description: `Payment Receipt — ${paymentMethod}${targetConsignment ? ` for Bilty #${targetConsignment.biltyNumber}` : ""}`,
              credit: amountNum,
              debit: 0,
              paymentMethod,
              reference: paymentRef,
              notes: notes || null,
            },
          });
        }
      }

      // 4. Update Cash Book if selected
      if (cashBookId) {
        await tx.cashBookTransaction.create({
          data: {
            cashBookId,
            voucherNumber: paymentRef,
            description: `Payment Receipt (${paymentMethod})${notes ? ` - ${notes}` : ""}`,
            credit: amountNum,
            debit: 0,
            paymentMethod,
            notes,
            createdById: session.userId,
          },
        });
      }

      return payment;
    });

    // 5. Generate Real Persistent Notification in SQLite
    const customerInfo = customerId && !customerId.startsWith("walkin_")
      ? await prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } })
      : null;
    const clientName = customerInfo?.name || targetConsignment?.senderName || "Customer";

    await createSystemNotification({
      type: "PAYMENT",
      title: `Payment Received: PKR ${amountNum.toLocaleString()}`,
      message: `Received PKR ${amountNum.toLocaleString()} from ${clientName} (${paymentMethod}) — Ref: ${paymentRef}`,
      link: "/admin/receivables",
    });

    // 6. Trigger Real Email Notification to Admin
    sendEventEmail({
      eventType: "PAYMENT_RECORDED",
      subject: `[SPD Payment Alert] PKR ${amountNum.toLocaleString()} received from ${clientName}`,
      title: "Customer Payment Received",
      summary: `A payment of PKR ${amountNum.toLocaleString()} has been recorded in Receivables.`,
      fields: {
        "Customer / Payer": clientName,
        "Amount Received": `PKR ${amountNum.toLocaleString()}`,
        "Payment Method": paymentMethod,
        "Reference Number": paymentRef,
        "Linked Bilty": targetConsignment ? `#${targetConsignment.biltyNumber}` : "General Account",
        "Recorded By": session.name || session.email,
        "Notes": notes || "N/A",
      },
      link: "/admin/receivables",
    }).catch((err) => console.warn("[Email Notification Error]", err));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Receivables POST API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
