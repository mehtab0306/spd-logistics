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
  const baseUrl = (typeof window !== "undefined" && window.location.origin.includes("spdlogistics.pk"))
    ? "https://spdlogistics.pk"
    : (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("netlify") ? process.env.NEXT_PUBLIC_APP_URL : "https://spdlogistics.pk");
  const trackingUrl = `${baseUrl.replace(/\/$/, "")}/tracking?id=${encodeURIComponent(biltyNumber)}`;

  // Parse items
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

  const totalPackages = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || bilty.packagesCount || bilty.quantity || 1;
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || bilty.weight || 0;

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

  const initialFreight = parseFloat(bilty.freightAmount !== undefined ? bilty.freightAmount : bilty.freight) || 0;
  const discount = parseFloat(bilty.discount) || 0;
  const subTotal = Math.max(0, initialFreight + totalAdditional - discount);
  const salesTax = bilty.salesTax !== undefined ? Number(bilty.salesTax) : 0;
  const grandTotal = bilty.totalAmount ? parseFloat(bilty.totalAmount) : subTotal + salesTax;
  const paidAmount = parseFloat(bilty.paidAmount) || 0;
  const remainingBalance = Math.max(0, grandTotal - paidAmount);

  const isAmountHidden = Boolean(bilty.hideAmount) && (selectedCopy === "ڈرائیور کاپی (Driver Copy)" || selectedCopy === "کسٹمر کاپی (Customer Copy)");
  const amountInWords = isAmountHidden ? "CONFIDENTIAL" : numberToWordsPKR(grandTotal);

  const displayDate = bilty.bookingDate ? formatDate(bilty.bookingDate) : bilty.date ? formatDate(bilty.date) : formatDate(new Date());

  return (
    <div
      id="printable-urdu-bilty"
      data-print-target="true"
      className="printable-document bg-white text-black font-sans text-xs selection:bg-red-100 max-w-4xl mx-auto print:max-w-none print:w-full"
    >
      {/* On-screen Copy Selector Bar */}
      {!hideControls && (
        <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-lg p-2 mb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">پرنٹ کاپی منتخب کریں (Select Copy):</span>
            {(["کسٹمر کاپی (Customer Copy)", "ڈرائیور کاپی (Driver Copy)", "آفس کاپی (Office Copy)"] as const).map((copy) => (
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
              🔒 کرایہ مخفی (Freight Masked)
            </span>
          )}
        </div>
      )}

      {/* Main Official Urdu Bilty Container */}
      <div className="border-2 border-black rounded-lg p-4 print:border-none print:p-0 space-y-2">
        {/* Top Header: Official Urdu Header with SPD Brand Identity */}
        <div className="border-b-2 border-black pb-2">
          <div className="flex items-start justify-between gap-3">
            {/* Right-to-Left Urdu Main Brand Title */}
            <div className="flex items-start gap-3 flex-1">
              <img
                src="/images/spd-logo.png"
                alt="SPD Logistics"
                className="h-16 w-16 object-contain shrink-0 mt-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/spd-logo.jpg";
                }}
              />
              <div className="flex-1 text-right" dir="rtl">
                <h1 className="text-xl sm:text-2xl font-black text-red-700 leading-none">
                  سپر پاک ڈیٹا والے گڈز ٹرانسپورٹ کمپنی (رجسٹرڈ)
                </h1>
                <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                  تمام پاکستان 24 گھنٹے ارجنٹ، کنٹینر، مزدا اور ریلوے بکنگ سروس دستیاب ہے۔
                </p>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 mt-1 leading-tight border-t border-slate-200 pt-1">
                  <div>
                    <span className="font-black text-black">کراچی ہیڈ آفس:</span> پلاٹ نمبر 9، گیٹ نمبر 1، گلی نمبر 4، ٹرک اسٹینڈ، ہاکس بے روڈ، کراچی۔
                    <br />
                    <span className="font-mono text-slate-900 font-bold" dir="ltr">021-32351333, 0300-2024433, 0325-2024433</span>
                  </div>
                  <div>
                    <span className="font-black text-black">لاہور برانچ:</span> سگیاں بائی پاس، حضرت علی روڈ، بالمقابل IGG ہاؤس، لاہور۔
                    <br />
                    <span className="font-mono text-slate-900 font-bold" dir="ltr">0300-2928633, 0301-8264433, 0325-2024433</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilty Meta & QR Code Box */}
            <div className="text-center border-2 border-black p-1.5 rounded bg-slate-50 min-w-[150px] shrink-0">
              <div className="bg-red-700 text-white text-[9px] font-black uppercase px-1 py-0.5 rounded tracking-wider mb-1">
                {selectedCopy}
              </div>
              <p className="text-[11px] font-black text-black" dir="rtl">بلٹی نمبر</p>
              <p className="text-sm font-mono font-black text-red-700">{biltyNumber}</p>
              <p className="text-[9px] text-slate-600 font-medium mt-0.5">تاریخ: {displayDate}</p>
              <div className="mt-1 flex justify-center">
                <BiltyQrCode value={trackingUrl} size={54} label="" />
              </div>
              <p className="text-[7.5px] text-slate-500 font-mono mt-0.5">Scan for Live Status</p>
            </div>
          </div>
        </div>

        {/* Consignor, Consignee & Route Details Box (RTL Urdu labels, LTR English values) */}
        <div className="border border-black rounded p-2 text-xs grid grid-cols-2 gap-3 bg-slate-50/50">
          {/* Sender / Consignor */}
          <div className="border-r border-slate-300 pr-2 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
              <span className="font-mono font-bold text-slate-500 text-[10px]" dir="ltr">ORIGIN: {bilty.origin || "Karachi"}</span>
              <span className="font-black text-red-700 text-[11px]" dir="rtl">ارسال کنندہ (Shipper):</span>
            </div>
            <p className="font-black text-xs text-black" dir="ltr">{bilty.senderName || "Walk-in Shipper"}</p>
            {bilty.senderPhone && <p className="text-[10px] text-slate-700 font-mono" dir="ltr">Ph: {bilty.senderPhone}</p>}
            {bilty.senderAddress && <p className="text-[9.5px] text-slate-600 leading-tight" dir="ltr">{bilty.senderAddress}</p>}
          </div>

          {/* Receiver / Consignee */}
          <div className="pl-1 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
              <span className="font-mono font-bold text-slate-500 text-[10px]" dir="ltr">DESTINATION: {bilty.destination || "Lahore"}</span>
              <span className="font-black text-blue-900 text-[11px]" dir="rtl">وصول کنندہ (Consignee):</span>
            </div>
            <p className="font-black text-xs text-black" dir="ltr">{bilty.receiverName || "Consignee"}</p>
            {bilty.receiverPhone && <p className="text-[10px] text-slate-700 font-mono" dir="ltr">Ph: {bilty.receiverPhone}</p>}
            {bilty.receiverAddress && <p className="text-[9.5px] text-slate-600 leading-tight" dir="ltr">{bilty.receiverAddress}</p>}
          </div>
        </div>

        {/* Secondary Info Bar: Vehicle, Driver, PO, BL */}
        <div className="grid grid-cols-4 border border-black rounded p-1.5 text-[9.5px] bg-white divide-x divide-black text-center">
          <div>
            <span className="text-slate-500 font-bold block" dir="rtl">گاڑی نمبر (Truck #)</span>
            <span className="font-mono font-black text-black text-xs">{bilty.vehicleNumber && !bilty.vehicleNumber.includes("Pending") ? bilty.vehicleNumber : "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block" dir="rtl">ڈرائیور (Driver)</span>
            <span className="font-bold text-black text-xs">{bilty.driverName && !bilty.driverName.includes("Pending") ? bilty.driverName : "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block" dir="rtl">آرڈر / PO نمبر</span>
            <span className="font-mono font-bold text-black text-xs">{bilty.orderNumber || bilty.poNumber || "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block" dir="rtl">ادائیگی کی قسم (Terms)</span>
            <span className="font-black text-red-700 uppercase text-xs">{bilty.paymentMode || bilty.amountType || "TO-PAY"}</span>
          </div>
        </div>

        {/* Goods / Consignment Table */}
        <div className="border border-black rounded overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b border-black text-center text-[10px] font-black divide-x divide-black">
                <th className="p-1 w-12" dir="rtl">نمبر شمار<br/><span className="text-[8px] font-normal" dir="ltr">S.#</span></th>
                <th className="p-1 text-left px-2" dir="rtl">تفصیل مال و سامان<br/><span className="text-[8px] font-normal" dir="ltr">Goods Description</span></th>
                <th className="p-1 w-20" dir="rtl">تعداد نگ<br/><span className="text-[8px] font-normal" dir="ltr">Pkgs</span></th>
                <th className="p-1 w-24" dir="rtl">وزن (کلوگرام)<br/><span className="text-[8px] font-normal" dir="ltr">Weight (kg)</span></th>
                <th className="p-1 w-24" dir="rtl">کرایہ<br/><span className="text-[8px] font-normal" dir="ltr">Freight</span></th>
                <th className="p-1 w-28" dir="rtl">پیشگی<br/><span className="text-[8px] font-normal" dir="ltr">Advance</span></th>
                <th className="p-1 w-32" dir="rtl">بقایا واجب الوصول<br/><span className="text-[8px] font-normal" dir="ltr">Balance (To Pay)</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-300 divide-x divide-black text-xs">
                  <td className="p-1.5 text-center font-bold font-mono">{idx + 1}</td>
                  <td className="p-1.5 px-2 font-semibold text-black" dir="ltr">
                    {item.detail || "General Commercial Merchandise"}
                    {item.bundleDescription ? ` (${item.bundleDescription})` : ""}
                  </td>
                  <td className="p-1.5 text-center font-mono font-bold">{item.quantity || 1}</td>
                  <td className="p-1.5 text-center font-mono">{item.weight ? `${item.weight} kg` : "—"}</td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {isAmountHidden ? "***" : formatCurrency(item.freight || item.rate || initialFreight)}
                  </td>
                  <td className="p-1.5 text-right font-mono text-emerald-700 font-bold">
                    {isAmountHidden ? "***" : idx === 0 ? formatCurrency(paidAmount) : "—"}
                  </td>
                  <td className="p-1.5 text-right font-mono text-red-700 font-black">
                    {isAmountHidden ? "***" : idx === 0 ? formatCurrency(remainingBalance) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t border-black font-black text-xs divide-x divide-black">
                <td className="p-1.5 text-center" colSpan={2} dir="rtl">کل میزان (Total):</td>
                <td className="p-1.5 text-center font-mono">{totalPackages}</td>
                <td className="p-1.5 text-center font-mono">{totalWeight ? `${totalWeight} kg` : "—"}</td>
                <td className="p-1.5 text-right font-mono">{isAmountHidden ? "***" : formatCurrency(initialFreight)}</td>
                <td className="p-1.5 text-right font-mono text-emerald-700">{isAmountHidden ? "***" : formatCurrency(paidAmount)}</td>
                <td className="p-1.5 text-right font-mono text-red-700">{isAmountHidden ? "***" : formatCurrency(remainingBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Financial & Additional Charges Bar */}
        <div className="grid grid-cols-12 gap-2 text-[10px]">
          {/* Operational Charges Breakdown (6 cols) */}
          <div className="col-span-6 border border-black rounded p-2 bg-white space-y-1">
            <p className="font-black text-slate-800 border-b border-slate-200 pb-0.5 text-right" dir="rtl">
              دیگر اخراجات کی تفصیل (Additional Charges):
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] pt-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">مزدوری / لوڈنگ:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(labour)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لفٹر / کرین چارجز:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(lifterCrane)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لوکل پک اپ کارٹیج:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(pickupLocal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600" dir="rtl">لوکل ڈلیوری ڈراپ:</span>
                <span className="font-mono font-semibold">{isAmountHidden ? "***" : formatCurrency(deliveryLocal)}</span>
              </div>
            </div>
          </div>

          {/* Totals Summary (6 cols) */}
          <div className="col-span-6 border border-black rounded p-2 bg-slate-50 space-y-1">
            <div className="flex justify-between font-black text-xs border-b border-slate-300 pb-0.5">
              <span className="text-slate-900" dir="rtl">کل رقم (Grand Total):</span>
              <span className="font-mono text-red-700 text-sm">{isAmountHidden ? "***" : formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-emerald-800 font-bold" dir="rtl">وصول شدہ پیشگی (Advance Paid):</span>
              <span className="font-mono font-bold text-emerald-800">{isAmountHidden ? "***" : formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between font-black text-xs pt-0.5 border-t border-slate-300">
              <span className="text-red-700" dir="rtl">بقایا واجب الادا (Net Balance Due):</span>
              <span className="font-mono text-red-700 font-black">{isAmountHidden ? "***" : formatCurrency(remainingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border border-black p-1.5 bg-slate-100 rounded text-[10px] flex items-center justify-between">
          <span className="font-black text-slate-800" dir="rtl">رقم بلحاظ الفاظ:</span>
          <span className="font-bold italic text-slate-900 font-serif" dir="ltr">{amountInWords}</span>
        </div>

        {/* Legal Conditions & Terms in Urdu */}
        <div className="border border-black rounded p-2 text-[8px] bg-slate-50/70 space-y-0.5 text-right leading-tight" dir="rtl">
          <p className="font-black text-[9px] text-red-700 border-b border-slate-300 pb-0.5">ضروری شرائط و ضوابط (Terms &amp; Conditions):</p>
          <p>1. کمپنی مال کے کسی قدرتی نقصان، راستے کے حادثات، بارش، ہڑتال یا فسادات کی ذمہ دار نہ ہوگی۔ مال پارٹی کے اپنے رسک پر بک کیا جاتا ہے۔</p>
          <p>2. ترسیل شدہ مال پہنچنے پر 48 گھنٹے کے اندر گودام سے چھڑوانا لازمی ہوگا۔ بعد ازاں گودام کا ڈیمرج چارج ہوگا۔</p>
          <p>3. بلٹی کی اصل کاپی دکھائے بغیر مال کی ڈلیوری کسی صورت نہیں دی جائے گی۔ کسی بھی تنازعہ کی صورت میں عدالتِ کراچی مجاز ہوگی۔</p>
        </div>

        {/* Signature Areas */}
        <div className="grid grid-cols-3 border-t-2 border-black pt-3 mt-2 text-center text-[10px] font-bold">
          <div>
            <div className="border-b border-black w-32 mx-auto mb-1"></div>
            <p dir="rtl">دستخط کلرک / انچارج</p>
            <p className="text-[8px] text-slate-500 font-normal">Booking Officer Signature</p>
          </div>
          <div>
            <div className="border-b border-black w-32 mx-auto mb-1"></div>
            <p dir="rtl">دستخط ڈرائیور</p>
            <p className="text-[8px] text-slate-500 font-normal">Driver / Fleet Signature</p>
          </div>
          <div>
            <div className="border-b border-black w-32 mx-auto mb-1"></div>
            <p dir="rtl">دستخط و مہر وصول کنندہ</p>
            <p className="text-[8px] text-slate-500 font-normal">Receiver Signature &amp; Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
