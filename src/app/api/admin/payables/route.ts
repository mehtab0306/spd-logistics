import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import {
  getLivePayables,
  getSystemSettingJson,
  setSystemSettingJson,
  recordCashTransaction,
  PayableItem,
} from "@/lib/accounting-store";
import { generateUUID } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN", "STAFF"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const { payables, summary } = await getLivePayables({
      search,
      category,
      status,
    });

    return NextResponse.json({
      success: true,
      data: { summary, payables },
    });
  } catch (error: any) {
    console.error("[Payables GET API Error]", error);
    return NextResponse.json({
      success: true,
      data: {
        summary: { totalPayables: 0, totalPaid: 0, totalRemaining: 0, overdueCount: 0 },
        payables: [],
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
      vendorName,
      category = "OTHER",
      reference,
      vehicleNumber,
      driverName,
      challanId,
      challanNumber,
      brokerId,
      brokerName,
      description,
      totalAmount,
      paidAmount = 0,
      dueDate,
      notes,
      cashBookId,
    } = body;

    if (!vendorName || !String(vendorName).trim()) {
      return NextResponse.json({ success: false, error: "Beneficiary / Vendor name is required" }, { status: 400 });
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json({ success: false, error: "Payable description is required" }, { status: 400 });
    }

    const totalNum = parseFloat(totalAmount) || 0;
    const paidNum = parseFloat(paidAmount) || 0;
    const remainingNum = Math.max(0, totalNum - paidNum);
    const payableStatus: "UNPAID" | "PARTIAL" | "PAID" =
      remainingNum <= 0 && totalNum > 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "UNPAID";
    const ref = reference?.trim() || `PAY-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const newPayable: PayableItem = {
      id: generateUUID(),
      vendorName: String(vendorName).trim(),
      category,
      reference: ref,
      vehicleNumber: vehicleNumber ? String(vehicleNumber).trim() : undefined,
      driverName: driverName ? String(driverName).trim() : undefined,
      challanId: challanId || undefined,
      challanNumber: challanNumber || undefined,
      brokerId: brokerId || undefined,
      brokerName: brokerName || undefined,
      description: String(description).trim(),
      totalAmount: totalNum,
      paidAmount: paidNum,
      remainingAmount: remainingNum,
      status: payableStatus,
      dueDate: dueDate || timestamp,
      notes: notes || undefined,
      createdAt: timestamp,
    };

    // Persist to custom_payables
    const currentPayables = await getSystemSettingJson<PayableItem[]>("custom_payables", []);
    currentPayables.unshift(newPayable);
    await setSystemSettingJson("custom_payables", currentPayables);

    // If an initial payment was made and cashBookId selected, record Cash OUT
    if (paidNum > 0 && cashBookId) {
      await recordCashTransaction({
        cashBookId,
        type: "CASH_OUT",
        category,
        amount: paidNum,
        partyName: vendorName,
        vehicleNumber,
        driverName,
        brokerName,
        challanId,
        challanNumber,
        paymentMethod: "CASH",
        reference: ref,
        description: `Payable Advance / Payment — ${vendorName} (${description})`,
        notes,
      });
    }

    return NextResponse.json({ success: true, data: newPayable });
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
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN", "STAFF"]);
    if (auth.errorResponse) return auth.errorResponse;
    const { session } = auth;

    const body = await request.json();
    const { id, recordPayment, paymentAmount, paymentMethod = "CASH", cashBookId, notes, ...rest } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Payable ID is required" }, { status: 400 });
    }

    const currentPayables = await getSystemSettingJson<PayableItem[]>("custom_payables", []);
    const idx = currentPayables.findIndex((p) => p.id === id);

    let updatedPayable: PayableItem | null = null;

    if (idx >= 0) {
      const cur = currentPayables[idx];
      if (recordPayment) {
        const payNum = parseFloat(paymentAmount) || 0;
        const newPaid = cur.paidAmount + payNum;
        const newRemaining = Math.max(0, cur.totalAmount - newPaid);
        const newStatus: "UNPAID" | "PARTIAL" | "PAID" = newRemaining <= 0 ? "PAID" : "PARTIAL";

        updatedPayable = {
          ...cur,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        };
        currentPayables[idx] = updatedPayable;

        // If Cash Book selected, record Cash OUT transaction
        if (cashBookId && payNum > 0) {
          await recordCashTransaction({
            cashBookId,
            type: "CASH_OUT",
            category: cur.category || "VENDOR_PAYMENT",
            amount: payNum,
            partyName: cur.vendorName,
            vehicleNumber: cur.vehicleNumber,
            driverName: cur.driverName,
            brokerName: cur.brokerName,
            challanId: cur.challanId,
            challanNumber: cur.challanNumber,
            paymentMethod,
            reference: cur.reference,
            description: `Payment Settled — ${cur.vendorName} (${cur.description})`,
            notes,
          });
        }
      } else {
        const merged: PayableItem = { ...cur, ...rest };
        updatedPayable = merged;
        currentPayables[idx] = merged;
      }
      await setSystemSettingJson("custom_payables", currentPayables);
    } else {
      // If it's a generated challan payable, record settlement into custom_payables
      const payNum = parseFloat(paymentAmount) || 0;
      updatedPayable = {
        id,
        vendorName: body.vendorName || "Payee",
        category: body.category || "TRUCK_HIRE",
        reference: body.reference || `PAY-${id}`,
        vehicleNumber: body.vehicleNumber,
        driverName: body.driverName,
        description: body.description || "Challan hire payment",
        totalAmount: Number(body.totalAmount) || payNum,
        paidAmount: payNum,
        remainingAmount: Math.max(0, (Number(body.totalAmount) || payNum) - payNum),
        status: (Number(body.totalAmount) || payNum) <= payNum ? "PAID" : "PARTIAL",
        createdAt: new Date().toISOString(),
      };
      currentPayables.unshift(updatedPayable);
      await setSystemSettingJson("custom_payables", currentPayables);

      if (cashBookId && payNum > 0) {
        await recordCashTransaction({
          cashBookId,
          type: "CASH_OUT",
          category: updatedPayable.category,
          amount: payNum,
          partyName: updatedPayable.vendorName,
          vehicleNumber: updatedPayable.vehicleNumber,
          driverName: updatedPayable.driverName,
          paymentMethod,
          reference: updatedPayable.reference,
          description: `Challan Hire Payment — ${updatedPayable.vendorName}`,
          notes,
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedPayable });
  } catch (error: any) {
    console.error("[Payables PUT API Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update payable" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const current = await getSystemSettingJson<PayableItem[]>("custom_payables", []);
      const filtered = current.filter((p) => p.id !== id);
      await setSystemSettingJson("custom_payables", filtered);
    }
    return NextResponse.json({ success: true, message: "Payable deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
