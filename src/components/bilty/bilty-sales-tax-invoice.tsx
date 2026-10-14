"use client";

import React from "react";
import { formatCurrency, formatDate, numberToWordsPKR } from "@/lib/utils";
import { BiltyTransportHeader } from "./bilty-transport-header";

interface BiltySalesTaxInvoiceProps {
  bilty: any;
}

export function BiltySalesTaxInvoice({ bilty }: BiltySalesTaxInvoiceProps) {
  if (!bilty) return null;

  const biltyNumber = bilty.biltyNumber || "BLT-PENDING";
  const taxInvoiceNo = `STI-${biltyNumber}`;
  const invoiceDate = bilty.date ? formatDate(bilty.date) : formatDate(new Date());

  // Determine Buyer based on bilty.billTo
  const isReceiver = bilty.billTo === "Receiver";
  const buyerName = isReceiver ? (bilty.receiverName || "Receiver") : (bilty.senderName || bilty.customer?.name || "Sender");
  const buyerAddress = isReceiver
    ? (bilty.receiverAddress || `${bilty.destination || "Karachi"}, Pakistan`)
    : (bilty.senderAddress || `${bilty.origin || "Lahore"}, Pakistan`);
  const buyerPhone = isReceiver ? (bilty.receiverPhone || "0300-0000000") : (bilty.senderPhone || "0300-0000000");
  const buyerNtn = (isReceiver ? bilty.receiverNtn : bilty.customer?.ntn || bilty.senderNtn) || "Unregistered / Final Consumer";
  const buyerStrn = (isReceiver ? bilty.receiverStrn : bilty.customer?.strn || bilty.senderStrn) || "-";

  // Financial calculations
  const breakdown = bilty.additionalChargesBreakdown || {};
  const labour = parseFloat(breakdown.labour) || 0;
  const lifterCrane = parseFloat(breakdown.lifterCrane) || 0;
  const pickupLocal = parseFloat(breakdown.pickupLocal) || 0;
  const deliveryLocal = parseFloat(breakdown.deliveryLocal) || 0;
  const godownStorage = parseFloat(breakdown.godownStorage) || 0;
  const otherCharges = parseFloat(breakdown.other) || 0;

  const initialFreight = parseFloat(bilty.freight) || 0;
  const totalAdditional =
    labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges > 0
      ? labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges
      : parseFloat(bilty.additionalCharges) || 0;

  const discount = parseFloat(bilty.discount) || 0;
  const taxableValue = Math.max(0, initialFreight + totalAdditional - discount);
  const salesTaxRate = 15; // 15% standard provincial transport services sales tax (PRA/SRB)
  const salesTaxAmount = Math.round(taxableValue * 0.15);
  const totalValueWithTax = taxableValue + salesTaxAmount;

  const amountInWords = numberToWordsPKR(totalValueWithTax);

  return (
    <div className="bg-white text-black font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full">
      <div className="p-5 border-2 border-black rounded-lg print:border-none print:p-0 space-y-3">
        {/* Official Header */}
        <BiltyTransportHeader
          title="Sales Tax Invoice (15%)"
          subtitle="Issued Under Section 23 of the Sales Tax Act, 1990 / Provincial Services Sales Tax Acts (PRA / SRB / KPRA / BRA)"
          documentNumber={taxInvoiceNo}
          date={invoiceDate}
          copyFor="ORIGINAL TAX INVOICE"
          station={bilty.warehouse ? `${bilty.warehouse} Station` : "Karachi / Lahore Hub"}
        />

        {/* Supplier & Buyer Two-Column Structured Grid */}
        <div className="grid grid-cols-2 gap-3 border border-black p-3 rounded bg-slate-50">
          {/* Supplier Box */}
          <div className="border-r border-black pr-3 space-y-1">
            <span className="font-black uppercase text-[10px] text-red-700 block border-b border-slate-300 pb-0.5">
              Service Provider / Supplier Details
            </span>
            <p className="font-black text-xs text-black">SUPER PAK DATA WALE GOODS TRANSPORT CO.®</p>
            <p className="text-[10px] text-slate-700 leading-tight">
              Gate No. 1, Street No. 4, Plot No. 9, Truck Stand Hawksbay Road, Karachi.
            </p>
            <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 mt-1 border-t border-slate-200">
              <p>
                <span className="text-slate-500 font-bold">NTN:</span>{" "}
                <span className="font-mono font-black text-black">1692873-3</span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">STRN:</span>{" "}
                <span className="font-mono font-black text-black">17-00-1692-873-3</span>
              </p>
            </div>
            <p className="text-[9.5px] text-slate-600">
              <span className="font-bold text-slate-800">Tax Jurisdiction:</span> SRB (Sindh) / PRA (Punjab)
            </p>
          </div>

          {/* Buyer Box */}
          <div className="pl-1 space-y-1">
            <span className="font-black uppercase text-[10px] text-blue-900 block border-b border-slate-300 pb-0.5">
              Service Recipient / Buyer Details
            </span>
            <p className="font-black text-xs text-black">{buyerName}</p>
            <p className="text-[10px] text-slate-700 leading-tight">{buyerAddress}</p>
            <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 mt-1 border-t border-slate-200">
              <p>
                <span className="text-slate-500 font-bold">Buyer NTN:</span>{" "}
                <span className="font-mono font-bold text-black">{buyerNtn}</span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">Buyer STRN:</span>{" "}
                <span className="font-mono font-bold text-black">{buyerStrn}</span>
              </p>
            </div>
            <p className="text-[9.5px] text-slate-600">
              <span className="font-bold text-slate-800">Party Phone:</span> {buyerPhone}
            </p>
          </div>
        </div>

        {/* Invoice Cross-Reference Bar */}
        <div className="border border-black p-2 bg-slate-100 rounded text-[10px] grid grid-cols-4 gap-2 font-semibold">
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Sales Tax Invoice No</span>
            <span className="font-mono font-bold text-red-700">{taxInvoiceNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Bilty Reference No</span>
            <span className="font-mono font-bold text-black">{biltyNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Date of Invoice</span>
            <span className="text-black font-medium">{invoiceDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8.5px] uppercase">Vehicle / Truck #</span>
            <span className="font-mono font-bold text-black">{bilty.vehicleNumber || "Assigned Fleet"}</span>
          </div>
        </div>

        {/* Structured Sales Tax Calculation Table matching Excel Sheet1 */}
        <div className="border border-black rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[9px] font-black uppercase border-b border-black">
              <tr>
                <th className="p-2 border-r border-black text-center w-10">S#</th>
                <th className="p-2 border-r border-black">Description of Goods / Taxable Logistics Services</th>
                <th className="p-2 border-r border-black text-center w-24">Tariff / Heading</th>
                <th className="p-2 border-r border-black text-right w-28">Taxable Value (Excl. Tax)</th>
                <th className="p-2 border-r border-black text-center w-20">Rate (%)</th>
                <th className="p-2 border-r border-black text-right w-28">Sales Tax Payable</th>
                <th className="p-2 text-right w-32">Total Value (Incl. Tax)</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              <tr className="border-b border-slate-300">
                <td className="p-2 border-r border-black text-center font-bold text-slate-600">1</td>
                <td className="p-2 border-r border-black font-semibold text-black leading-snug">
                  Inter-city Goods Carriage & Logistics Services from{" "}
                  <span className="font-bold uppercase text-red-700">{bilty.origin || "Lahore"}</span> to{" "}
                  <span className="font-bold uppercase text-red-700">{bilty.destination || "Karachi"}</span> under Bilty #{biltyNumber}.
                  <br />
                  <span className="text-[9px] text-slate-500 font-normal">
                    Commodity: {bilty.packageDetails || "Commercial Cargo"} • Qty: {bilty.quantity || 1} • Weight: {bilty.weight ? `${bilty.weight} kg` : "N/A"}
                  </span>
                </td>
                <td className="p-2 border-r border-black text-center font-mono text-[9.5px]">
                  9804.1000
                </td>
                <td className="p-2 border-r border-black text-right font-mono font-bold">
                  {formatCurrency(taxableValue)}
                </td>
                <td className="p-2 border-r border-black text-center font-mono font-bold text-blue-900">
                  {salesTaxRate}%
                </td>
                <td className="p-2 border-r border-black text-right font-mono font-bold text-red-700">
                  {formatCurrency(salesTaxAmount)}
                </td>
                <td className="p-2 text-right font-mono font-bold text-black">
                  {formatCurrency(totalValueWithTax)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 text-[10.5px] font-black border-t-2 border-black">
              <tr>
                <td colSpan={3} className="p-2 border-r border-black text-right uppercase">
                  Total Taxable Services:
                </td>
                <td className="p-2 border-r border-black text-right font-mono">
                  {formatCurrency(taxableValue)}
                </td>
                <td className="p-2 border-r border-black text-center font-mono">
                  15%
                </td>
                <td className="p-2 border-r border-black text-right font-mono text-red-700">
                  {formatCurrency(salesTaxAmount)}
                </td>
                <td className="p-2 text-right font-mono text-red-700 text-sm">
                  {formatCurrency(totalValueWithTax)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="border border-black p-2 bg-slate-100 rounded text-[10px]">
          <span className="font-black uppercase text-slate-800">Total Invoice Amount in Words: </span>
          <span className="font-bold italic text-slate-900">{amountInWords}</span>
        </div>

        {/* Mandatory Sales Tax Legal Certification */}
        <div className="border border-black p-2 bg-white rounded text-[8.5px] leading-relaxed text-slate-700">
          <p className="font-bold text-black uppercase text-[9px] mb-0.5">Statutory Tax Declaration:</p>
          <p>
            We hereby declare and certify that the particulars given above are true and correct, and the amount of
            provincial sales tax charged herein on freight transportation services has been or will be duly deposited
            into the relevant Government Treasury (PRA / SRB / FBR) in accordance with the provisions of the Sales
            Tax Act, 1990 and applicable Provincial Sales Tax on Services rules.
          </p>
        </div>

        {/* Official Signatures & Seal Block */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs pt-6 border-t border-black break-inside-avoid">
          <div>
            <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
              Prepared & Verified By
            </div>
            <div className="text-[8.5px] text-slate-500 mt-0.5">Sales Tax & Billing Department</div>
          </div>
          <div>
            <div className="border-t-2 border-black pt-1 font-bold uppercase text-[9.5px] text-black">
              For Super Pak Data Wale Goods Transport Co.®
            </div>
            <div className="text-[8.5px] text-slate-500 mt-0.5">Authorized Signatory & Official Transport Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
