import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { getChallanPnL } from "@/lib/accounting-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await validateAdminSession(request, ["SUPER_ADMIN", "ADMIN", "STAFF"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const challanId = searchParams.get("challanId") || searchParams.get("id") || "";

    if (!challanId) {
      return NextResponse.json(
        { success: false, error: "challanId parameter is required" },
        { status: 400 }
      );
    }

    const pnl = await getChallanPnL(challanId);

    if (!pnl) {
      return NextResponse.json(
        { success: false, error: "Challan not found or no financial records available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pnl,
    });
  } catch (error: any) {
    console.error("[Challan PnL API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate Challan P&L" },
      { status: 500 }
    );
  }
}
