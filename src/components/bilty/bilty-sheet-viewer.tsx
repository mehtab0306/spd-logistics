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
import { BiltyConsignmentNote } from "./bilty-consignment-note";
import { BiltyFreightBill } from "./bilty-freight-bill";
import { BiltySalesTaxInvoice } from "./bilty-sales-tax-invoice";

export type BiltySheetTab = "consignment" | "bill" | "tax-invoice" | "all";

interface BiltySheetViewerProps {
  bilty: any;
  initialTab?: BiltySheetTab;
  showBackLink?: boolean;
}

export function BiltySheetViewer({
  bilty,
  initialTab = "consignment",
  showBackLink = true,
}: BiltySheetViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BiltySheetTab>(initialTab);
  const [showPhotos, setShowPhotos] = useState(false);

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
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* 4-Tab Switcher Navigation */}
        <div className="flex items-center gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 overflow-x-auto">
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
            <span>Sheet 4: Sales Tax Invoice (15%)</span>
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
            <span>All 4 Sheets (Full Dossier)</span>
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

      {/* Render Active Sheet or All-in-One Dossier */}
      <div className="w-full">
        {activeTab === "consignment" && <BiltyConsignmentNote bilty={bilty} />}
        {activeTab === "bill" && <BiltyFreightBill bilty={bilty} />}
        {activeTab === "tax-invoice" && <BiltySalesTaxInvoice bilty={bilty} />}
        {activeTab === "all" && (
          <div className="space-y-8 print:space-y-0">
            <div className="print:break-after-page">
              <BiltyConsignmentNote bilty={bilty} defaultCopy="Customer Copy" />
            </div>
            <div className="pt-6 print:pt-0 print:break-after-page">
              <BiltyFreightBill bilty={bilty} />
            </div>
            <div className="pt-6 print:pt-0">
              <BiltySalesTaxInvoice bilty={bilty} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
