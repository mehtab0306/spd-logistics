import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { createSystemNotification } from "@/lib/notifications";
import { sendEventEmail } from "@/lib/mailer";
import { getLiveReceivables, recordReceivablePayment } from "@/lib/accounting-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN", "STAFF"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "ALL").toUpperCase();
    const customerFilter = searchParams.get("customerId") || "";

    const { customers, allBilties, summary } = await getLiveReceivables({
      search,
      status: statusFilter,
      customerId: customerFilter,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        customers,
        bilties: allBilties,
      },
    });
  } catch (error: any) {
    console.error("[Receivables GET API Error]", error);
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInvoiced: 0,
          totalReceived: 0,
          totalOutstanding: 0,
          totalBilties: 0,
          unpaidCustomerCount: 0,
        },
        customers: [],
        bilties: [],
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN", "STAFF"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const body = await request.json();
    const {
      customerId,
      customerName,
      consignmentId,
      biltyNumber,
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

    const result = await recordReceivablePayment({
      customerId,
      customerName,
      consignmentId,
      biltyNumber,
      amount: amountNum,
      paymentMethod,
      reference,
      cashBookId,
      notes,
      recordedBy: session.name || session.email || "System Admin",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const clientName = customerName || "Customer";
    const paymentRef = result.data?.reference || `REC-${Date.now().toString().slice(-6)}`;

    // Generate System Notification
    createSystemNotification({
      type: "PAYMENT",
      title: `Payment Received: PKR ${amountNum.toLocaleString()}`,
      message: `Received PKR ${amountNum.toLocaleString()} from ${clientName} (${paymentMethod}) — Ref: ${paymentRef}`,
      link: "/admin/receivables",
    }).catch(() => null);

    // Trigger Email Notification to Admin
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
        "Linked Bilty": biltyNumber ? `#${biltyNumber}` : "General Account",
        "Recorded By": session.name || session.email,
        "Notes": notes || "N/A",
      },
      link: "/admin/receivables",
    }).catch((err) => console.warn("[Email Notification Error]", err));

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("[Receivables POST API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
