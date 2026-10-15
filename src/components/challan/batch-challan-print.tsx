"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface BatchChallanPrintProps {
  challans: any[];
  onClose: () => void;
}

export function BatchChallanPrint({ challans, onClose }: BatchChallanPrintProps) {
  if (!challans || challans.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block print:inset-auto print:z-auto"
      data-active="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-6 text-slate-900 border border-slate-200 print:border-none print:shadow-none print:p-0 print:my-0 print:w-full print:max-w-none">
        {/* Modal Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Batch Transit Dispatch Manifests ({challans.length} Trips)
            </h3>
            <p className="text-xs text-slate-500">
              Each manifest will print on a separate A4 Portrait page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 h-9 px-4 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({challans.length}) Manifests</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PRINTABLE BATCH CONTAINER */}
        <div
          id="challan-printable-content"
          data-print-target="true"
          className="printable-document space-y-8 print:space-y-0 text-xs font-sans text-black bg-white"
        >
          {challans.map((challan: any, challanIdx: number) => {
            const bilties = challan.consignments || [];
            const totalPackages = bilties.reduce((sum: number, b: any) => sum + (Number(b.quantity) || 1), 0);
            const totalWeight = bilties.reduce((sum: number, b: any) => sum + (Number(b.weight) || 0), 0);
            const totalFreight = bilties.reduce(
              (sum: number, b: any) => sum + (Number(b.remainingBalance !== undefined ? b.remainingBalance : (b.freight || b.totalAmount || 0))),
              0
            );

            const challanNo = challan.challanNumber || challan.id || `CHL-${challanIdx + 1}`;
            const dispatchDate = formatDate(challan.dispatchDate || challan.date || challan.createdAt);
            const origin = challan.origin || "Lahore";
            const destination = challan.destination || "Karachi";
            const truckNo = challan.truckNumber || (challan.vehicle ? challan.vehicle.vehicleNumber : "LES-8921");
            const driverName = challan.driverName || (challan.driver ? challan.driver.name : "Muhammad Khan");
            const driverPhone = challan.driverPhone || (challan.driver ? challan.driver.phone : "0301 5566778");
            
            const truckHireCost = Number(challan.truckFreight || challan.brokerFreight || 0);
            const advancePaid = Number(challan.advancePaidToDriver || challan.brokerAdvance || 0);
            const balancePayable = challan.driverBalancePayable !== undefined 
              ? Number(challan.driverBalancePayable)
              : (truckHireCost - advancePaid);

            return (
              <div
                key={challan.id || challanIdx}
                className="challan-single-manifest border-2 border-black rounded-xl p-5 mb-8 print:border-none print:p-0 print:mb-0 print:break-after-page space-y-3"
                style={{ pageBreakAfter: challanIdx < challans.length - 1 ? "always" : "auto" }}
              >
                {/* Header */}
                <div className="border-b-2 border-black pb-3 text-black">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="/images/spd-logo.jpg"
                        alt="SPD Logo"
                        className="h-16 w-16 object-contain rounded-full border-2 border-red-600 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/spd-logo.png";
                        }}
                      />
                      <div>
                        <h1 className="text-lg sm:text-xl font-black text-red-600 uppercase tracking-tight leading-tight">
                          SUPER PAK DATA WALE GOODS TRANSPORT CO.®
                        </h1>
                        <p className="text-[9.5px] font-black text-slate-900 uppercase tracking-wider mt-0.5">
                          Govt. Licensed Inter-City Goods Carrier & Heavy Fleet Operator • Est. 1996
                        </p>
                        <div className="text-[8.5px] text-slate-700 leading-tight mt-1 space-y-0.5">
                          <p>
                            <span className="font-bold text-black">Lahore Station:</span> Outside Bhati Gate / Badami Bagh Truck Stand, Lahore • Tel: 042-37725944 / 0300-8441234
                          </p>
                          <p>
                            <span className="font-bold text-black">Karachi Terminal:</span> Plot 12-A, Mauripur Road, Hawksbay Truck Stand, Karachi • Tel: 021-32354411 / 0321-2244556
                          </p>
                          <p className="font-mono font-bold text-black">
                            Income Tax NTN: 4774077-5 • Sales Tax STRN: 32-77-8761-123-45
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right border-2 border-black p-2 rounded bg-slate-50 min-w-[200px] shrink-0">
                      <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Official Transport Record</p>
                      <p className="text-xs font-black text-black uppercase leading-tight mt-0.5">DISPATCH MANIFEST</p>
                      <p className="text-[11px] font-mono font-black text-red-700 mt-0.5">
                        CHALLAN #: {challanNo}
                      </p>
                      <p className="text-[9px] text-slate-800 mt-0.5">
                        Date: {dispatchDate}
                      </p>
                      <p className="text-[8.5px] font-bold text-emerald-800 uppercase mt-0.5">
                        STATUS: {challan.status || "IN_TRANSIT"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Challan Details Box */}
                <div className="border border-black p-2 bg-slate-50 rounded text-[9.5px] leading-tight">
                  <div className="grid grid-cols-5 gap-2 text-black">
                    <div className="border-r border-slate-300 pr-2">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Challan #</span>
                      <span className="font-mono font-black text-red-700 text-[11px] block">{challanNo}</span>
                      <span className="text-[8px] text-slate-600 block mt-0.5">
                        Hiring: {challan.hiringMode === "MARKET_BROKER" ? "Market Broker" : "Company Fleet"}
                      </span>
                    </div>
                    <div className="border-r border-slate-300 pr-2">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Dispatch Date</span>
                      <span className="font-bold text-black text-[10px] block">{dispatchDate}</span>
                      <span className="text-[8px] text-slate-600 block mt-0.5">Hub: {challan.warehouse || origin}</span>
                    </div>
                    <div className="border-r border-slate-300 pr-2">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Trip Route</span>
                      <span className="font-black text-black text-[10.5px] block uppercase">
                        {origin} ➔ {destination}
                      </span>
                      <span className="text-[8px] text-slate-600 block mt-0.5">Direct Highway Corridor</span>
                    </div>
                    <div className="border-r border-slate-300 pr-2">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Vehicle No</span>
                      <span className="font-mono font-black text-black text-[10.5px] block">{truckNo}</span>
                      {challan.brokerName && (
                        <span className="text-[8px] font-bold text-blue-800 block truncate">Broker: {challan.brokerName}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Driver In-Charge</span>
                      <span className="font-bold text-black text-[10px] block truncate">{driverName}</span>
                      <span className="font-mono text-[8.5px] text-slate-700 block">{driverPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Cargo Manifest Table */}
                <div className="w-full overflow-hidden">
                  <table
                    className="w-full text-left text-[9px] border-collapse border border-black table-fixed"
                    style={{ width: "100%", tableLayout: "fixed" }}
                  >
                    <colgroup>
                      <col style={{ width: "4%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-100 text-black font-bold text-[9px] uppercase border-b border-black text-center">
                        <th className="p-1 border border-black">S.NO</th>
                        <th className="p-1 border border-black">BILTY #</th>
                        <th className="p-1 border border-black">DATE</th>
                        <th className="p-1 border border-black">SENDER</th>
                        <th className="p-1 border border-black">RECEIVER</th>
                        <th className="p-1 border border-black">GOODS / PACKAGES</th>
                        <th className="p-1 border border-black">WEIGHT</th>
                        <th className="p-1 border border-black">FREIGHT TYPE</th>
                        <th className="p-1 border border-black text-right">TO PAY / ADVANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bilties.map((b: any, idx: number) => {
                        const bDate = formatDate(b.date || b.createdAt);
                        const bAmount = b.remainingBalance !== undefined ? b.remainingBalance : (b.freight || b.totalAmount || 0);
                        return (
                          <tr key={b.id || idx}>
                            <td className="p-1 border border-black text-center font-mono font-bold">{idx + 1}</td>
                            <td className="p-1 border border-black font-bold font-mono text-red-700 truncate">
                              {b.biltyNumber || `B-${idx + 1}`}
                            </td>
                            <td className="p-1 border border-black text-center font-mono whitespace-nowrap truncate">
                              {bDate}
                            </td>
                            <td className="p-1 border border-black truncate">
                              <span className="font-semibold block truncate">{b.senderName || "Sender"}</span>
                              {b.senderPhone && <span className="text-[7.5px] text-slate-500 font-mono block truncate">{b.senderPhone}</span>}
                            </td>
                            <td className="p-1 border border-black truncate">
                              <span className="font-semibold block truncate">{b.receiverName || "Receiver"}</span>
                              {b.receiverPhone && <span className="text-[7.5px] text-slate-500 font-mono block truncate">{b.receiverPhone}</span>}
                            </td>
                            <td className="p-1 border border-black truncate">
                              <span className="font-bold text-black">{b.quantity || 1} Pkgs</span> - {b.packageDetails || b.description || "Commercial Cargo"}
                            </td>
                            <td className="p-1 border border-black text-center font-mono whitespace-nowrap truncate">
                              {b.weight ? `${b.weight} kg` : "—"}
                            </td>
                            <td className="p-1 border border-black text-center font-bold uppercase text-[8.5px] truncate">
                              {b.freightAsPer || b.amountType || b.paymentStatus || "To Pay"}
                            </td>
                            <td className="p-1 border border-black text-right font-black font-mono text-black truncate">
                              {formatCurrency(bAmount)}
                            </td>
                          </tr>
                        );
                      })}
                      {bilties.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-3 text-center text-slate-400 italic border border-black">
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
                        <td className="p-1 text-center font-mono font-bold">
                          {totalPackages} Pkgs
                        </td>
                        <td className="p-1 text-center font-mono font-bold">
                          {totalWeight} kg
                        </td>
                        <td className="p-1 text-center font-bold uppercase text-slate-700">
                          Net Due
                        </td>
                        <td className="p-1 text-right font-mono font-black text-red-700 truncate">
                          {formatCurrency(totalFreight)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Trip Financials */}
                <div className="border border-black rounded p-2 bg-slate-50 text-[9.5px]">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="border-r border-slate-300 pr-2 text-left">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Total Freight (Bilties)</span>
                      <span className="font-mono font-black text-black text-[11px] block">
                        {formatCurrency(challan.totalBiltyFreight || challan.totalAmount || totalFreight)}
                      </span>
                    </div>
                    <div className="border-r border-slate-300 pr-2 text-left">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Truck Hire Cost</span>
                      <span className="font-mono font-black text-black text-[11px] block">
                        {formatCurrency(truckHireCost)}
                      </span>
                    </div>
                    <div className="border-r border-slate-300 pr-2 text-left">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Advance Paid to Driver</span>
                      <span className="font-mono font-black text-emerald-800 text-[11px] block">
                        {formatCurrency(advancePaid)}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Balance Payable at Destination</span>
                      <span className="font-mono font-black text-red-700 text-[11px] block">
                        {formatCurrency(balancePayable)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3-Part Signatures Footer */}
                <div className="border-t border-black pt-3 mt-4 text-black font-sans break-inside-avoid">
                  <p className="text-[8px] text-slate-700 text-justify leading-tight mb-3">
                    <strong>LEGAL NOTICE TO CARRIER & RECEPTIONIST:</strong> The driver/carrier acknowledges receipt of the above listed commercial consignments in sound condition. Delivery must be effected strictly at the authorized destination hub. Goods must not be transferred or detained. In case of en-route emergency, accident or highway breakdown, notify Central Dispatch immediately.
                  </p>

                  <div className="grid grid-cols-3 gap-6 text-center text-xs pt-3">
                    <div>
                      <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                        Prepared By: Dispatch Officer
                      </div>
                      <div className="text-[8px] text-slate-600 mt-0.5">Booking / Outward Terminal Control</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                        Driver Acceptance Signature
                      </div>
                      <div className="text-[8px] text-slate-600 mt-0.5">Fleet Operator / Driver In-Charge</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                        Authorized Station Seal
                      </div>
                      <div className="text-[8px] text-slate-600 mt-0.5">Super Pak Data Wale Goods Transport Co.®</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
