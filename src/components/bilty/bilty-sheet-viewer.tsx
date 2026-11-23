"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  Edit,
  FileText,
  Receipt,
  FileCheck2,
  Layers,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { export4SheetBiltyExcel } from "@/lib/export-excel";
import { BiltyUrduNote } from "./bilty-urdu-note";
import { BiltyConsignmentNote } from "./bilty-consignment-note";
import { BiltyFreightBill } from "./bilty-freight-bill";
import { BiltySalesTaxInvoice } from "./bilty-sales-tax-invoice";

export type BiltySheetTab = "urdu" | "consignment" | "bill" | "tax-invoice" | "all";

interface BiltySheetViewerProps {
  bilty: any;
  initialTab?: BiltySheetTab;
  showBackLink?: boolean;
}

export function BiltySheetViewer({
  bilty,
  initialTab = "urdu",
  showBackLink = true,
}: BiltySheetViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BiltySheetTab>(initialTab);
  const [showPhotos, setShowPhotos] = useState(false);

  // Selective Printing Checkboxes (PDF Page 28 requirement)
  const [printSheets, setPrintSheets] = useState({
    urdu: true,
    consignment: true,
    bill: true,
    taxInvoice: true,
    photos: true,
  });

  if (!bilty) return null;

  const handleExcelExport = () => {
    export4SheetBiltyExcel(bilty);
  };

  const handlePrint = () => {
    window.print();
  };

  const photos = [
    bilty.cargoPhoto,
    bilty.biltyPhoto,
    bilty.weightSlipPhoto,
    ...(Array.isArray(bilty.photos) ? bilty.photos : []),
  ].filter(Boolean);

  const uniquePhotos = Array.from(new Set(photos));

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar — Hidden during Print */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Navigation & Bilty Meta */}
          <div className="flex items-center gap-3">
            {showBackLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/bilty")}
                className="rounded-xl text-xs font-bold gap-1.5 h-9"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Bilties</span>
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  Bilty #{bilty.biltyNumber}
                </span>
                <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  {bilty.shipmentStatus || "BOOKED"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {bilty.origin} &rarr; {bilty.destination} • Consignor: {bilty.senderName}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {bilty.id && (
              <Link href={`/admin/bilty/${bilty.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 h-9 text-slate-700 dark:text-slate-200"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Booking</span>
                </Button>
              </Link>
            )}

            {uniquePhotos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
                className="rounded-xl text-xs font-semibold gap-1.5 h-9 text-slate-700 dark:text-slate-200"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Photos ({uniquePhotos.length})</span>
              </Button>
            )}

            <Button
              onClick={handleExcelExport}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl gap-2 h-9 shadow-sm"
              title="Export complete 4-sheet multi-tab Excel (.xlsx) workbook"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </Button>

            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-spd-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-2 h-9 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected ({Object.values(printSheets).filter(Boolean).length})</span>
            </Button>
          </div>
        </div>

        {/* Selective Print Checkboxes Bar (PDF Page 28 Requirement) */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 mt-3 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-red-600" />
            <span>Select Sheets to Print:</span>
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={printSheets.urdu}
              onChange={(e) => setPrintSheets((p) => ({ ...p, urdu: e.target.checked }))}
              className="rounded text-red-600 w-3.5 h-3.5"
            />
            <span>Sheet 1: اردو بلٹی (Urdu Bilty)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={printSheets.consignment}
              onChange={(e) => setPrintSheets((p) => ({ ...p, consignment: e.target.checked }))}
              className="rounded text-red-600 w-3.5 h-3.5"
            />
            <span>Sheet 2: Consignment Note</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={printSheets.bill}
              onChange={(e) => setPrintSheets((p) => ({ ...p, bill: e.target.checked }))}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <span>Sheet 3: Freight Bill</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={printSheets.taxInvoice}
              onChange={(e) => setPrintSheets((p) => ({ ...p, taxInvoice: e.target.checked }))}
              className="rounded text-emerald-600 w-3.5 h-3.5"
            />
            <span>Sheet 4: Sales Tax Invoice</span>
          </label>
          {uniquePhotos.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={printSheets.photos}
                onChange={(e) => setPrintSheets((p) => ({ ...p, photos: e.target.checked }))}
                className="rounded text-purple-600 w-3.5 h-3.5"
              />
              <span>Full-Page Photos ({uniquePhotos.length})</span>
            </label>
          )}
        </div>

        {/* Tab Switcher Navigation */}
        <div className="flex items-center gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("urdu")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "urdu"
                ? "bg-red-800 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sheet 1: اردو بلٹی (Urdu Bilty)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("consignment")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "consignment"
                ? "bg-red-700 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sheet 2: Consignment Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bill")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "bill"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Sheet 3: Freight Bill</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax-invoice")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "tax-invoice"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Sheet 4: Sales Tax Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Sheets (View & Print)</span>
          </button>
        </div>
      </div>

      {/* Optional Photo Attachment Gallery preview (screen only) */}
      {showPhotos && uniquePhotos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 print:hidden space-y-3">
          <p className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Attached Shipment Photographs ({uniquePhotos.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uniquePhotos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-100"
              >
                <img
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Full</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Render Active Sheet on Screen */}
      <div className="w-full print:hidden">
        {activeTab === "urdu" && <BiltyUrduNote bilty={bilty} />}
        {activeTab === "consignment" && <BiltyConsignmentNote bilty={bilty} />}
        {activeTab === "bill" && <BiltyFreightBill bilty={bilty} />}
        {activeTab === "tax-invoice" && <BiltySalesTaxInvoice bilty={bilty} />}
        {activeTab === "all" && (
          <div className="space-y-8">
            <BiltyUrduNote bilty={bilty} defaultCopy="کسٹمر کاپی (Customer Copy)" />
            <BiltyConsignmentNote bilty={bilty} defaultCopy="Customer Copy" />
            <BiltyFreightBill bilty={bilty} />
            <BiltySalesTaxInvoice bilty={bilty} />
          </div>
        )}
      </div>

      {/* PRINT-ONLY CONTAINER: Respects Selective Checkboxes during window.print() */}
      <div className="hidden print:block w-full">
        {printSheets.urdu && (
          <div className="print:break-after-page">
            <BiltyUrduNote bilty={bilty} defaultCopy="کسٹمر کاپی (Customer Copy)" hideControls />
          </div>
        )}

        {printSheets.consignment && (
          <div className="print:break-after-page">
            <BiltyConsignmentNote bilty={bilty} defaultCopy="Customer Copy" hideControls />
          </div>
        )}

        {printSheets.bill && (
          <div className="print:break-after-page">
            <BiltyFreightBill bilty={bilty} />
          </div>
        )}

        {printSheets.taxInvoice && (
          <div className="print:break-after-page">
            <BiltySalesTaxInvoice bilty={bilty} />
          </div>
        )}

        {/* Full-Page Photo Printing (PDF Page 25: Photo full page ana chahiya) */}
        {printSheets.photos && uniquePhotos.length > 0 && (
          <div className="w-full">
            {uniquePhotos.map((url, i) => (
              <div key={i} className="print:break-before-page w-full min-h-[95vh] flex flex-col items-center justify-center p-4">
                <div className="text-center pb-3 border-b-2 border-black w-full mb-4">
                  <h3 className="font-black text-base uppercase tracking-wider text-black">
                    SUPER PAK DATA WALE GOODS TRANSPORT CO.® — PHOTO DOSSIER
                  </h3>
                  <p className="text-xs font-bold text-slate-700">
                    Consignment Bilty #{bilty.biltyNumber} • Photograph #{i + 1} of {uniquePhotos.length}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Route: {bilty.origin} &rarr; {bilty.destination} • Shipper: {bilty.senderName} • Consignee: {bilty.receiverName}
                  </p>
                </div>
                <div className="w-full flex-1 flex items-center justify-center border border-black rounded-lg p-2 bg-slate-50">
                  <img
                    src={url}
                    alt={`Shipment Document ${i + 1}`}
                    className="max-h-[80vh] max-w-full object-contain mx-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
