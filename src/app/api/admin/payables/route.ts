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
    const category = searchParams.get("category") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const where: any = {};
    if (category !== "ALL") {
      where.category = category;
    }
    if (status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { vendorName: { contains: search } },
        { reference: { contains: search } },
        { description: { contains: search } },
        { vehicleNumber: { contains: search } },
        { driverName: { contains: search } },
      ];
    }

    const payables = await prisma.payable.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    const now = new Date();
    const summary = {
      totalPayables: payables.reduce((acc, p) => acc + (p.totalAmount || 0), 0),
      totalPaid: payables.reduce((acc, p) => acc + (p.paidAmount || 0), 0),
      totalRemaining: payables.reduce((acc, p) => acc + (p.remainingAmount || 0), 0),
      overdueCount: payables.filter((p) => p.dueDate && new Date(p.dueDate) < now && (p.remainingAmount || 0) > 0).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        payables,
      },
    });
  } catch (error: any) {
    console.error("[Payables GET API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payables" },
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
      vendorName,
      category = "OTHER",
      reference,
      vehicleNumber,
      driverName,
      description,
      totalAmount,
      paidAmount = 0,
      dueDate,
      notes,
    } = body;

    if (!vendorName || !String(vendorName).trim()) {
      return NextResponse.json({ success: false, error: "Beneficiary / Vendor name is required" }, { status: 400 });
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json({ success: false, error: "Payable description is required" }, { status: 400 });
    }

    const totalNum = parseFloat(totalAmount);
    if (isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json({ success: false, error: "Valid total amount is required" }, { status: 400 });
    }

    const paidNum = Math.max(0, parseFloat(paidAmount) || 0);
    const remainingNum = Math.max(0, totalNum - paidNum);
    const status = remainingNum <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "UNPAID";

    const payable = await prisma.payable.create({
      data: {
        vendorName: String(vendorName).trim(),
        category,
        reference: reference ? String(reference).trim() : null,
        vehicleNumber: vehicleNumber ? String(vehicleNumber).trim() : null,
        driverName: driverName ? String(driverName).trim() : null,
        description: String(description).trim(),
        totalAmount: totalNum,
        paidAmount: paidNum,
        remainingAmount: remainingNum,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        notes: notes ? String(notes).trim() : null,
      },
    });

    // Generate Real System Notification in SQLite
    await createSystemNotification({
      type: "PAYABLE",
      title: `New Payable: PKR ${totalNum.toLocaleString()} (${category})`,
      message: `Payable created for ${vendorName} — ${description}`,
      link: "/admin/payables",
    });

    return NextResponse.json({ success: true, data: payable });
  } catch (error: any) {
    console.error("[Payables POST API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payable" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, recordPayment, paymentAmount, paymentMethod = "CASH", cashBookId, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Payable ID is required" }, { status: 400 });
    }

    const current = await prisma.payable.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, error: "Payable not found" }, { status: 404 });
    }

    // 1. Record Payment flow
    if (recordPayment) {
      const payNum = parseFloat(paymentAmount);
      if (isNaN(payNum) || payNum <= 0) {
        return NextResponse.json({ success: false, error: "Valid positive payment amount is required" }, { status: 400 });
      }

      const newPaid = (current.paidAmount || 0) + payNum;
      const newRemaining = Math.max(0, current.totalAmount - newPaid);
      const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

      const updated = await prisma.$transaction(async (tx) => {
        const item = await tx.payable.update({
          where: { id },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus,
            notes: notes ? `${current.notes ? current.notes + " | " : ""}${notes}` : current.notes,
          },
        });

        // Record in Cash Book as debit (cash payout) if cash book selected
        if (cashBookId) {
          await tx.cashBookTransaction.create({
            data: {
              cashBookId,
              voucherNumber: current.reference || `PAY-${Date.now().toString().slice(-6)}`,
              description: `Payable payout to ${current.vendorName} (${current.category})`,
              debit: payNum,
              credit: 0,
              paymentMethod,
              notes: notes || null,
              createdById: session.userId,
            },
          });
        }

        // Record Payment record
        await tx.payment.create({
          data: {
            type: "PAYMENT",
            amount: payNum,
            paymentMethod,
            reference: current.reference || `PAY-${Date.now().toString().slice(-6)}`,
            notes: `Payable settlement to ${current.vendorName}: ${notes || ""}`,
            status: "COMPLETED",
            createdById: session.userId,
            cashBookId: cashBookId || null,
          },
        });

        return item;
      });

      // Notification
      await createSystemNotification({
        type: "PAYABLE",
        title: `Payment Made: PKR ${payNum.toLocaleString()} to ${current.vendorName}`,
        message: `Settled PKR ${payNum.toLocaleString()} towards payable ${current.reference || ""}. Remaining: PKR ${newRemaining.toLocaleString()}`,
        link: "/admin/payables",
      });

      // Email notification
      sendEventEmail({
        eventType: "PAYMENT_RECORDED",
        subject: `[SPD Expense Alert] PKR ${payNum.toLocaleString()} paid to ${current.vendorName}`,
        title: "Payable Expense Payout",
        summary: `A payment of PKR ${payNum.toLocaleString()} was made to ${current.vendorName} (${current.category}).`,
        fields: {
          "Beneficiary": current.vendorName,
          "Category": current.category,
          "Amount Paid": `PKR ${payNum.toLocaleString()}`,
          "Remaining Balance": `PKR ${newRemaining.toLocaleString()}`,
          "Payment Method": paymentMethod,
          "Reference": current.reference || "N/A",
          "Recorded By": session.name || session.email,
        },
        link: "/admin/payables",
      }).catch((err) => console.warn("[Email Notification Error]", err));

      return NextResponse.json({ success: true, data: updated });
    }

    // 2. Regular edit flow
    const {
      vendorName,
      category,
      reference,
      vehicleNumber,
      driverName,
      description,
      totalAmount,
      dueDate,
      notes: editNotes,
    } = body;

    const totalNum = totalAmount !== undefined ? parseFloat(totalAmount) : current.totalAmount;
    const remainingNum = Math.max(0, totalNum - (current.paidAmount || 0));
    const status = remainingNum <= 0 ? "PAID" : (current.paidAmount || 0) > 0 ? "PARTIAL" : "UNPAID";

    const updated = await prisma.payable.update({
      where: { id },
      data: {
        vendorName: vendorName !== undefined ? String(vendorName).trim() : current.vendorName,
        category: category !== undefined ? category : current.category,
        reference: reference !== undefined ? (reference ? String(reference).trim() : null) : current.reference,
        vehicleNumber: vehicleNumber !== undefined ? (vehicleNumber ? String(vehicleNumber).trim() : null) : current.vehicleNumber,
        driverName: driverName !== undefined ? (driverName ? String(driverName).trim() : null) : current.driverName,
        description: description !== undefined ? String(description).trim() : current.description,
        totalAmount: totalNum,
        remainingAmount: remainingNum,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : current.dueDate,
        status,
        notes: editNotes !== undefined ? (editNotes ? String(editNotes).trim() : null) : current.notes,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[Payables PUT API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update payable" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Payable ID is required" }, { status: 400 });
    }

    await prisma.payable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Payable deleted successfully" });
  } catch (error: any) {
    console.error("[Payables DELETE API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete payable" },
      { status: 500 }
    );
  }
}
