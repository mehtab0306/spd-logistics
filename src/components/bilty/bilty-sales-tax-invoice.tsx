"use client";

import React from "react";
import { formatCurrency, formatDate, numberToWordsPKR } from "@/lib/utils";

interface BiltySalesTaxInvoiceProps {
  bilty: any;
}

export function BiltySalesTaxInvoice({ bilty }: BiltySalesTaxInvoiceProps) {
  if (!bilty) return null;

  const biltyNumber = bilty.biltyNumber || bilty.manualBiltyNumber || "BLT-PENDING";
  const taxInvoiceNo = bilty.salesTaxInvoiceNumber || `STI-${String(biltyNumber).replace(/^(BLT-|B-)/i, "")}`;
  const invoiceDate = bilty.bookingDate ? formatDate(bilty.bookingDate) : bilty.date ? formatDate(bilty.date) : formatDate(new Date());

  // Determine Buyer based on bilty.billTo
  const isReceiver =
    bilty.billTo === "Receiver" ||
    bilty.billTo === "Consignee" ||
    (!bilty.billTo && (bilty.freightAsPer === "To Pay" || bilty.paymentMode === "To Pay"));

  const buyerName = isReceiver
    ? (bilty.receiverName || "Receiver")
    : (bilty.senderName || bilty.customer?.name || "Sender");

  const buyerAddress = isReceiver
    ? (bilty.receiverAddress || `${bilty.destination || "Lahore"}, Pakistan`)
    : (bilty.senderAddress || `${bilty.origin || "Karachi"}, Pakistan`);

  const buyerPhone = isReceiver ? (bilty.receiverPhone || "") : (bilty.senderPhone || "");
  const buyerNtn = (isReceiver ? bilty.receiverNtn : (bilty.customer?.ntn || bilty.senderNtn)) || "Unregistered / Final Consumer";

  // Financial calculations
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

  // Taxable Value (Subtotal of freight and operational logistics charges minus discount)
  const taxableValue = Math.max(0, initialFreight + totalAdditional - discount);

  // Sales Tax Rate (Default 15% under PRA / SRB for freight logistics services)
  const salesTaxRate = bilty.salesTaxRate !== undefined ? Number(bilty.salesTaxRate) : 15;

  // Sales Tax Payable amount
  const salesTaxAmount =
    bilty.salesTax !== undefined
      ? Number(bilty.salesTax)
      : Math.round(taxableValue * (salesTaxRate / 100));

  // Grand Total: ALWAYS Taxable Value + Sales Tax for tax-exclusive invoices
  // This guarantees mathematical consistency across preview, print, and PDF.
  const grandTotal = taxableValue + salesTaxAmount;

  // Amount in words strictly reflects the true grand total including tax
  const amountInWords = numberToWordsPKR(grandTotal);

  return (
    <div
      id="printable-sales-tax-invoice"
      data-print-target="true"
      className="printable-document bg-white text-slate-900 font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full"
    >
      <div className="p-6 border border-slate-300 rounded-xl print:border-none print:p-0 space-y-4 shadow-sm print:shadow-none bg-white">
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  SUPER PAK DATA WALE GOODS TRANSPORT CO.
                </span>
                <span className="text-[10px] font-black bg-red-700 text-white px-1.5 py-0.5 rounded tracking-wide">
                  REG.
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700">
                Nationwide Inter-City Heavy Freight, Container &amp; Logistics Network
              </p>
              <p className="text-[10px] text-slate-600 leading-snug">
                <span className="font-bold text-slate-800">Head Office:</span> Plot # 9, Gate No 1, Street No 4, Truck Stand Hawksbay Road, Karachi.
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-bold text-slate-800">Phone:</span> 021-32351333, 0300-2024433
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <div className="inline-block bg-slate-900 text-white font-black text-xs uppercase px-3 py-1 rounded tracking-wider shadow-sm">
                SALES TAX INVOICE
              </div>
              <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mt-1">
                Issued Under Section 23 of Sales Tax Act, 1990
              </p>
              <p className="text-[9px] text-slate-500">
                Provincial Services Sales Tax Rules (PRA / SRB)
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Metadata Reference Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px]">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
              Sales Tax Invoice #
            </span>
            <span className="font-mono font-black text-red-700 text-xs">{taxInvoiceNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
              Date of Issue
            </span>
            <span className="text-slate-900 font-bold">{invoiceDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
              Consignment Bilty #
            </span>
            <span className="font-mono font-black text-slate-900 text-xs">{biltyNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">
              Order / PO Ref
            </span>
            <span className="font-mono font-bold text-slate-800">{bilty.poNumber || bilty.orderNumber || "—"}</span>
          </div>
        </div>

        {/* Supplier & Recipient 2-Column Corporate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          {/* Supplier (Service Provider) */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-black uppercase text-[10px] text-red-700 tracking-wider">
                Service Provider (Supplier)
              </span>
              <span className="text-[9px] font-bold text-slate-500">Transporter</span>
            </div>
            <p className="font-black text-xs text-slate-950">
              SUPER PAK DATA WALE GOODS TRANSPORT CO.®
            </p>
            <p className="text-[10px] text-slate-600 leading-snug">
              Plot # 9, Gate No 1, Street No 4, Truck Stand Hawksbay Road, Karachi, Pakistan.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100">
              <p>
                <span className="text-slate-500 font-semibold">NTN:</span>{" "}
                <span className="font-mono font-bold text-slate-950">4774077-5</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Status:</span>{" "}
                <span className="font-semibold text-emerald-700">Active Taxpayer</span>
              </p>
            </div>
          </div>

          {/* Recipient (Service Buyer) */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-black uppercase text-[10px] text-blue-900 tracking-wider">
                Service Recipient (Buyer / Client)
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                {isReceiver ? "Billed to Consignee" : "Billed to Shipper"}
              </span>
            </div>
            <p className="font-black text-xs text-slate-950">{buyerName}</p>
            <p className="text-[10px] text-slate-600 leading-snug">{buyerAddress}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100">
              <p>
                <span className="text-slate-500 font-semibold">Buyer NTN:</span>{" "}
                <span className="font-mono font-bold text-slate-950">{buyerNtn}</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Phone:</span>{" "}
                <span className="font-mono text-slate-800">{buyerPhone || "—"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Structured Sales Tax Calculation Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "45%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead className="bg-slate-100 text-[9.5px] font-black uppercase border-b border-slate-300 text-slate-800">
              <tr>
                <th className="p-2.5 border-r border-slate-200 text-center">S.#</th>
                <th className="p-2.5 border-r border-slate-200">
                  Description of Taxable Logistics Services
                </th>
                <th className="p-2.5 border-r border-slate-200 text-right">
                  Taxable Value <br />
                  <span className="text-[8px] font-normal text-slate-500">(Excl. Tax PKR)</span>
                </th>
                <th className="p-2.5 border-r border-slate-200 text-center">
                  Rate <br />
                  <span className="text-[8px] font-normal text-slate-500">(%)</span>
                </th>
                <th className="p-2.5 border-r border-slate-200 text-right">
                  Sales Tax <br />
                  <span className="text-[8px] font-normal text-slate-500">(PKR)</span>
                </th>
                <th className="p-2.5 text-right">
                  Total Value <br />
                  <span className="text-[8px] font-normal text-slate-500">(Incl. Tax PKR)</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-[10.5px] divide-y divide-slate-200">
              <tr>
                <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-500">
                  1
                </td>
                <td className="p-3 border-r border-slate-200 font-medium text-slate-900 leading-snug space-y-1">
                  <div>
                    <span className="font-bold text-slate-950">
                      Inter-City Goods Carriage &amp; Freight Logistics Services
                    </span>{" "}
                    from{" "}
                    <span className="font-black uppercase text-red-700">{bilty.origin || "Karachi"}</span>{" "}
                    to{" "}
                    <span className="font-black uppercase text-red-700">{bilty.destination || "Lahore"}</span>.
                  </div>
                  <div className="text-[9.5px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>
                      <strong className="text-slate-800">Bilty #:</strong> {biltyNumber}
                    </span>
                    <span>
                      <strong className="text-slate-800">Cargo:</strong> {bilty.itemDescription || bilty.packageDetails || "Commercial Goods"}
                    </span>
                    <span>
                      <strong className="text-slate-800">Pkgs:</strong> {bilty.packagesCount || bilty.quantity || 1}
                    </span>
                    {bilty.weight ? (
                      <span>
                        <strong className="text-slate-800">Weight:</strong> {bilty.weight} kg
                      </span>
                    ) : null}
                    {bilty.vehicleNumber && !bilty.vehicleNumber.includes("Pending") ? (
                      <span>
                        <strong className="text-slate-800">Vehicle:</strong> {bilty.vehicleNumber}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="p-3 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(taxableValue)}
                </td>
                <td className="p-3 border-r border-slate-200 text-center font-mono font-black text-blue-900">
                  {salesTaxRate}%
                </td>
                <td className="p-3 border-r border-slate-200 text-right font-mono font-black text-red-700">
                  {formatCurrency(salesTaxAmount)}
                </td>
                <td className="p-3 text-right font-mono font-black text-slate-950 text-xs">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-100/80 text-[10.5px] font-black border-t-2 border-slate-400">
              <tr>
                <td colSpan={2} className="p-2.5 border-r border-slate-300 text-right uppercase tracking-wider text-slate-800">
                  Total Taxable Freight Services:
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right font-mono text-slate-950">
                  {formatCurrency(taxableValue)}
                </td>
                <td className="p-2.5 border-r border-slate-300 text-center font-mono text-blue-900">
                  {salesTaxRate}%
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right font-mono text-red-700">
                  {formatCurrency(salesTaxAmount)}
                </td>
                <td className="p-2.5 text-right font-mono text-red-700 text-sm">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words & Financial Breakdown Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 border border-slate-200 p-3 bg-slate-50 rounded-lg flex flex-col justify-center space-y-1">
            <span className="font-black uppercase text-[9.5px] text-slate-600 tracking-wider">
              Total Invoice Amount in Words:
            </span>
            <p className="font-bold italic text-slate-950 text-xs leading-relaxed">
              {amountInWords}
            </p>
          </div>

          <div className="border border-slate-200 p-3 bg-white rounded-lg space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 text-[10.5px]">
              <span>Taxable Subtotal:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(taxableValue)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10.5px]">
              <span>Sales Tax ({salesTaxRate}%):</span>
              <span className="font-mono font-bold text-red-700">{formatCurrency(salesTaxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-black text-slate-950">
              <span>Grand Total Payable:</span>
              <span className="font-mono text-red-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Statutory Tax Certification */}
        <div className="border border-slate-200 p-2.5 bg-slate-50/70 rounded-lg text-[9px] leading-relaxed text-slate-600">
          <p className="font-bold text-slate-800 uppercase text-[9.5px] mb-0.5">
            Statutory Legal &amp; Tax Declaration:
          </p>
          <p>
            We hereby certify that the particulars furnished in this Sales Tax Invoice are true and correct, and the
            amount of provincial sales tax charged herein on freight transportation services has been or will be duly
            deposited into the designated Government Treasury (PRA / SRB) in accordance with Section 23 of the Sales
            Tax Act, 1990 and applicable Provincial Sales Tax on Services Rules.
          </p>
        </div>

        {/* Executive Signatures & Seal Block */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4 break-inside-avoid">
          <div>
            <div className="h-12 min-h-[45px]" />
            <div className="border-t border-slate-400 pt-1.5 font-bold uppercase text-[10px] text-slate-900">
              Prepared &amp; Verified By
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Accounts &amp; Billing Department</div>
          </div>
          <div>
            <div className="h-12 min-h-[45px]" />
            <div className="border-t border-slate-400 pt-1.5 font-bold uppercase text-[10px] text-slate-900">
              For Super Pak Data Wale Goods Transport Co.®
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Authorized Signatory &amp; Official Transport Seal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
