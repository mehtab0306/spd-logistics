"use client";

import React from "react";
import { formatCurrency, formatDate, numberToWordsPKR } from "@/lib/utils";
import { BiltyTransportHeader } from "./bilty-transport-header";
import { BiltyQrCode } from "./bilty-qr-code";

interface BiltyFreightBillProps {
  bilty: any;
}

export function BiltyFreightBill({ bilty }: BiltyFreightBillProps) {
  if (!bilty) return null;

  const biltyNumber = bilty.biltyNumber || "BLT-PENDING";
  const billNumber = `BILL-${biltyNumber}`;
  const billDate = bilty.bookingDate ? formatDate(bilty.bookingDate) : bilty.date ? formatDate(bilty.date) : formatDate(new Date());

  // Determine Bill To party based on bilty.billTo
  const isBillToReceiver = bilty.billTo === "Receiver";
  const billToParty = isBillToReceiver
    ? {
        role: "Receiver / Consignee",
        name: bilty.receiverName || "Receiver",
        phone: bilty.receiverPhone || "0300-0000000",
        address: bilty.receiverAddress || `${bilty.destination || "Karachi"}, Pakistan`,
        ntn: bilty.receiverNtn || "Unregistered / NTN on File",
      }
    : {
        role: "Sender / Consignor",
        name: bilty.senderName || bilty.customer?.name || "Sender",
        phone: bilty.senderPhone || "0300-0000000",
        address: bilty.senderAddress || `${bilty.origin || "Lahore"}, Pakistan`,
        ntn: bilty.customer?.ntn || bilty.senderNtn || "1692873-3 / NTN on File",
      };

  // Cargo items
  const items: any[] = Array.isArray(bilty.items) && bilty.items.length > 0
    ? bilty.items
    : [
        {
          detail: bilty.itemDescription || bilty.packageDetails || "General Commercial Merchandise",
          quantity: bilty.packagesCount || bilty.quantity || 1,
          weight: bilty.weight || 0,
          volume: bilty.cpm || 0,
          rate: bilty.freightAmount !== undefined ? bilty.freightAmount : (bilty.freight || 0),
          freightAsPer: "Fixed Freight",
          freight: bilty.freightAmount !== undefined ? bilty.freightAmount : (bilty.freight || 0),
        },
      ];

  // Additional charges breakdown
  const breakdown = bilty.additionalChargesBreakdown || {};
  const labour = parseFloat(breakdown.labour) || parseFloat(bilty.labourCharges) || 0;
  const lifterCrane = parseFloat(breakdown.lifterCrane) || 0;
  const pickupLocal = parseFloat(breakdown.pickupLocal) || 0;
  const deliveryLocal = parseFloat(breakdown.deliveryLocal) || 0;
  const godownStorage = parseFloat(breakdown.godownStorage) || 0;
  const otherCharges = parseFloat(breakdown.other) || parseFloat(bilty.otherCharges) || 0;

  const initialFreight = parseFloat(bilty.freightAmount !== undefined ? bilty.freightAmount : bilty.freight) || 0;
  const totalAdditional =
    labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges > 0
      ? labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges
      : parseFloat(bilty.additionalCharges) || 0;

  const discount = parseFloat(bilty.discount) || 0;
  const netFreightSubtotal = Math.max(0, initialFreight + totalAdditional - discount);
  const incomeTax6Pct = bilty.incomeTax !== undefined ? (parseFloat(bilty.incomeTax) || 0) : Math.round(netFreightSubtotal * 0.06);
  const salesTax15Pct = bilty.salesTax !== undefined ? (parseFloat(bilty.salesTax) || 0) : Math.round(netFreightSubtotal * 0.15);
  const totalInvoiceAmount = bilty.totalAmount ? parseFloat(bilty.totalAmount) : netFreightSubtotal + incomeTax6Pct + salesTax15Pct;
  const paidAmount = parseFloat(bilty.paidAmount) || 0;
  const balancePayable = totalInvoiceAmount - paidAmount;

  const amountInWords = numberToWordsPKR(totalInvoiceAmount);

  return (
    <div
      id="printable-freight-bill"
      data-print-target="true"
      className="printable-document bg-white text-black font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full"
    >
      <div className="p-5 border-2 border-black rounded-lg print:border-none print:p-0 space-y-3">
        {/* Official Header matching Excel BILL */}
        <BiltyTransportHeader
          title="FREIGHT BILL / COMMERCIAL INVOICE"
          documentNumber={billNumber}
          date={billDate}
          station={bilty.warehouse ? `${bilty.warehouse} Station` : "Head Office Station (Lahore)"}
        />

        {/* Sender & Receiver Box & Invoice Metadata Row */}
        <div className="grid grid-cols-12 gap-3">
          {/* Sender & Receiver Box (6 cols) */}
          <div className="col-span-6 p-3 border-2 border-black rounded bg-slate-50 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-black uppercase text-[10px] text-slate-500 block">
                Sender / Consignor:
              </span>
              <p className="font-black text-base text-black tracking-tight">
                {bilty.senderName || bilty.customer?.name || "Sender"}
              </p>
            </div>
            <div className="border-t border-slate-300 pt-2 mt-2 space-y-1">
              <span className="font-black uppercase text-[10px] text-slate-500 block">
                Receiver / Consignee:
              </span>
              <p className="font-black text-base text-black tracking-tight">
                {bilty.receiverName || "Receiver"}
              </p>
            </div>
          </div>

          {/* Invoice Summary Box with Vehicle Moved to Upper Section (4 cols) */}
          <div className="col-span-4 p-3 border-2 border-black rounded bg-white space-y-1.5 text-[10.5px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Bill Reference:</span>
              <span className="font-mono text-sm font-black text-red-700">{billNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Bilty Number:</span>
              <span className="font-mono text-sm font-black text-black">{biltyNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Billing Date:</span>
              <span className="text-xs font-bold text-black">{billDate}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-1">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Vehicle / Truck #:</span>
              <span className="font-mono text-xs font-black text-slate-900">{bilty.vehicleNumber || "/"}</span>
            </div>
            <div className="flex justify-between items-center border-t border-black pt-1">
              <span className="text-slate-500 uppercase text-[9px] font-bold">Route / Corridor:</span>
              <span className="font-black uppercase text-black">
                {bilty.origin || "Lahore"} &rarr; {bilty.destination || "Karachi"}
              </span>
            </div>
          </div>

          {/* Tracking QR Box (2 cols) */}
          <div className="col-span-2 flex flex-col items-center justify-center p-2 border-2 border-black rounded bg-white">
            <BiltyQrCode
              value={`https://spd-logistics-live.netlify.app/tracking?id=${encodeURIComponent(bilty.biltyNumber || bilty.id)}`}
              size={90}
              level="M"
              label="SCAN TO TRACK"
              trackingId={bilty.biltyNumber || bilty.id}
            />
          </div>
        </div>

        {/* Transport Fleet & Shipment Metadata (Driver & LC No Removed) */}
        <div className="border border-black p-2 bg-slate-50 text-[10px] grid grid-cols-3 gap-3">
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Order / PO #</span>
            <span className="font-mono font-bold text-black">{bilty.poNumber || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Container #</span>
            <span className="font-mono font-bold text-black">{bilty.containerNumber || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">B/L / GD #</span>
            <span className="font-mono font-bold text-black">{bilty.blNumber || bilty.gdNumber || "-"}</span>
          </div>
        </div>

        {/* Commercial Items & Freight Charges Table with CBM Column */}
        <div className="border border-black rounded overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "38%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead className="bg-slate-100 text-[9.5px] font-black uppercase border-b border-black">
              <tr>
                <th className="p-2 border-r border-black text-center">S.no</th>
                <th className="p-2 border-r border-black">Description of Transport & Freight Services</th>
                <th className="p-2 border-r border-black text-center">Qty</th>
                <th className="p-2 border-r border-black text-right">Weight (KG)</th>
                <th className="p-2 border-r border-black text-right">CBM</th>
                <th className="p-2 border-r border-black text-center">Basis</th>
                <th className="p-2 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {items.map((item: any, idx: number) => {
                const itemCbm = item.volume ? Number(item.volume) : (bilty.cpm ? Number(bilty.cpm) : null);
                return (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 border-r border-black text-center font-bold text-slate-600">{idx + 1}</td>
                    <td className="p-2 border-r border-black font-semibold text-black">
                      {item.detail || "Freight Carriage Charges"}
                      {item.bundleDescription ? ` (${item.bundleDescription})` : ""}
                      {" "}({bilty.origin} to {bilty.destination})
                    </td>
                    <td className="p-2 border-r border-black text-center font-mono font-bold">{item.quantity || 1}</td>
                    <td className="p-2 border-r border-black text-right font-mono">{item.weight ? `${item.weight} kg` : "-"}</td>
                    <td className="p-2 border-r border-black text-right font-mono font-semibold text-slate-800">
                      {itemCbm !== null && !isNaN(itemCbm) ? `${itemCbm} cbm` : "-"}
                    </td>
                    <td className="p-2 border-r border-black text-center text-[9px] uppercase font-semibold text-slate-600">
                      {item.freightAsPer || "Fixed"}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-black">
                      {formatCurrency(item.freight || item.rate || initialFreight)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Local Surcharges & Services Breakdown (Matching Excel BILL Sheet) */}
        <div className="grid grid-cols-12 gap-3 pt-1">
          {/* Operational Surcharges Breakdown Table (7 cols) */}
          <div className="col-span-7 border border-black rounded p-2.5 bg-white text-[10px] space-y-1.5">
            <p className="font-black uppercase text-[9.5px] text-slate-800 border-b border-slate-300 pb-1">
              Itemized Operational Services & Surcharges
            </p>
            <div className="space-y-1">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Local Cartage / Pickup (Origin Hub):</span>
                <span className="font-mono font-semibold">{formatCurrency(pickupLocal)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Local Delivery Cartage (Destination):</span>
                <span className="font-mono font-semibold">{formatCurrency(deliveryLocal)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Labour & Terminal Handling:</span>
                <span className="font-mono font-semibold">{formatCurrency(labour)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Crane / Lifter / Shifting Services:</span>
                <span className="font-mono font-semibold">{formatCurrency(lifterCrane)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Godown & Storage Charges:</span>
                <span className="font-mono font-semibold">{formatCurrency(godownStorage)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Other Operational Surcharges:</span>
                <span className="font-mono font-semibold">{formatCurrency(otherCharges)}</span>
              </div>
            </div>

            {/* Bank Payment Details — Meezan Bank */}
            <div className="mt-2 pt-2 border-t border-black bg-slate-50 p-2 rounded text-[9px] text-slate-800 space-y-0.5">
              <p className="font-black uppercase text-[9.5px] text-red-700">Bank Remittance Instructions:</p>
              <p><span className="font-bold">Account Title:</span> SUPER PAK DATA WALE GOODS TRANSPORT CO.</p>
              <p><span className="font-bold">Bank Name:</span> Meezan Bank</p>
              <p><span className="font-bold">Branch:</span> Abdalians Cooperative Housing Society</p>
              <p><span className="font-bold">Account Number:</span> 11650111286305</p>
              <p><span className="font-bold">IBAN:</span> PK50MEZN0011650111286305</p>
            </div>
          </div>

          {/* Totals & Tax Box (5 cols) */}
          <div className="col-span-5 border-2 border-black rounded p-3 space-y-1.5 bg-slate-50 text-[10.5px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Freight:</span>
              <span className="font-mono font-bold">{formatCurrency(initialFreight)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Surcharges & Cartage:</span>
              <span className="font-mono">{formatCurrency(totalAdditional)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Special Discount:</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
              <span>Subtotal (Excl. Tax):</span>
              <span className="font-mono">{formatCurrency(netFreightSubtotal)}</span>
            </div>
            <div className="flex justify-between text-[9.5px] text-slate-600">
              <span>Income Tax Withholding (6%):</span>
              <span className="font-mono">{formatCurrency(incomeTax6Pct)}</span>
            </div>
            <div className="flex justify-between text-[9.5px] text-slate-600">
              <span>Provincial Sales Tax (15%):</span>
              <span className="font-mono">{formatCurrency(salesTax15Pct)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-black pt-1.5 font-black text-sm text-black">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-red-700 text-base">{formatCurrency(totalInvoiceAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold text-[10px]">
              <span>Advance Paid / Adjusted:</span>
              <span className="font-mono">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-black text-xs">
              <span>Net Balance Due:</span>
              <span className="font-mono text-red-700">{formatCurrency(balancePayable)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border border-black p-2 bg-slate-100 rounded text-[10px]">
          <span className="font-black uppercase text-slate-800">Amount in Words: </span>
          <span className="font-bold italic text-slate-900">{amountInWords}</span>
        </div>

        {/* Signatures & Corporate Seal Block */}
        <div className="grid grid-cols-3 gap-8 text-center text-xs pt-2 break-inside-avoid">
          <div>
            <div className="h-14 min-h-[50px]" />
            <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
              Prepared By
            </div>
            <div className="text-[8.5px] text-slate-500 mt-0.5">Billing & Accounts Clerk</div>
          </div>
          <div>
            <div className="h-14 min-h-[50px]" />
            <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
              Checked & Verified
            </div>
            <div className="text-[8.5px] text-slate-500 mt-0.5">Manager Finance</div>
          </div>
          <div>
            <div className="h-14 min-h-[50px]" />
            <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
              For Super Pak Data Wale Goods Transport Co.®
            </div>
            <div className="text-[8.5px] text-slate-500 mt-0.5">Authorized Signatory & Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
