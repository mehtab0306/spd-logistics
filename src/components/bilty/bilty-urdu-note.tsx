"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate, numberToWordsPKR } from "@/lib/utils";
import { BiltyQrCode } from "./bilty-qr-code";

interface BiltyUrduNoteProps {
  bilty: any;
  defaultCopy?: "کسٹمر کاپی (Customer Copy)" | "ڈرائیور کاپی (Driver Copy)" | "آفس کاپی (Office Copy)";
  hideControls?: boolean;
}

export function BiltyUrduNote({
  bilty,
  defaultCopy = "کسٹمر کاپی (Customer Copy)",
  hideControls = false,
}: BiltyUrduNoteProps) {
  const [selectedCopy, setSelectedCopy] = useState(defaultCopy);

  if (!bilty) return null;

  const biltyNumber = bilty.biltyNumber || bilty.manualBiltyNumber || "BLT-PENDING";
  const trackingId = bilty.trackingId || bilty.biltyNumber || bilty.id;
  const baseUrl =
    typeof window !== "undefined" && window.location.origin.includes("spdlogistics.pk")
      ? "https://spdlogistics.pk"
      : process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("netlify")
      ? process.env.NEXT_PUBLIC_APP_URL
      : "https://spdlogistics.pk";
  const trackingUrl = `${baseUrl.replace(/\/$/, "")}/tracking?id=${encodeURIComponent(biltyNumber)}`;

  // Parse items
  const items: any[] =
    Array.isArray(bilty.items) && bilty.items.length > 0
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

  const totalPackages =
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ||
    bilty.packagesCount ||
    bilty.quantity ||
    1;
  const totalWeight =
    items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || bilty.weight || 0;

  // Additional charges breakdown
  const breakdown = bilty.additionalChargesBreakdown || {};
  const labour = parseFloat(breakdown.labour) || parseFloat(bilty.labourCharges) || 0;
  const lifterCrane = parseFloat(breakdown.lifterCrane) || 0;
  const pickupLocal = parseFloat(breakdown.pickupLocal) || 0;
  const deliveryLocal = parseFloat(breakdown.deliveryLocal) || 0;
  const godownStorage = parseFloat(breakdown.godownStorage) || 0;
  const otherCharges = parseFloat(breakdown.other) || parseFloat(bilty.otherCharges) || 0;
  const totalAdditional =
    labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges > 0
      ? labour + lifterCrane + pickupLocal + deliveryLocal + godownStorage + otherCharges
      : parseFloat(bilty.additionalCharges) || 0;

  const initialFreight =
    parseFloat(bilty.freightAmount !== undefined ? bilty.freightAmount : bilty.freight) || 0;
  const discount = parseFloat(bilty.discount) || 0;
  const subTotal = Math.max(0, initialFreight + totalAdditional - discount);
  const salesTax = bilty.salesTax !== undefined ? Number(bilty.salesTax) : 0;
  const grandTotal = bilty.totalAmount ? parseFloat(bilty.totalAmount) : subTotal + salesTax;
  const paidAmount = parseFloat(bilty.paidAmount) || 0;
  const remainingBalance = Math.max(0, grandTotal - paidAmount);

  const isAmountHidden =
    Boolean(bilty.hideAmount) &&
    (selectedCopy === "ڈرائیور کاپی (Driver Copy)" || selectedCopy === "کسٹمر کاپی (Customer Copy)");
  const amountInWords = isAmountHidden ? "CONFIDENTIAL" : numberToWordsPKR(grandTotal);

  const displayDate = bilty.bookingDate
    ? formatDate(bilty.bookingDate)
    : bilty.date
    ? formatDate(bilty.date)
    : formatDate(new Date());

  const paymentTerms = bilty.paymentMode || bilty.amountType || (remainingBalance <= 0 && grandTotal > 0 ? "PAID" : "TO-PAY");

  return (
    <div
      id="printable-urdu-bilty"
      data-print-target="true"
      className="printable-document bg-white text-slate-900 font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full"
    >
      {/* On-screen Copy Selector Bar */}
      {!hideControls && (
        <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-lg p-2.5 mb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">
              پرنٹ کاپی منتخب کریں (Select Copy):
            </span>
            {(["کسٹمر کاپی (Customer Copy)", "ڈرائیور کاپی (Driver Copy)", "آفس کاپی (Office Copy)"] as const).map(
              (copy) => (
                <button
                  key={copy}
                  type="button"
                  onClick={() => setSelectedCopy(copy)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedCopy === copy
                      ? "bg-red-700 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {copy}
                </button>
              )
            )}
          </div>
          {bilty.hideAmount && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              🔒 کرایہ مخفی (Freight Masked)
            </span>
          )}
        </div>
      )}

      {/* Main Official Bilty Slip Container */}
      <div className="border border-slate-300 rounded-xl p-5 print:border-none print:p-0 space-y-3.5 shadow-sm print:shadow-none bg-white">
        {/* Top Header Section */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left: QR Code & Bilty Identification */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-center shadow-xs">
                <BiltyQrCode value={trackingUrl} size={62} label="" />
                <span className="text-[8px] font-mono font-bold text-slate-500 block mt-0.5">
                  Live QR Tracking
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="inline-block bg-red-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  {selectedCopy}
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                    Bilty / Consignment #
                  </span>
                  <span className="font-mono font-black text-red-700 text-base leading-none">
                    {biltyNumber}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-semibold">
                  Date: <span className="font-mono text-slate-900">{displayDate}</span>
                </p>
              </div>
            </div>

            {/* Right: Company Main Brand Title (Bilingual) */}
            <div className="flex-1 text-right" dir="rtl">
              <div className="flex items-center justify-end gap-2">
                <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded">
                  رجسٹرڈ
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-red-700 leading-tight">
                  سپر پاک ڈیٹا والے گڈز ٹرانسپورٹ کمپنی
                </h1>
              </div>
              <p className="text-[10px] font-bold text-slate-800 tracking-wide mt-0.5" dir="ltr">
                SUPER PAK DATA WALE GOODS TRANSPORT CO.®
              </p>
              <p className="text-[9.5px] font-semibold text-slate-600 mt-0.5">
                تمام پاکستان 24 گھنٹے بااعتماد، محفوظ اور تیز ترین کارگو و گڈز ٹرانسپورٹ سروس
              </p>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 mt-1.5 pt-1.5 border-t border-slate-200 leading-snug">
                <div>
                  <span className="font-black text-slate-950">لاہور آفس:</span> سگیاں بائی پاس، نزد IGG ہاؤس، لاہور۔
                  <span className="block font-mono text-slate-900 font-bold" dir="ltr">
                    0300-2928633, 0325-2024433
                  </span>
                </div>
                <div>
                  <span className="font-black text-slate-950">کراچی ہیڈ آفس:</span> پلاٹ 9، ٹرک اسٹینڈ ہاکس بے روڈ، کراچی۔
                  <span className="block font-mono text-slate-900 font-bold" dir="ltr">
                    021-32351333, 0300-2024433
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Origin / Destination High-Contrast Route Ribbon */}
        <div className="grid grid-cols-4 gap-2 bg-slate-900 text-white rounded-lg p-2.5 text-center text-xs">
          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-slate-300 block">
              Origin (روانگی اسٹیشن)
            </span>
            <span className="font-black text-sm uppercase text-red-400">
              {bilty.origin || "Karachi"}
            </span>
          </div>
          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-slate-300 block">
              Destination (منزل مقصود)
            </span>
            <span className="font-black text-sm uppercase text-emerald-400">
              {bilty.destination || "Lahore"}
            </span>
          </div>
          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-slate-300 block">
              Payment Terms (شرائط ادائیگی)
            </span>
            <span className="font-black text-sm uppercase text-amber-300">
              {paymentTerms}
            </span>
          </div>
          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-slate-300 block">
              Tracking / Trip Ref
            </span>
            <span className="font-mono font-bold text-xs text-white">
              {trackingId || biltyNumber}
            </span>
          </div>
        </div>

        {/* Shipper & Consignee 2-Column Corporate Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Sender / Shipper */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-black text-red-700 text-[10.5px]">
                ارسال کنندہ (Consignor / Shipper)
              </span>
              <span className="text-[9px] font-mono text-slate-500 font-bold">FROM: {bilty.origin || "Karachi"}</span>
            </div>
            <p className="font-black text-xs text-slate-950">{bilty.senderName || "Walk-in Shipper"}</p>
            {bilty.senderPhone && (
              <p className="text-[10px] text-slate-700 font-mono">
                <span className="font-semibold text-slate-500">Phone:</span> {bilty.senderPhone}
              </p>
            )}
            {bilty.senderAddress && (
              <p className="text-[9.5px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-500">Address:</span> {bilty.senderAddress}
              </p>
            )}
          </div>

          {/* Receiver / Consignee */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-black text-blue-900 text-[10.5px]">
                وصول کنندہ (Consignee / Receiver)
              </span>
              <span className="text-[9px] font-mono text-slate-500 font-bold">TO: {bilty.destination || "Lahore"}</span>
            </div>
            <p className="font-black text-xs text-slate-950">{bilty.receiverName || "Consignee"}</p>
            {bilty.receiverPhone && (
              <p className="text-[10px] text-slate-700 font-mono">
                <span className="font-semibold text-slate-500">Phone:</span> {bilty.receiverPhone}
              </p>
            )}
            {bilty.receiverAddress && (
              <p className="text-[9.5px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-500">Address:</span> {bilty.receiverAddress}
              </p>
            )}
          </div>
        </div>

        {/* Operational Transit Meta Bar */}
        <div className="grid grid-cols-4 border border-slate-200 rounded-lg p-2 text-[10px] bg-slate-50 text-center divide-x divide-slate-200">
          <div>
            <span className="text-slate-500 font-semibold block">گاڑی نمبر (Truck / Vehicle #)</span>
            <span className="font-mono font-black text-slate-900 text-xs">
              {bilty.vehicleNumber && !bilty.vehicleNumber.includes("Pending") ? bilty.vehicleNumber : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">ڈرائیور نام (Driver Incharge)</span>
            <span className="font-bold text-slate-900 text-xs">
              {bilty.driverName && !bilty.driverName.includes("Pending") ? bilty.driverName : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">آرڈر / PO نمبر (Purchase Order)</span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              {bilty.orderNumber || bilty.poNumber || "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">بل ٹو پارٹی (Bill To Party)</span>
            <span className="font-bold text-red-700 text-xs uppercase">
              {bilty.billTo || (paymentTerms === "TO-PAY" ? "Consignee" : "Consignor")}
            </span>
          </div>
        </div>

        {/* Consignment Particulars Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-[9.5px] font-black uppercase text-slate-800">
              <tr className="text-center divide-x divide-slate-200">
                <th className="p-2 w-10">S.#</th>
                <th className="p-2 text-left px-3">
                  تفصیل مال و سامان (Cargo Description &amp; Packing Particulars)
                </th>
                <th className="p-2 w-20">تعداد نگ<br /><span className="text-[8px] font-normal text-slate-500">Pkgs</span></th>
                <th className="p-2 w-24">وزن (کلوگرام)<br /><span className="text-[8px] font-normal text-slate-500">Weight (kg)</span></th>
                <th className="p-2 w-28">کرایہ<br /><span className="text-[8px] font-normal text-slate-500">Freight (PKR)</span></th>
                <th className="p-2 w-28">پیشگی ادا شدہ<br /><span className="text-[8px] font-normal text-slate-500">Advance (PKR)</span></th>
                <th className="p-2 w-32">بقایا واجب الادا<br /><span className="text-[8px] font-normal text-slate-500">Balance Due (PKR)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[10.5px]">
              {items.map((item, idx) => (
                <tr key={idx} className="divide-x divide-slate-200">
                  <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 px-3 font-semibold text-slate-900 leading-snug">
                    {item.detail || "General Commercial Merchandise"}
                    {item.bundleDescription ? ` (${item.bundleDescription})` : ""}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold">{item.quantity || 1}</td>
                  <td className="p-2.5 text-center font-mono">{item.weight ? `${item.weight} kg` : "—"}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {isAmountHidden ? "***" : formatCurrency(item.freight || item.rate || initialFreight)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700 font-bold">
                    {isAmountHidden ? "***" : idx === 0 ? formatCurrency(paidAmount) : "—"}
                  </td>
                  <td className="p-2.5 text-right font-mono text-red-700 font-black">
                    {isAmountHidden ? "***" : idx === 0 ? formatCurrency(remainingBalance) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-xs divide-x divide-slate-200">
              <tr>
                <td className="p-2 text-center text-slate-700" colSpan={2}>
                  کل میزان (Total Cargo):
                </td>
                <td className="p-2 text-center font-mono">{totalPackages}</td>
                <td className="p-2 text-center font-mono">{totalWeight ? `${totalWeight} kg` : "—"}</td>
                <td className="p-2 text-right font-mono">{isAmountHidden ? "***" : formatCurrency(initialFreight)}</td>
                <td className="p-2 text-right font-mono text-emerald-700">{isAmountHidden ? "***" : formatCurrency(paidAmount)}</td>
                <td className="p-2 text-right font-mono text-red-700">{isAmountHidden ? "***" : formatCurrency(remainingBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Operational Charges & Summary Breakdown */}
        <div className="grid grid-cols-12 gap-3 text-[10px]">
          {/* Operational Charges (6 cols) */}
          <div className="col-span-6 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
            <p className="font-black text-slate-800 border-b border-slate-200 pb-1 text-right" dir="rtl">
              دیگر اخراجات کی تفصیل (Additional Charges Breakdown):
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] pt-1">
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">مزدوری / لوڈنگ:</span>
                <span className="font-mono font-bold text-slate-900">{isAmountHidden ? "***" : formatCurrency(labour)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لفٹر / کرین چارجز:</span>
                <span className="font-mono font-bold text-slate-900">{isAmountHidden ? "***" : formatCurrency(lifterCrane)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لوکل پک اپ کارٹیج:</span>
                <span className="font-mono font-bold text-slate-900">{isAmountHidden ? "***" : formatCurrency(pickupLocal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لوکل ڈلیوری چارجز:</span>
                <span className="font-mono font-bold text-slate-900">{isAmountHidden ? "***" : formatCurrency(deliveryLocal)}</span>
              </div>
            </div>
          </div>

          {/* Grand Totals Box (6 cols) */}
          <div className="col-span-6 border border-slate-200 rounded-lg p-2.5 bg-white space-y-1 text-xs">
            <div className="flex justify-between font-black border-b border-slate-200 pb-1">
              <span className="text-slate-900" dir="rtl">کل رقم (Grand Total Freight):</span>
              <span className="font-mono text-slate-950 text-sm">{isAmountHidden ? "***" : formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[10.5px] text-emerald-800 font-bold">
              <span dir="rtl">وصول شدہ پیشگی (Advance Paid):</span>
              <span className="font-mono">{isAmountHidden ? "***" : formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200">
              <span className="text-red-700" dir="rtl">بقایا واجب الادا (Net Balance Payable):</span>
              <span className="font-mono text-red-700 text-sm font-black">{isAmountHidden ? "***" : formatCurrency(remainingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border border-slate-200 p-2 bg-slate-50 rounded-lg text-[10.5px] flex items-center justify-between">
          <span className="font-black text-slate-800" dir="rtl">رقم بلحاظ الفاظ (In Words):</span>
          <span className="font-bold italic text-slate-950">{amountInWords}</span>
        </div>

        {/* Transport Terms and Conditions */}
        <div className="border border-slate-200 rounded-lg p-2 text-[8.5px] bg-slate-50/70 space-y-0.5 text-right leading-relaxed text-slate-600" dir="rtl">
          <p className="font-bold text-slate-800 border-b border-slate-200 pb-0.5">ضروری شرائط و ضوابط (Transport Conditions):</p>
          <p>1. مال پارٹی کے اپنے رسک پر بک کیا جاتا ہے۔ کمپنی کسی قدرتی آفت، ایکسیڈنٹ، بارش، فسادات یا راستے کی بندش کی ذمہ دار نہ ہوگی۔</p>
          <p>2. ترسیل شدہ مال پہنچنے کے بعد 48 گھنٹے کے اندر چھڑوانا لازمی ہوگا۔ بعد ازاں یومیہ ڈیمرج چارج وصول کیا جائے گا۔</p>
          <p>3. اصل بلٹی دکھائے بغیر کسی صورت مال کی ڈلیوری نہیں دی جائے گی۔ تنازعات کی صورت میں عدالتِ کراچی مجاز ہوگی۔</p>
        </div>

        {/* Signatures & Seal Block */}
        <div className="grid grid-cols-3 border-t border-slate-300 pt-3 text-center text-[10px] font-bold">
          <div>
            <div className="h-10 min-h-[35px]" />
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 text-slate-900" dir="rtl">
              دستخط بکنگ انچارج
            </div>
            <span className="text-[8px] text-slate-500 font-normal">Booking Officer Signature</span>
          </div>
          <div>
            <div className="h-10 min-h-[35px]" />
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 text-slate-900" dir="rtl">
              دستخط ڈرائیور / ٹرک انچارج
            </div>
            <span className="text-[8px] text-slate-500 font-normal">Driver Acknowledgement</span>
          </div>
          <div>
            <div className="h-10 min-h-[35px]" />
            <div className="border-t border-slate-400 w-36 mx-auto pt-1 text-slate-900" dir="rtl">
              دستخط و مہر وصول کنندہ مال
            </div>
            <span className="text-[8px] text-slate-500 font-normal">Receiver Signature &amp; Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
