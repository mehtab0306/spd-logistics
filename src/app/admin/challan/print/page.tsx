"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStoredChallans, getStoredBilties } from "@/lib/local-persistence";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";

function ChallanPrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const challanNumber = searchParams.get("challanNumber") || searchParams.get("num");
  const autoPrint = searchParams.get("autoprint") === "true";

  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let found: any = null;
    const stored = getStoredChallans();

    if (id) {
      found = stored.find((c: any) => String(c.id) === String(id));
    }
    if (!found && challanNumber) {
      found = stored.find((c: any) => String(c.challanNumber).toLowerCase() === String(challanNumber).toLowerCase());
    }

    if (!found && stored.length > 0) {
      found = stored[0];
    }

    if (!found) {
      // Sample fallback challan
      const allBilties = getStoredBilties();
      const sampleBilties = allBilties.slice(0, 4);
      found = {
        id: "chl-sample-1",
        challanNumber: "CHL-2026-9041",
        dispatchDate: new Date().toISOString(),
        origin: "Lahore",
        destination: "Karachi",
        truckNumber: "TLR-7721",
        driverName: "Muhammad Hanif",
        driverPhone: "0301 7788992",
        brokerName: "Haji Qasim Goods Transport Agency",
        status: "IN_TRANSIT",
        consignments: sampleBilties.length > 0 ? sampleBilties : [
          {
            id: "b-1",
            biltyNumber: "SPD-1001",
            senderName: "Packages Limited",
            senderPhone: "042 35811544",
            receiverName: "Karachi Trading Co",
            receiverPhone: "0321 8899001",
            packageDetails: "Packaging Cartons & Paper Rolls",
            quantity: 60,
            weight: 3200,
            cbm: 9.7,
            freight: 120000,
            paymentStatus: "PAID",
          },
          {
            id: "b-2",
            biltyNumber: "SPD-1002",
            senderName: "Crescent Textile Mills",
            senderPhone: "0300 1234567",
            receiverName: "Al-Rahim Fabrics",
            receiverPhone: "0333 4455667",
            packageDetails: "Cotton Yarn Cones",
            quantity: 40,
            weight: 2400,
            cbm: 7.3,
            freight: 95000,
            paymentStatus: "TO-PAY",
          },
        ],
        truckFreight: 180000,
        advancePaidToDriver: 110000,
        driverBalancePayable: 70000,
        totalBiltyFreight: 215000,
      };
    }

    setChallan(found);
    setLoading(false);

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [id, challanNumber, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Preparing A4 Trip Dispatch Manifest...</p>
      </div>
    );
  }

  const bilties = challan.consignments || [];
  const totalPackages = bilties.reduce((sum: number, b: any) => sum + (Number(b.quantity) || 1), 0);
  const totalWeight = bilties.reduce((sum: number, b: any) => sum + (Number(b.weight) || 0), 0);
  const totalFreight = bilties.reduce((sum: number, b: any) => sum + (Number(b.freight || b.totalAmount) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:w-full">
      {/* On-screen control bar - Hidden when printing */}
      <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/challan")}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Challans</span>
          </Button>
          <span className="text-xs text-slate-400">|</span>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Trip Dispatch Manifest #{challan?.challanNumber}
          </p>
        </div>

        <Button
          onClick={() => window.print()}
          className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print A4 Manifest</span>
        </Button>
      </div>

      {/* A4 PRINTABLE DOCUMENT BODY */}
      <div
        id="challan-printable-content"
        data-print-target="true"
        className="printable-document p-6 border-2 border-black rounded-xl bg-white text-black space-y-4 font-sans text-xs print:border-none print:p-0"
      >
        {/* Official Letterhead Header */}
        <PrintHeader
          title="Trip Dispatch Manifest & Fleet Challan"
          documentNumber={challan.challanNumber}
          date={formatDate(challan.dispatchDate || challan.date || challan.createdAt)}
          station={challan.origin ? `${challan.origin} Station` : "Lahore Central Station"}
        />

        {/* Fleet & Route Metadata Bar */}
        <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-black">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Vehicle / Truck #</span>
            <span className="text-xs font-black text-black font-mono">
              {challan.truckNumber || (challan.vehicle ? challan.vehicle.vehicleNumber : "N/A")}
            </span>
            {challan.brokerName && (
              <span className="text-[10px] font-bold text-blue-800 block mt-0.5">
                Broker: {challan.brokerName}
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Driver Name & Phone</span>
            <span className="text-xs font-bold text-black">
              {challan.driverName || (challan.driver ? challan.driver.name : "N/A")}
            </span>
            <span className="text-[10px] font-mono text-slate-600 block">
              {challan.driverPhone || (challan.driver ? challan.driver.phone : "")}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Trip Route</span>
            <span className="text-xs font-bold text-black">
              {challan.origin} → {challan.destination}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispatch Status</span>
            <span className="text-xs font-black text-blue-900 uppercase">
              {challan.status || "IN_TRANSIT"}
            </span>
          </div>
        </div>

        {/* Loaded Bilties Table - Fixed 100% width auto-fit without horizontal cutoff */}
        <div className="w-full overflow-hidden">
          <table
            className="w-full text-left text-[9px] border-collapse border border-black table-fixed"
            style={{ width: "100%", tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-[9px] uppercase border-b border-black text-center">
                <th className="p-1 border border-black">#</th>
                <th className="p-1 border border-black">Bilty #</th>
                <th className="p-1 border border-black">Booking Date</th>
                <th className="p-1 border border-black">Sender</th>
                <th className="p-1 border border-black">Receiver</th>
                <th className="p-1 border border-black">Packages</th>
                <th className="p-1 border border-black">Cargo Details</th>
                <th className="p-1 border border-black">Weight</th>
                <th className="p-1 border border-black">Freight Mode</th>
                <th className="p-1 border border-black text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {bilties.map((b: any, idx: number) => (
                <tr key={b.id || idx}>
                  <td className="p-1 border border-black text-center font-mono font-bold">{idx + 1}</td>
                  <td className="p-1 border border-black font-bold font-mono text-red-700 truncate">
                    {b.biltyNumber}
                  </td>
                  <td className="p-1 border border-black text-center font-mono whitespace-nowrap truncate">
                    {formatDate(b.date || b.createdAt)}
                  </td>
                  <td className="p-1 border border-black truncate">
                    <span className="font-semibold block truncate">{b.senderName}</span>
                    <span className="text-[8px] text-slate-500 font-mono block truncate">{b.senderPhone}</span>
                  </td>
                  <td className="p-1 border border-black truncate">
                    <span className="font-semibold block truncate">{b.receiverName}</span>
                    <span className="text-[8px] text-slate-500 font-mono block truncate">{b.receiverPhone}</span>
                  </td>
                  <td className="p-1 border border-black text-center font-bold font-mono">
                    {b.quantity || 1}
                  </td>
                  <td className="p-1 border border-black text-slate-800 truncate">
                    {b.packageDetails || b.description || "General Cargo"}
                  </td>
                  <td className="p-1 border border-black text-center font-mono whitespace-nowrap truncate">
                    {b.weight ? `${b.weight} kg` : "—"}
                  </td>
                  <td className="p-1 border border-black text-center font-bold uppercase text-[8.5px] truncate">
                    {b.freightAsPer || b.amountType || b.paymentStatus || "To Pay"}
                  </td>
                  <td className="p-1 border border-black text-right font-black font-mono text-black truncate">
                    {formatCurrency(b.remainingBalance !== undefined ? b.remainingBalance : (b.freight || b.totalAmount || 0))}
                  </td>
                </tr>
              ))}
              {bilties.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-3 text-center text-slate-400 italic border border-black">
                    No consignments loaded on this challan trip.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-black text-[9px]">
                <td colSpan={5} className="p-1 text-right uppercase text-black">
                  Manifest Totals ({bilties.length} Bilties):
                </td>
                <td className="p-1 text-center font-mono">{totalPackages}</td>
                <td></td>
                <td className="p-1 text-center font-mono">{totalWeight} kg</td>
                <td></td>
                <td className="p-1 text-right font-mono text-red-700 truncate">
                  {formatCurrency(totalFreight)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Trip Financial Ledger & Driver Advance Slip */}
        <div className="grid grid-cols-4 gap-2 border border-black p-2.5 rounded-lg text-xs bg-slate-50">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block">Gross Bilty Freight</span>
            <span className="font-black text-black font-mono">{formatCurrency(challan.totalBiltyFreight || totalFreight)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block">Truck Hire / Freight</span>
            <span className="font-black text-black font-mono">{formatCurrency(challan.truckFreight || 0)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block">Trip Advance to Driver</span>
            <span className="font-black text-emerald-800 font-mono">{formatCurrency(challan.advancePaidToDriver || 0)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block">Driver Balance Due</span>
            <span className="font-black text-red-700 font-mono">
              {formatCurrency(challan.driverBalancePayable || 0)}
            </span>
          </div>
        </div>

        {/* Official Transport Signatures & 3-Part Carrier Slips */}
        <PrintFooter
          notes="NOTICE TO CARRIER: The driver and transport operator acknowledge receipt of the above listed commercial packages in good order and condition. Goods must be delivered directly to the designated receiving hub without unauthorized diversion or delay. In case of accident, breakdown, or delay, notify the central dispatch office immediately."
          preparedByLabel="Prepared By"
          checkedByLabel="Driver Signature"
          authorizedLabel="Station Manager"
        />
      </div>
    </div>
  );
}

export default function ChallanPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs font-semibold text-slate-500">Loading Challan Manifest Print View...</p>
        </div>
      }
    >
      <ChallanPrintContent />
    </Suspense>
  );
}
