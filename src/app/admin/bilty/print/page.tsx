"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStoredBilties } from "@/lib/local-persistence";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2, Package } from "lucide-react";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";

function BiltyPrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const biltyNumber = searchParams.get("biltyNumber") || searchParams.get("num");
  const autoPrint = searchParams.get("autoprint") === "true";

  const [bilty, setBilty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let found: any = null;
    const stored = getStoredBilties();

    if (id) {
      found = stored.find((b: any) => String(b.id) === String(id));
    }
    if (!found && biltyNumber) {
      found = stored.find((b: any) => String(b.biltyNumber).toLowerCase() === String(biltyNumber).toLowerCase());
    }

    if (!found && stored.length > 0) {
      found = stored[0];
    }

    if (!found) {
      // Sample fallback bilty
      found = {
        id: "bilty-sample",
        biltyNumber: "SPD-78642",
        trackingId: "TRK-992144",
        date: new Date().toISOString(),
        origin: "Lahore",
        destination: "Karachi",
        warehouse: "LAHORE",
        senderName: "Al-Rahman Textiles (Pvt) Ltd",
        senderPhone: "0300 8472910",
        senderAddress: "Kot Lakhpat Industrial Area, Lahore",
        receiverName: "Karachi Silk Emporium",
        receiverPhone: "0321 9928371",
        receiverAddress: "Cloth Market, M.A. Jinnah Road, Karachi",
        packageDetails: "Textile Cotton Yarn Cones (Grade A)",
        quantity: 45,
        weight: 1250,
        vehicleNumber: "LES-9481",
        driverName: "Muhammad Aslam",
        freight: 85000,
        additionalCharges: 3500,
        discount: 0,
        totalAmount: 88500,
        paidAmount: 88500,
        remainingBalance: 0,
        paymentStatus: "PAID",
      };
    }

    setBilty(found);
    setLoading(false);

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [id, biltyNumber, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Preparing A4 Consignment Bilty Voucher...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:w-full">
      {/* On-screen control bar - Hidden when printing */}
      <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/bilty")}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bilties</span>
          </Button>
          <span className="text-xs text-slate-400">|</span>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Official Consignment Bilty #{bilty?.biltyNumber}
          </p>
        </div>

        <Button
          onClick={() => window.print()}
          className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print A4 Letterhead Bilty</span>
        </Button>
      </div>

      {/* A4 PRINTABLE DOCUMENT BODY */}
      <div id="printable-bilty" className="p-6 border-2 border-black rounded-xl bg-white text-black space-y-4 font-sans text-xs print:border-none print:p-0">
        {/* Official Letterhead Header */}
        <PrintHeader
          title="Consignment Bilty Voucher / Goods Receipt"
          documentNumber={bilty?.biltyNumber}
          station={bilty?.warehouse ? `${bilty.warehouse} Station` : "Lahore Central Station"}
          date={bilty ? formatDate(bilty.date) : undefined}
        />

        {/* Route & Booking Metadata */}
        <div className="grid grid-cols-4 gap-2 border border-black p-2.5 bg-slate-50/50 font-semibold text-[11px]">
          <div>
            <span className="text-slate-500 uppercase text-[9px] block">Booking Date</span>
            <span>{bilty ? formatDate(bilty.date) : ""}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[9px] block">Origin Hub</span>
            <span className="font-bold text-black">{bilty?.origin}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[9px] block">Destination Hub</span>
            <span className="font-bold text-black">{bilty?.destination}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[9px] block">Booking Station</span>
            <span className="font-bold text-red-700">{bilty?.warehouse || "LAHORE"}</span>
          </div>
        </div>

        {/* Shipper & Consignee Boxes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-black rounded-lg bg-white">
            <p className="font-black uppercase text-[10px] text-blue-900 border-b border-slate-300 pb-1 mb-1.5">
              Consignor / Shipper Details
            </p>
            <p className="font-bold text-xs text-black">{bilty?.senderName}</p>
            <p className="text-[11px] font-mono mt-0.5">{bilty?.senderPhone || "No Phone"}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{bilty?.senderAddress || "Dispatch Station"}</p>
          </div>

          <div className="p-3 border border-black rounded-lg bg-white">
            <p className="font-black uppercase text-[10px] text-red-700 border-b border-slate-300 pb-1 mb-1.5">
              Consignee / Receiver Details
            </p>
            <p className="font-bold text-xs text-black">{bilty?.receiverName}</p>
            <p className="text-[11px] font-mono mt-0.5">{bilty?.receiverPhone || "No Phone"}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{bilty?.receiverAddress || "Destination Station"}</p>
          </div>
        </div>

        {/* Package & Transport Vehicle Details Table */}
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[10px] font-bold uppercase border-b border-black">
              <tr>
                <th className="p-2 border-r border-black">Package Description & Marks</th>
                <th className="p-2 border-r border-black text-center w-20">Quantity</th>
                <th className="p-2 border-r border-black text-right w-28">Weight (KG)</th>
                <th className="p-2 border-r border-black w-32">Vehicle / Truck #</th>
                <th className="p-2 w-36">Driver In-Charge</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              <tr>
                <td className="p-2 border-r border-black font-semibold">
                  {bilty?.packageDetails || "Commercial General Cargo"}
                </td>
                <td className="p-2 border-r border-black text-center font-bold font-mono">
                  {bilty?.quantity || 1}
                </td>
                <td className="p-2 border-r border-black text-right font-bold font-mono">
                  {bilty?.weight ? `${bilty.weight} kg` : "N/A"}
                </td>
                <td className="p-2 border-r border-black font-mono font-bold">
                  {bilty?.vehicleNumber || "Pending Fleet Assignment"}
                </td>
                <td className="p-2 font-bold">
                  {bilty?.driverName || "Assigned Linehaul Driver"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Freight & Charges Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-80 border-2 border-black rounded-lg p-3 space-y-1.5 bg-slate-50 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Base Freight Charges:</span>
              <span className="font-bold font-mono">{formatCurrency(bilty?.freight || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Labor / Handling / Toll:</span>
              <span className="font-mono">{formatCurrency(bilty?.additionalCharges || 0)}</span>
            </div>
            {bilty?.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Special Discount:</span>
                <span className="font-mono">-{formatCurrency(bilty.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-1 font-black text-sm text-slate-900">
              <span>Total Gross Freight:</span>
              <span className="font-mono text-red-700">{formatCurrency(bilty?.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Amount Paid / Advance:</span>
              <span className="font-mono">{formatCurrency(bilty?.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-black text-xs">
              <span>Payment Terms:</span>
              <span className="uppercase text-slate-900">{bilty?.paymentStatus || (bilty?.remainingBalance <= 0 ? "PAID" : "TO-PAY")}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-red-700">
              <span>Balance Payable:</span>
              <span className="font-mono">{formatCurrency(bilty?.remainingBalance || 0)}</span>
            </div>
          </div>
        </div>

        {/* Official Transport Signatures */}
        <PrintFooter
          notes="The carrier acknowledges receipt of goods in sound condition. Goods are transported under standard conditions of carriage. Any claim for damage, pilferage or shortage must be filed within 24 hours of delivery."
          preparedByLabel="Prepared By"
          checkedByLabel="Checked By"
          authorizedLabel="Authorized Signature"
        />
      </div>
    </div>
  );
}

export default function BiltyPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs font-semibold text-slate-500">Loading Bilty Print View...</p>
        </div>
      }
    >
      <BiltyPrintContent />
    </Suspense>
  );
}
