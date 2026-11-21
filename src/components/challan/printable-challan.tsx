"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, X, ExternalLink, ArrowLeft } from "lucide-react";

interface PrintableChallanProps {
  challan: any;
  onClose?: () => void;
  isFullPage?: boolean;
}

export function PrintableChallan({ challan, onClose, isFullPage = false }: PrintableChallanProps) {
  const [hideFreight, setHideFreight] = React.useState(false);

  if (!challan) return null;

  const bilties = challan.consignments || [];
  const totalPackages = bilties.reduce((sum: number, b: any) => sum + (Number(b.quantity || b.packagesCount) || 1), 0);
  const totalWeight = bilties.reduce((sum: number, b: any) => sum + (Number(b.weight) || 0), 0);
  const totalFreight = bilties.reduce(
    (sum: number, b: any) => sum + (Number(b.remainingBalance !== undefined ? b.remainingBalance : (b.freight || b.totalAmount || 0))),
    0
  );

  const challanNo = challan.challanNumber || challan.id || "CHL-2026";
  const dispatchDate = formatDate(challan.dispatchDate || challan.date || challan.createdAt);
  const origin = challan.origin || "Karachi";
  const destination = challan.destination || "Lahore";
  const truckNo = challan.truckNumber || (challan.vehicle ? (challan.vehicle.vehicleNumber || challan.vehicle.registrationNumber) : "LES-8921");
  const driverName = challan.driverName || (challan.driver ? challan.driver.name : "Muhammad Khan");
  const driverPhone = challan.driverPhone || (challan.driver ? challan.driver.phone : "0300-2024433");
  
  const truckHireCost = Number(challan.truckFreight || challan.brokerFreight || 0);
  const advancePaid = Number(challan.advancePaidToDriver || challan.brokerAdvance || 0);
  const balancePayable = challan.driverBalancePayable !== undefined 
    ? Number(challan.driverBalancePayable)
    : (truckHireCost - advancePaid);

  const wrapperClass = isFullPage
    ? "challan-print-single max-w-4xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none print:w-full"
    : "challan-print-single fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible print:block print:inset-auto print:z-auto";

  const cardClass = isFullPage
    ? "relative w-full bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-slate-900 border border-slate-200 print:border-none print:shadow-none print:p-0 print:my-0"
    : "overflow-y-auto max-h-[85vh] w-full max-w-4xl bg-white p-6 sm:p-8 rounded-b-xl shadow-2xl text-slate-900 border border-t-0 border-slate-200 print:border-none print:shadow-none print:p-0 print:my-0 print:w-full print:max-w-none print:max-h-none print:overflow-visible";

  return (
    <div className={wrapperClass} data-active="true">
      {/* Sticky, highly visible top-right Close Bar for modal mode */}
      {!isFullPage && (
        <div className="sticky top-0 z-[10000] w-full max-w-4xl bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center justify-between rounded-t-xl border-b border-slate-700 shadow-xl print:hidden">
          <div className="text-white font-bold text-sm flex items-center gap-2">
            <span>📄 Dispatch Manifest Preview (Challan #{challanNo})</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-lg border border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={hideFreight}
                onChange={(e) => setHideFreight(e.target.checked)}
                className="rounded text-spd-red w-3.5 h-3.5"
              />
              <span className="hidden sm:inline">Hide Freight</span>
            </label>
            <Link
              href={`/admin/challan/${challan.id || challanNo}/print`}
              target="_blank"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Page</span>
            </Link>
            <button 
              type="button"
              onClick={() => window.print()} 
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              🖨️ Print
            </button>
            {onClose && (
              <button 
                type="button"
                onClick={onClose} 
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer"
              >
                ✖ Close (Back)
              </button>
            )}
          </div>
        </div>
      )}

      <div className={cardClass}>
        {/* Full Page Controls - Strictly Hidden when printing */}
        {isFullPage && (
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 print:hidden">
            <div className="flex items-center gap-3">
              <Link href="/admin/challan-in-transit">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 h-9">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Fleet</span>
                </Button>
              </Link>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Trip Dispatch Manifest & Fleet Challan
                </h3>
                <p className="text-xs text-slate-500 font-mono">Challan #{challanNo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={hideFreight}
                  onChange={(e) => setHideFreight(e.target.checked)}
                  className="rounded text-spd-red w-4 h-4"
                />
                <span>Hide Bilty Freight (Market Challan)</span>
              </label>

              <Button
                onClick={() => window.print()}
                className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 h-9 px-4 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print A4 Manifest</span>
              </Button>
            </div>
          </div>
        )}

        {/* PRINTABLE DOCUMENT BODY (Exact A4 Corporate Spec) */}
        <div
          id="challan-printable-content"
          data-print-target="true"
          className="printable-document space-y-3 text-xs font-sans text-black bg-white"
        >
          {/* Header: SUPER PAK DATA WALE GOODS TRANSPORT CO.® */}
          <div className="border-b-2 border-black pb-3 text-black">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/spd-logo.png"
                  alt="SPD Logo"
                  className="h-16 w-16 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/spd-logo.jpg";
                  }}
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-red-600 uppercase tracking-tight leading-tight">
                    SUPER PAK DATA WALE GOODS TRANSPORT CO.®
                  </h1>
                  <p className="text-[9.5px] font-bold text-slate-800 uppercase tracking-wider mt-0.5">
                    All Pakistan 24 Hours Urgent, Container, Mazda &amp; Train Service Available
                  </p>
                  <div className="text-[8.5px] text-slate-700 leading-tight mt-1 space-y-0.5">
                    <p>
                      <span className="font-bold text-black">Head Office Karachi:</span> Plot # 9, Gate No 1, Street No 4, Truck Stand, Hawksbay Road, Karachi, Pakistan. • Tel: 021-32351333, 021-32352688 / 0300-2024433, 0321-2024433
                    </p>
                    <p>
                      <span className="font-bold text-black">Lahore Office:</span> Saggian Bypass, Hazrat Ali Road, Opposite IGG House, Lahore, Pakistan. • Tel: 0325-2024433, 0301-8264433, 0300-2928633
                    </p>
                    <p className="text-slate-600 font-medium">
                      Email: superpakdatawale@gmail.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right border-2 border-black p-2 rounded bg-slate-50 min-w-[200px] shrink-0">
                <p className="text-xs font-black text-black uppercase leading-tight">DISPATCH MANIFEST</p>
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

          {/* Cargo Manifest Table (Exact 9 Columns: [S.NO | BILTY # | DATE | SENDER | RECEIVER | GOODS / PACKAGES | WEIGHT | FREIGHT TYPE | TO PAY / ADVANCE]) */}
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
                  <th className="p-1 border border-black text-right">
                    {hideFreight ? "STATUS" : "TO PAY / ADVANCE"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bilties.map((b: any, idx: number) => {
                  const bDate = formatDate(b.date || b.bookingDate || b.createdAt);
                  const bAmount = b.remainingBalance !== undefined ? b.remainingBalance : (b.freight || b.totalAmount || b.totalFreight || 0);
                  const isReceiverBilled = b.billTo === "Receiver" || b.billTo === "Consignee" || (!b.billTo && (b.freightAsPer === "To Pay" || b.paymentMode === "To Pay" || b.paymentMode === "TO-PAY"));
                  const isSenderBilled = b.billTo === "Sender" || b.billTo === "Consignor" || (!b.billTo && !isReceiverBilled);

                  const bookedCargo = (Array.isArray(b.items) && b.items.length > 0
                    ? b.items.map((i: any) => [i.detail, i.bagSpec || i.cartonSpec || i.containerSpec || i.drumSpec || i.bundleDescription].filter(Boolean).join(" - ")).filter(Boolean).join(" • ")
                    : "") || b.packageDetails || b.itemDescription || b.description || "Commercial Cargo";

                  const bookedWeight = (b.weight !== null && b.weight !== undefined && Number(b.weight) > 0)
                    ? `${b.weight} kg`
                    : (b.items && b.items[0]?.weight ? `${b.items[0].weight} kg` : "—");

                  const bookedQuantity = b.quantity || b.packagesCount || (b.items && b.items[0]?.quantity) || 1;

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
                        <div className="flex items-center gap-1">
                          <span className="font-semibold truncate">{b.senderName || "Sender"}</span>
                          {isSenderBilled && (
                            <span className="text-[7px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded shrink-0">
                              Bill To
                            </span>
                          )}
                        </div>
                        {b.senderPhone && <span className="text-[7.5px] text-slate-500 font-mono block truncate">{b.senderPhone}</span>}
                      </td>
                      <td className="p-1 border border-black truncate">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold truncate">{b.receiverName || "Receiver"}</span>
                          {isReceiverBilled && (
                            <span className="text-[7px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 rounded shrink-0">
                              Bill To
                            </span>
                          )}
                        </div>
                        {b.receiverPhone && <span className="text-[7.5px] text-slate-500 font-mono block truncate">{b.receiverPhone}</span>}
                      </td>
                      <td className="p-1 border border-black truncate" title={bookedCargo}>
                        <span className="font-bold text-black">{bookedQuantity} Pkgs</span> - {bookedCargo}
                      </td>
                      <td className="p-1 border border-black text-center font-mono whitespace-nowrap truncate">
                        {bookedWeight}
                      </td>
                      <td className="p-1 border border-black text-center font-bold uppercase text-[8.5px] truncate">
                        {b.freightAsPer || b.amountType || b.paymentStatus || "To Pay"}
                      </td>
                      <td className="p-1 border border-black text-right font-black font-mono text-black truncate">
                        {hideFreight ? (
                          <span className="text-slate-500 font-semibold italic text-[8px]">CONFIDENTIAL</span>
                        ) : (
                          formatCurrency(bAmount)
                        )}
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
                    {hideFreight ? (
                      <span className="text-slate-500 font-semibold italic text-[8px]">CONFIDENTIAL</span>
                    ) : (
                      formatCurrency(totalFreight)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Trip Financials Block: Total Freight | Truck Hire Cost | Advance Paid to Driver | Balance Payable at Destination */}
          <div className="border border-black rounded p-2 bg-slate-50 text-[9.5px]">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="border-r border-slate-300 pr-2 text-left">
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Total Freight (Bilties)</span>
                <span className="font-mono font-black text-black text-[11px] block">
                  {hideFreight ? "CONFIDENTIAL" : formatCurrency(challan.totalBiltyFreight || challan.totalAmount || totalFreight)}
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

          {/* Formal 3-Part Signatures Footer */}
          <div className="border-t border-black pt-3 mt-4 text-black font-sans break-inside-avoid">
            <p className="text-[8px] text-slate-700 text-justify leading-tight mb-3">
              <strong>LEGAL NOTICE TO CARRIER & RECEPTIONIST:</strong> The driver/carrier acknowledges receipt of the above listed commercial consignments in sound condition. Delivery must be effected strictly at the authorized destination hub. Goods must not be transferred or detained. In case of en-route emergency, accident or highway breakdown, notify Central Dispatch immediately.
            </p>

            <div className="grid grid-cols-3 gap-6 text-center text-xs pt-3">
              <div>
                <div className="h-14" />
                <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                  Prepared By: Dispatch Officer
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5">Booking / Outward Terminal Control</div>
              </div>
              <div>
                <div className="h-14" />
                <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                  Driver Acceptance Signature
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5">Fleet Operator / Driver In-Charge</div>
              </div>
              <div>
                <div className="h-14" />
                <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
                  Authorized Station Seal
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5">Super Pak Data Wale Goods Transport Co.®</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
