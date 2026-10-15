"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate, numberToWordsPKR } from "@/lib/utils";
import { BiltyTransportHeader } from "./bilty-transport-header";
import { BiltyQrCode } from "./bilty-qr-code";

interface BiltyConsignmentNoteProps {
  bilty: any;
  defaultCopy?: "Customer Copy" | "Driver / Fleet Copy" | "Office Copy";
  hideControls?: boolean;
}

export function BiltyConsignmentNote({
  bilty,
  defaultCopy = "Customer Copy",
  hideControls = false,
}: BiltyConsignmentNoteProps) {
  const [selectedCopy, setSelectedCopy] = useState<"Customer Copy" | "Driver / Fleet Copy" | "Office Copy">(defaultCopy);

  if (!bilty) return null;

  const biltyNumber = bilty.biltyNumber || "BLT-PENDING";
  const trackingId = bilty.trackingId || bilty.biltyNumber || bilty.id;
  const trackingUrl = `https://spd-logistics-live.netlify.app/tracking?id=${encodeURIComponent(bilty.biltyNumber || bilty.id || trackingId)}`;

  // Parse items
  const items: any[] = Array.isArray(bilty.items) && bilty.items.length > 0
    ? bilty.items
    : [
        {
          detail: bilty.packageDetails || "General Merchandise Commercial Cargo",
          quantity: bilty.quantity || 1,
          weight: bilty.weight || 0,
          volume: bilty.cpm || 0,
          rate: bilty.freight || 0,
          freightAsPer: "Fixed Freight",
          freight: bilty.freight || 0,
        },
      ];

  // Additional charges breakdown
  const breakdown = bilty.additionalChargesBreakdown || {};
  const labour = parseFloat(breakdown.labour) || 0;
  const lifterCrane = parseFloat(breakdown.lifterCrane) || 0;
  const pickupLocal = parseFloat(breakdown.pickupLocal) || 0;
  const deliveryLocal = parseFloat(breakdown.deliveryLocal) || 0;
  const godownStorage = parseFloat(breakdown.godownStorage) || 0;
  const otherCharges = parseFloat(breakdown.other) || 0;
  const totalAdditional =
    labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges > 0
      ? labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges
      : parseFloat(bilty.additionalCharges) || 0;

  const initialFreight = parseFloat(bilty.freight) || 0;
  const discount = parseFloat(bilty.discount) || 0;
  const subTotal = Math.max(0, initialFreight + totalAdditional - discount);
  const incomeTax6Pct = bilty.incomeTax !== undefined ? (parseFloat(bilty.incomeTax) || 0) : Math.round(subTotal * 0.06);
  const salesTax15Pct = bilty.salesTax !== undefined ? (parseFloat(bilty.salesTax) || 0) : Math.round(subTotal * 0.15);
  const grandTotal = bilty.totalAmount ? parseFloat(bilty.totalAmount) : subTotal + incomeTax6Pct + salesTax15Pct;
  const paidAmount = parseFloat(bilty.paidAmount) || 0;
  const remainingBalance = grandTotal - paidAmount;

  // Masking logic: If "Hide Amount in Bilty" is checked, mask monetary figures for Driver & Customer copies
  const isAmountHidden = Boolean(bilty.hideAmount) && (selectedCopy === "Driver / Fleet Copy" || selectedCopy === "Customer Copy");

  const amountInWords = isAmountHidden
    ? "CONFIDENTIAL — CHARGES AS PER HEAD OFFICE CONTRACT"
    : numberToWordsPKR(grandTotal);

  return (
    <div className="bg-white text-black font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full">
      {/* On-screen Copy Selector Bar */}
      {!hideControls && (
        <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-lg p-2 mb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">Select Print Copy:</span>
            {(["Customer Copy", "Driver / Fleet Copy", "Office Copy"] as const).map((copy) => (
              <button
                key={copy}
                type="button"
                onClick={() => setSelectedCopy(copy)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedCopy === copy
                    ? "bg-red-700 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {copy}
              </button>
            ))}
          </div>
          {bilty.hideAmount && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              🔒 Freight Amounts Masked on {selectedCopy}
            </span>
          )}
        </div>
      )}

      {/* A4 PRINT CONTAINER */}
      <div
        id="printable-bilty"
        data-print-target="true"
        className="printable-document p-5 border-2 border-black rounded-lg print:border-none print:p-0 space-y-3"
      >
        {/* Official Header */}
        <BiltyTransportHeader
          title="Consignment Note / Bilty"
          documentNumber={biltyNumber}
          date={bilty.date ? formatDate(bilty.date) : undefined}
          copyFor={selectedCopy}
          station={bilty.warehouse ? `${bilty.warehouse} Hub` : "Head Office Station (Lahore)"}
        />

        {/* Route, Commercial & Booking Metadata Bar */}
        <div className="border border-black p-2 bg-slate-50 text-[10.5px] leading-tight">
          <div className="grid grid-cols-6 gap-2 border-b border-slate-300 pb-1.5 mb-1.5 font-semibold">
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Loading From</span>
              <span className="font-bold text-black uppercase">{bilty.origin || "Lahore"}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Destination</span>
              <span className="font-bold text-black uppercase">{bilty.destination || "Karachi"}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Vehicle / Truck #</span>
              <span className="font-mono font-bold text-black">{bilty.vehicleNumber || "Pending"}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Driver In-Charge</span>
              <span className="font-bold text-black truncate block">{bilty.driverName || "Assigned Driver"}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Dispatch Mode</span>
              <span className="font-bold text-red-700 uppercase">{bilty.dispatchMode || "Normal"}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase text-slate-500 block">Amount / Payment Type</span>
              <span className="font-bold text-blue-900 uppercase">{bilty.amountType || bilty.paymentStatus || "To Pay"}</span>
            </div>
          </div>

          {/* Commercial References Row */}
          <div className="grid grid-cols-5 gap-2 text-[9.5px]">
            <div>
              <span className="text-slate-500 font-normal">Order / PO #: </span>
              <span className="font-mono font-bold">{bilty.poNumber || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-normal">B/L #: </span>
              <span className="font-mono font-bold">{bilty.blNumber || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-normal">LC #: </span>
              <span className="font-mono font-bold">{bilty.lcNumber || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-normal">Container #: </span>
              <span className="font-mono font-bold">{bilty.containerNumber || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-normal">GD #: </span>
              <span className="font-mono font-bold">{bilty.gdNumber || "-"}</span>
            </div>
          </div>
        </div>

        {/* Sender, Receiver & QR Code Row */}
        <div className="grid grid-cols-12 gap-3">
          {/* Consignor / Shipper (5 cols) */}
          <div className="col-span-5 p-2.5 border border-black rounded bg-white">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1">
              <span className="font-black uppercase text-[10px] text-blue-900">Consignor / Shipper</span>
              {bilty.billTo === "Sender" && (
                <span className="text-[8px] font-bold bg-blue-100 text-blue-800 px-1 rounded">BILL TO</span>
              )}
            </div>
            <p className="font-bold text-xs text-black leading-snug">{bilty.senderName || "Sender"}</p>
            <p className="text-[10px] font-mono mt-0.5 text-slate-800">
              <span className="text-slate-500">Ph:</span> {bilty.senderPhone || "0300-0000000"}
            </p>
            <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">
              {bilty.senderAddress || `${bilty.origin || "Lahore"}, Pakistan`}
            </p>
          </div>

          {/* Consignee / Receiver (5 cols) */}
          <div className="col-span-5 p-2.5 border border-black rounded bg-white">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1">
              <span className="font-black uppercase text-[10px] text-red-700">Consignee / Receiver</span>
              {bilty.billTo === "Receiver" && (
                <span className="text-[8px] font-bold bg-red-100 text-red-800 px-1 rounded">BILL TO</span>
              )}
            </div>
            <p className="font-bold text-xs text-black leading-snug">{bilty.receiverName || "Receiver"}</p>
            <p className="text-[10px] font-mono mt-0.5 text-slate-800">
              <span className="text-slate-500">Ph:</span> {bilty.receiverPhone || "0300-0000000"}
            </p>
            <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">
              {bilty.receiverAddress || `${bilty.destination || "Karachi"}, Pakistan`}
            </p>
            {bilty.deliveryAddress && bilty.deliveryAddress !== bilty.receiverAddress && (
              <p className="text-[9px] text-slate-700 mt-1 font-medium bg-slate-50 p-1 rounded border border-slate-200">
                <span className="font-bold text-black">Factory / Site Drop:</span> {bilty.deliveryAddress}
              </p>
            )}
          </div>

          {/* Tracking QR Box (2 cols) */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <BiltyQrCode
              value={trackingUrl}
              size={100}
              level="M"
              label="SCAN FOR TRACKING"
              trackingId={bilty.biltyNumber || bilty.id || trackingId}
            />
          </div>
        </div>

        {/* Dynamic Cargo Items Table */}
        <div className="border border-black rounded overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "37%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead className="bg-slate-100 text-[9.5px] font-black uppercase border-b border-black">
              <tr>
                <th className="p-1.5 border-r border-black text-center">S#</th>
                <th className="p-1.5 border-r border-black">Description of Goods / Packaging Marks</th>
                <th className="p-1.5 border-r border-black text-center">Quantity</th>
                <th className="p-1.5 border-r border-black text-right">Weight (KG)</th>
                <th className="p-1.5 border-r border-black text-right">Volume (CBM)</th>
                <th className="p-1.5 border-r border-black text-center">Freight Basis</th>
                <th className="p-1.5 text-right">Rate / Amount</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-300 last:border-b-0">
                  <td className="p-1.5 border-r border-black text-center font-bold text-slate-600">{idx + 1}</td>
                  <td className="p-1.5 border-r border-black font-semibold text-black">
                    {item.detail || "General Commercial Merchandise"}
                  </td>
                  <td className="p-1.5 border-r border-black text-center font-mono font-bold">
                    {item.quantity || 1}
                  </td>
                  <td className="p-1.5 border-r border-black text-right font-mono">
                    {item.weight ? `${item.weight} kg` : "-"}
                  </td>
                  <td className="p-1.5 border-r border-black text-right font-mono">
                    {item.volume ? `${item.volume} cbm` : "-"}
                  </td>
                  <td className="p-1.5 border-r border-black text-center text-[9px] uppercase font-semibold text-slate-700">
                    {item.freightAsPer || "Fixed"}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {isAmountHidden ? "***" : formatCurrency(item.freight || item.rate || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown & Additional Charges */}
        <div className="grid grid-cols-12 gap-3 pt-1">
          {/* Left Column: Additional Operational Charges Breakdown (6 cols) */}
          <div className="col-span-6 border border-black rounded p-2 text-[10px] space-y-1 bg-white">
            <p className="font-black uppercase text-[9px] text-slate-800 border-b border-slate-300 pb-1">
              Operational Charges & Local Services Breakdown
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Labour / Handling:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(labour)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lifter / Crane / Shift:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(lifterCrane)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Local Pickup Cartage:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(pickupLocal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Local Delivery Drop:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(deliveryLocal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Godown / Storage:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(godownStorage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Other Surcharges:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(otherCharges)}</span>
              </div>
            </div>

            {bilty.notes && (
              <div className="border-t border-slate-200 pt-1 mt-1 text-[9px] text-slate-700">
                <span className="font-bold text-black">Booking Remarks:</span> {bilty.notes}
              </div>
            )}
          </div>

          {/* Right Column: Totals & Tax Calculation (6 cols) */}
          <div className="col-span-6 border-2 border-black rounded p-2.5 space-y-1 bg-slate-50 text-[10.5px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Initial / Base Freight:</span>
              <span className="font-mono font-bold">{isAmountHidden ? "***" : formatCurrency(initialFreight)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Additional Charges Sum:</span>
              <span className="font-mono">{isAmountHidden ? "***" : formatCurrency(totalAdditional)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Contract Discount:</span>
                <span className="font-mono">-{isAmountHidden ? "***" : formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-1">
              <span className="font-bold">Subtotal (Excl. Tax):</span>
              <span className="font-mono font-bold">{isAmountHidden ? "***" : formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[9.5px]">
              <span>Withholding Income Tax (6%):</span>
              <span className="font-mono">{isAmountHidden ? "***" : formatCurrency(incomeTax6Pct)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[9.5px]">
              <span>Provincial Sales Tax (15%):</span>
              <span className="font-mono">{isAmountHidden ? "***" : formatCurrency(salesTax15Pct)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-black pt-1 font-black text-xs text-black">
              <span>Grand Total Amount:</span>
              <span className="font-mono text-red-700 text-sm">
                {isAmountHidden ? "*** AS PER CONTRACT ***" : formatCurrency(grandTotal)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold text-[10px]">
              <span>Paid in Advance:</span>
              <span className="font-mono">{isAmountHidden ? "***" : formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-black text-xs">
              <span>Balance Due / Terms:</span>
              <span className="font-mono text-red-700">
                {isAmountHidden ? bilty.amountType || "TO PAY" : `${formatCurrency(remainingBalance)} (${bilty.amountType || "TO PAY"})`}
              </span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border border-black p-1.5 bg-slate-100 rounded text-[10px]">
          <span className="font-black uppercase text-slate-800">Amount in Words: </span>
          <span className="font-bold italic text-slate-900">{amountInWords}</span>
        </div>

        {/* 10-Point Legal Transport Terms & Conditions */}
        <div className="border border-black rounded p-2 text-[7.5px] leading-tight text-slate-700 bg-white space-y-1">
          <p className="font-black uppercase text-[8px] text-black border-b border-slate-300 pb-0.5">
            Carrier Conditions of Carriage & Legal Terms:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <p>1. Goods are carried strictly at the Owner&apos;s Risk unless expressly insured prior to departure.</p>
            <p>2. The carrier shall not be liable for any loss, damage, leakage, breakage, or natural decay during transit.</p>
            <p>3. Any claim or discrepancy must be reported in writing within 24 hours of delivery.</p>
            <p>4. Demurrage and storage charges will apply if cargo is not cleared within 48 hours of arrival.</p>
            <p>5. Contraband, explosive, hazardous, inflammable, or restricted items are strictly prohibited.</p>
            <p>6. The carrier retains general lien on all consignments for unpaid freight, cartage, and dues.</p>
            <p>7. Consignment will be delivered only against presentation and surrender of the original Bilty.</p>
            <p>8. Delivery timeline is subject to force majeure, weather, road closures, strikes, and unavoidable delays.</p>
            <p>9. Consignment weight and package count are subject to verification and re-weighing at destination terminal.</p>
            <p>10. All legal disputes and arbitrations are subject exclusively to Karachi or Lahore court jurisdiction.</p>
          </div>
        </div>

        {/* Signatures & Stamp Block */}
        <div className="grid grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-black break-inside-avoid">
          <div>
            <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
              Shipper&apos;s Signature
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Consignor Acceptance</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
              Booking Officer
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Super Pak Data Wale Stamp</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
              Driver In-Charge
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Fleet Linehaul Signature</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 font-bold uppercase text-[9px] text-black">
              Consignee Signature
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Received in Good Condition</div>
          </div>
        </div>
      </div>
    </div>
  );
}
