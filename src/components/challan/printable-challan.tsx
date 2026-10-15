"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";

interface PrintableChallanProps {
  challan: any;
  onClose?: () => void;
}

export function PrintableChallan({ challan, onClose }: PrintableChallanProps) {
  if (!challan) return null;

  const bilties = challan.consignments || [];
  const totalPackages = bilties.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);
  const totalWeight = bilties.reduce((sum: number, b: any) => sum + (b.weight || 0), 0);
  const totalFreight = bilties.reduce((sum: number, b: any) => sum + (b.freight || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-6 text-slate-900 border border-slate-200 print:border-none print:shadow-none print:p-2 print:my-0">
        {/* Modal Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
          <div>
            <h3 className="text-lg font-black text-slate-900">Official Trip Challan Manifest</h3>
            <p className="text-xs text-slate-500">Challan #{challan.challanNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-2 h-9 px-4"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Manifest</span>
            </Button>
            {onClose && (
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-xl border-slate-200"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="challan-printable-content" data-print-target="true" className="printable-document space-y-4 text-xs font-sans">
          {/* Official Letterhead Header */}
          <PrintHeader
            title="Trip Dispatch Manifest & Fleet Challan"
            documentNumber={challan.challanNumber}
            date={formatDate(challan.dispatchDate || challan.date || challan.createdAt)}
            station={challan.origin ? `${challan.origin} Station` : "Lahore Central Station"}
          />

          {/* Trip & Vehicle Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 rounded-lg border border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Vehicle / Truck #</span>
              <span className="text-xs font-black text-slate-900 font-mono">
                {challan.truckNumber || (challan.vehicle ? challan.vehicle.vehicleNumber : "N/A")}
              </span>
              {challan.brokerName && (
                <span className="text-[10px] font-bold text-blue-700 block mt-0.5">
                  Broker: {challan.brokerName}
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Driver Name & Phone</span>
              <span className="text-xs font-bold text-slate-900">
                {challan.driverName || (challan.driver ? challan.driver.name : "N/A")}{" "}
                <span className="text-[10px] font-mono text-slate-600 block">
                  {challan.driverPhone || (challan.driver ? challan.driver.phone : "")}
                </span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Route (From &rarr; To)</span>
              <span className="text-xs font-bold text-slate-900">
                {challan.origin} → {challan.destination}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispatch Status</span>
              <span className="text-xs font-black text-blue-700 uppercase">
                {challan.status || "IN_TRANSIT"}
              </span>
            </div>
          </div>

          {/* Manifest Table of Loaded Bilties */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                  <th className="p-2 border-r border-slate-700 w-8">#</th>
                  <th className="p-2 border-r border-slate-700">Bilty #</th>
                  <th className="p-2 border-r border-slate-700">Shipper / Sender</th>
                  <th className="p-2 border-r border-slate-700">Consignee / Receiver</th>
                  <th className="p-2 border-r border-slate-700">Goods / Description</th>
                  <th className="p-2 border-r border-slate-700 text-center">Qty</th>
                  <th className="p-2 border-r border-slate-700 text-right">Weight & CBM</th>
                  <th className="p-2 border-r border-slate-700 text-right">Freight</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bilties.map((b: any, idx: number) => (
                  <tr key={b.id || idx} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold font-mono text-red-600">
                      {b.biltyNumber}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <span className="font-semibold block">{b.senderName}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{b.senderPhone}</span>
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <span className="font-semibold block">{b.receiverName}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{b.receiverPhone}</span>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-700 font-medium">
                      {b.packageDetails || b.description || "General Cargo"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{b.quantity || 1}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono whitespace-nowrap">
                      {b.weight
                        ? `${b.weight} kg | ${b.cbm || b.volume || (Math.round((Number(b.weight) / 330) * 10) / 10).toFixed(1)} CBM`
                        : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold font-mono">
                      {formatCurrency(b.freight || 0)}
                    </td>
                    <td className="p-2 text-center font-bold text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {b.paymentStatus || (b.remainingBalance <= 0 ? "PAID" : "TO-PAY")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                  <td colSpan={5} className="p-2 text-right uppercase text-[10px] text-slate-700">
                    Manifest Totals ({bilties.length} Bilties):
                  </td>
                  <td className="p-2 text-center font-mono">{totalPackages}</td>
                  <td className="p-2 text-right font-mono">{totalWeight} kg</td>
                  <td className="p-2 text-right font-mono text-red-600">
                    {formatCurrency(totalFreight)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Trip Financial Ledger (Advance & Balance) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-3 rounded-lg text-xs bg-slate-50">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Gross Bilty Freight</span>
              <span className="font-black text-slate-900">{formatCurrency(challan.totalBiltyFreight || totalFreight)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Truck Hire / Freight</span>
              <span className="font-black text-slate-900">{formatCurrency(challan.truckFreight || 0)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Trip Advance to Driver</span>
              <span className="font-black text-slate-900">{formatCurrency(challan.advancePaidToDriver || 0)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Driver Balance Due</span>
              <span className="font-black text-red-600">
                {formatCurrency(challan.driverBalancePayable || 0)}
              </span>
            </div>
          </div>

          {/* Official Transport Signatures & Legal Notice */}
          <PrintFooter
            notes="NOTICE TO CARRIER: The driver and transport operator acknowledge receipt of the above listed commercial packages in good order and condition. Goods must be delivered directly to the designated receiving station without unauthorized diversion or delay. In case of accident, breakdown, or delay, notify the central dispatch office immediately."
            preparedByLabel="Prepared By"
            checkedByLabel="Checked By"
            authorizedLabel="Authorized Signature"
          />
        </div>
      </div>
    </div>
  );
}
