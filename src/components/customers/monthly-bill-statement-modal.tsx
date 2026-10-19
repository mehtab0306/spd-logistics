"use client";

import React, { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { exportToExcel } from "@/lib/export-excel";
import { getStoredBilties } from "@/lib/local-persistence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";

export interface MonthlyBillCustomer {
  id?: string;
  name: string;
  companyName?: string;
  phone?: string;
  city?: string;
  address?: string;
  businessRef?: string;
}

interface MonthlyBillStatementModalProps {
  customer: MonthlyBillCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  initialBilties?: any[];
}

export function MonthlyBillStatementModal({
  customer,
  isOpen,
  onClose,
  initialBilties,
}: MonthlyBillStatementModalProps) {
  const [allBilties, setAllBilties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Date filtering state
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const [filterMode, setFilterMode] = useState<"MONTH" | "CUSTOM" | "ALL">("MONTH");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthYear);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Load bilties for this customer
  useEffect(() => {
    if (!customer || !isOpen) return;

    if (initialBilties && initialBilties.length > 0) {
      setAllBilties(initialBilties);
      return;
    }

    const loadCustomerBilties = async () => {
      try {
        setLoading(true);
        // 1. Local persistence lookup
        const stored = getStoredBilties();
        let list = Array.isArray(stored) ? stored : [];

        // 2. Fetch from central API
        try {
          const res = await fetch("/api/admin/bilty?limit=300");
          if (res.ok) {
            const data = await res.json();
            const serverList = data.data || data.consignments || [];
            if (Array.isArray(serverList) && serverList.length > 0) {
              const ids = new Set(list.map((b: any) => b.id || b.biltyNumber));
              serverList.forEach((sb: any) => {
                if (!ids.has(sb.id || sb.biltyNumber)) {
                  list.push(sb);
                }
              });
            }
          }
        } catch (apiErr) {
          console.warn("API bilty fetch notice:", apiErr);
        }

        // 3. Match bilties for this customer
        const custName = (customer.name || "").toLowerCase().trim();
        const compName = (customer.companyName || "").toLowerCase().trim();
        const custId = customer.id || "";

        const matched = list.filter((b: any) => {
          if (!b) return false;
          if (custId && (b.customerId === custId || b.senderId === custId || b.receiverId === custId)) {
            return true;
          }
          const sName = String(b.senderName || b.sender?.name || "").toLowerCase();
          const rName = String(b.receiverName || b.receiver?.name || "").toLowerCase();
          const cName = String(b.customerName || b.customer?.name || b.customer?.companyName || "").toLowerCase();

          return (
            (custName && (sName.includes(custName) || rName.includes(custName) || cName.includes(custName))) ||
            (compName && (sName.includes(compName) || rName.includes(compName) || cName.includes(compName)))
          );
        });

        setAllBilties(matched);
      } catch (err) {
        console.error("Error loading customer bilties:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerBilties();
  }, [customer, isOpen, initialBilties]);

  // Filter bilties according to selected date criteria
  const filteredBilties = useMemo(() => {
    return allBilties.filter((b: any) => {
      const bDateStr = b.date || b.createdAt || "";
      if (!bDateStr) return filterMode === "ALL";

      const bDate = new Date(bDateStr);
      if (isNaN(bDate.getTime())) return true;

      if (filterMode === "MONTH") {
        if (!selectedMonth) return true;
        const [year, month] = selectedMonth.split("-");
        return (
          bDate.getFullYear() === parseInt(year, 10) &&
          bDate.getMonth() + 1 === parseInt(month, 10)
        );
      }

      if (filterMode === "CUSTOM") {
        const start = startDate ? new Date(startDate).getTime() : -Infinity;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
        const bTime = bDate.getTime();
        return bTime >= start && bTime <= end;
      }

      return true;
    }).sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }, [allBilties, filterMode, selectedMonth, startDate, endDate]);

  // Breakdown items and packaging details per bilty
  const parsedRows = useMemo(() => {
    return filteredBilties.map((b: any, index: number) => {
      let pipe = 0;
      let pati = 0;
      let bora = 0;
      let ctnL = 0;
      let ctnS = 0;

      const items = Array.isArray(b.items) && b.items.length > 0 ? b.items : null;

      if (items) {
        items.forEach((item: any) => {
          const desc = String(item.description || item.itemDetail || "").toLowerCase();
          const q = Number(item.quantity) || 1;

          if (desc.includes("pipe")) {
            pipe += q;
          } else if (desc.includes("pati") || desc.includes("patti") || desc.includes("bundle") || desc.includes("strip")) {
            pati += q;
          } else if (desc.includes("bora") || desc.includes("bag") || desc.includes("sack") || desc.includes("bori")) {
            bora += q;
          } else if (desc.includes("ctn l") || desc.includes("large carton") || desc.includes("pallet") || desc.includes("drum")) {
            ctnL += q;
          } else if (desc.includes("ctn s") || desc.includes("small carton") || desc.includes("box") || desc.includes("carton") || desc.includes("ctn")) {
            ctnS += q;
          } else {
            // General packaging assigned to ctnS
            ctnS += q;
          }
        });
      } else {
        const desc = String(b.packageDetails || b.itemDetail || b.goodsDescription || "").toLowerCase();
        const q = Number(b.quantity || b.packagesCount) || 1;

        if (desc.includes("pipe")) {
          pipe += q;
        } else if (desc.includes("pati") || desc.includes("patti") || desc.includes("bundle")) {
          pati += q;
        } else if (desc.includes("bora") || desc.includes("bag") || desc.includes("sack")) {
          bora += q;
        } else if (desc.includes("ctn l") || desc.includes("large")) {
          ctnL += q;
        } else {
          ctnS += q;
        }
      }

      const totalQty = pipe + pati + bora + ctnL + ctnS;
      const freightAmount = Number(b.freightAmount ?? b.freight ?? (b.totalAmount ? b.totalAmount - (b.labourCharges || 0) - (b.godownCharges || 0) : 0)) || 0;
      const godown = Number(b.godownCharges ?? b.demurrageCharges ?? b.storageCharges ?? 0) || 0;
      const labour = Number(b.labourCharges ?? b.laborCharges ?? 0) || 0;
      const total = Number(b.totalAmount ?? (freightAmount + godown + labour)) || 0;

      const dateStr = b.date
        ? new Date(b.date).toLocaleDateString("en-GB")
        : b.createdAt
        ? new Date(b.createdAt).toLocaleDateString("en-GB")
        : "-";

      return {
        sNo: index + 1,
        date: dateStr,
        biltyNo: b.biltyNumber || b.id || `BILTY-${index + 1}`,
        qty: totalQty,
        pipe,
        pati,
        bora,
        ctnL,
        ctnS,
        freightAmount,
        godown,
        labour,
        total,
      };
    });
  }, [filteredBilties]);

  // Aggregate totals
  const totals = useMemo(() => {
    return parsedRows.reduce(
      (acc, row) => ({
        qty: acc.qty + row.qty,
        pipe: acc.pipe + row.pipe,
        pati: acc.pati + row.pati,
        bora: acc.bora + row.bora,
        ctnL: acc.ctnL + row.ctnL,
        ctnS: acc.ctnS + row.ctnS,
        freightAmount: acc.freightAmount + row.freightAmount,
        godown: acc.godown + row.godown,
        labour: acc.labour + row.labour,
        total: acc.total + row.total,
      }),
      {
        qty: 0,
        pipe: 0,
        pati: 0,
        bora: 0,
        ctnL: 0,
        ctnS: 0,
        freightAmount: 0,
        godown: 0,
        labour: 0,
        total: 0,
      }
    );
  }, [parsedRows]);

  // Format month label
  const statementPeriodLabel = useMemo(() => {
    if (filterMode === "MONTH") {
      if (!selectedMonth) return "Current Statement";
      const [year, month] = selectedMonth.split("-");
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (filterMode === "CUSTOM") {
      return `${startDate || "Start"} to ${endDate || "End"}`;
    }
    return "All Recorded Bookings";
  }, [filterMode, selectedMonth, startDate, endDate]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!parsedRows.length || !customer) return;

    const data = parsedRows.map((r) => ({
      "S.NO": r.sNo,
      "DATE": r.date,
      "BILTY NO": r.biltyNo,
      "QTY": r.qty,
      "PIPE": r.pipe || 0,
      "PATI": r.pati || 0,
      "BORA": r.bora || 0,
      "CTN L": r.ctnL || 0,
      "CTN S": r.ctnS || 0,
      "FREIGHT AMOUNT": r.freightAmount,
      "GODOWN": r.godown,
      "LABOUR": r.labour,
      "TOTAL": r.total,
    }));

    // Add Summary Row
    data.push({
      "S.NO": "TOTAL",
      "DATE": "",
      "BILTY NO": `${parsedRows.length} BILTIES`,
      "QTY": totals.qty,
      "PIPE": totals.pipe,
      "PATI": totals.pati,
      "BORA": totals.bora,
      "CTN L": totals.ctnL,
      "CTN S": totals.ctnS,
      "FREIGHT AMOUNT": totals.freightAmount,
      "GODOWN": totals.godown,
      "LABOUR": totals.labour,
      "TOTAL": totals.total,
    } as any);

    const safeClientName = (customer.companyName || customer.name).replace(/[^a-zA-Z0-9_-]/g, "_");
    exportToExcel(data, `Bill_Statement_${safeClientName}_${statementPeriodLabel.replace(/\s+/g, "_")}`);
  };

  // Print A4 handler
  const handlePrint = () => {
    window.print();
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        <DialogHeader className="print:hidden pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-spd-red/10 text-spd-red dark:bg-spd-red/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white">
                  Monthly Freight Bill &amp; Statement
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Client: <strong className="text-slate-800 dark:text-slate-200">{customer.companyName || customer.name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={!parsedRows.length}
                className="gap-1.5 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 rounded-xl"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xlsx)</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                disabled={!parsedRows.length}
                className="gap-1.5 text-xs font-bold bg-spd-red hover:bg-spd-redHover text-white rounded-xl shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF (A4)</span>
              </Button>
            </div>
          </div>

          {/* Period Filter Controls */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Statement Period:</span>
            </div>

            <button
              type="button"
              onClick={() => setFilterMode("MONTH")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                filterMode === "MONTH"
                  ? "bg-spd-blue text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Month View
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("CUSTOM")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                filterMode === "CUSTOM"
                  ? "bg-spd-blue text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Custom Range
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                filterMode === "ALL"
                  ? "bg-spd-blue text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All Records
            </button>

            {filterMode === "MONTH" && (
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40 h-8 text-xs font-semibold rounded-lg"
              />
            )}

            {filterMode === "CUSTOM" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36 h-8 text-xs font-semibold rounded-lg"
                  placeholder="Start"
                />
                <span className="text-slate-400">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 h-8 text-xs font-semibold rounded-lg"
                  placeholder="End"
                />
              </div>
            )}
          </div>
        </DialogHeader>

        {/* ======================================================== */}
        {/* A4 CORPORATE LETTERHEAD & PRINTABLE STATEMENT CONTAINER */}
        {/* ======================================================== */}
        <div
          id="customer-monthly-bill-printable"
          data-print-target="true"
          className="printable-document font-sans text-black p-3 sm:p-5 bg-white space-y-2.5 max-w-[194mm] mx-auto box-border"
        >
          {/* Official Letterhead Header: Left-aligned oval SPD Logo with red/navy typography */}
          <div className="border-b-2 border-black pb-2 text-black font-sans">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <img
                  src="/images/spd-logo.jpg"
                  alt="SPD Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full border-2 border-red-600 p-0.5 shadow-xs"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-red-600 uppercase leading-none">
                  SUPER PAK DATA WALE GOODS TRANSPORT CO.®
                </h1>
                <div className="mt-1 text-[9px] sm:text-[9.5px] leading-tight space-y-0.5 text-slate-800">
                  <p className="font-bold text-slate-900">
                    <span className="font-black text-blue-950">HEAD OFFICE:</span> Plot No.9, Gate No.1 Street No.4 Truck Stand, Hawksbay Road, Karachi.
                  </p>
                  <p className="font-semibold text-slate-800">
                    <span className="font-bold text-blue-950">PHONE:</span> 0300-2024433, 0321-2024433, 0312-2024433, 0302-2314433, 021-32351333
                  </p>
                  <p className="font-bold text-slate-900">
                    <span className="font-black text-blue-950">BRANCH OFFICE:</span> Saggian Bypass, Near IGG House, Hazrat Ali Road Lahore.
                  </p>
                  <p className="font-semibold text-slate-800">
                    <span className="font-bold text-blue-950">Phone:</span> 0325-2024433, 0301-8264433, 0300-2928633
                  </p>
                  <p className="text-[8.5px] font-medium text-slate-700">
                    Email: spdgoodstransport@gmail.com &bull; Website: superpakdata.com &bull; <strong className="text-black">IT NTN: 4774077-5</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Centered Underlined Title */}
          <div className="text-center py-0.5">
            <h2 className="text-base font-black tracking-widest text-black uppercase underline decoration-2 underline-offset-4">
              BILL
            </h2>
          </div>

          {/* Client Block & Billing Metadata */}
          <div className="flex items-start justify-between border-y border-black py-1.5 px-1 text-xs">
            <div className="space-y-0.5 max-w-[65%]">
              <p className="text-[9px] font-black uppercase text-slate-600 tracking-wider">
                BILL TO,
              </p>
              <h3 className="text-xs sm:text-sm font-black text-black uppercase">
                M/S {customer.companyName || customer.name}
              </h3>
              {customer.address && (
                <p className="text-[9.5px] text-slate-700 font-medium leading-snug">
                  {customer.address}
                </p>
              )}
              {customer.phone && (
                <p className="text-[9.5px] text-slate-800 font-mono font-bold">
                  Ph: {customer.phone}
                </p>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <p className="text-[9.5px] font-bold text-slate-800 uppercase">
                Statement Period: <span className="font-black text-black">{statementPeriodLabel}</span>
              </p>
              <p className="text-[9.5px] font-mono text-slate-700">
                Date: {new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <p className="text-[9px] font-mono text-slate-500">
                Total Consignments: <strong className="text-black">{parsedRows.length}</strong>
              </p>
            </div>
          </div>

          {/* Structured Statement Table - Strictly 100% width with fixed percentages */}
          <div className="w-full overflow-hidden">
            <table
              className="w-full border-collapse border border-black text-[9px] table-fixed"
              style={{ width: "100%", tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 font-black text-black text-center uppercase tracking-tight">
                  <th className="border border-black p-1">S.NO</th>
                  <th className="border border-black p-1">DATE</th>
                  <th className="border border-black p-1">BILTY NO</th>
                  <th className="border border-black p-1 bg-amber-50">QTY</th>
                  <th className="border border-black p-1">PIPE</th>
                  <th className="border border-black p-1">PATI</th>
                  <th className="border border-black p-1">BORA</th>
                  <th className="border border-black p-1">CTN L</th>
                  <th className="border border-black p-1">CTN S</th>
                  <th className="border border-black p-1 text-right">AMOUNT</th>
                  <th className="border border-black p-1 text-right">GODOWN</th>
                  <th className="border border-black p-1 text-right">LABOUR</th>
                  <th className="border border-black p-1 text-right bg-slate-200">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => (
                  <tr key={row.sNo} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-black p-1 text-center font-mono font-bold truncate">{row.sNo}</td>
                    <td className="border border-black p-1 text-center whitespace-nowrap font-mono truncate">{row.date}</td>
                    <td className="border border-black p-1 font-mono font-bold text-slate-900 truncate">{row.biltyNo}</td>
                    <td className="border border-black p-1 text-center font-bold bg-amber-50/40">{row.qty}</td>
                    <td className="border border-black p-1 text-center font-mono">{row.pipe || "—"}</td>
                    <td className="border border-black p-1 text-center font-mono">{row.pati || "—"}</td>
                    <td className="border border-black p-1 text-center font-mono">{row.bora || "—"}</td>
                    <td className="border border-black p-1 text-center font-mono">{row.ctnL || "—"}</td>
                    <td className="border border-black p-1 text-center font-mono">{row.ctnS || "—"}</td>
                    <td className="border border-black p-1 text-right font-mono font-semibold truncate">
                      {row.freightAmount > 0 ? formatCurrency(row.freightAmount) : "—"}
                    </td>
                    <td className="border border-black p-1 text-right font-mono truncate">
                      {row.godown > 0 ? formatCurrency(row.godown) : "—"}
                    </td>
                    <td className="border border-black p-1 text-right font-mono truncate">
                      {row.labour > 0 ? formatCurrency(row.labour) : "—"}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-black text-black bg-slate-100/50 truncate">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}

                {parsedRows.length === 0 && (
                  <tr>
                    <td colSpan={13} className="border border-black p-4 text-center text-slate-400 italic">
                      No freight bookings found for {customer.companyName || customer.name} in {statementPeriodLabel}.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-black text-black">
                  <td colSpan={3} className="border border-black p-1.5 text-center font-black uppercase text-[9px]">
                    TOTAL ({parsedRows.length}):
                  </td>
                  <td className="border border-black p-1.5 text-center font-black text-black bg-amber-100">
                    {totals.qty}
                  </td>
                  <td className="border border-black p-1.5 text-center font-mono">{totals.pipe || 0}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{totals.pati || 0}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{totals.bora || 0}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{totals.ctnL || 0}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{totals.ctnS || 0}</td>
                  <td className="border border-black p-1.5 text-right font-mono font-black truncate">
                    {formatCurrency(totals.freightAmount)}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold truncate">
                    {formatCurrency(totals.godown)}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold truncate">
                    {formatCurrency(totals.labour)}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-black text-black bg-slate-200 truncate">
                    {formatCurrency(totals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signatures & Stamp Box Footer */}
          <div className="pt-4 mt-3 border-t border-black break-inside-avoid">
            <div className="flex items-end justify-between text-xs">
              <div className="space-y-1 max-w-[55%]">
                <p className="text-[9.5px] text-slate-700 font-medium leading-tight">
                  <strong className="text-black uppercase">Notice:</strong> Payment strictly due upon receipt of this official freight bill statement.
                </p>
                <p className="text-[9px] text-slate-600 font-medium leading-tight">
                  All consignments delivered subject to Super Pak Data standard goods transport carriage terms and conditions.
                </p>
              </div>

              <div className="text-center min-w-[220px]">
                <div className="h-12 border border-dashed border-slate-400 rounded-sm mb-1 flex items-center justify-center text-[9px] text-slate-400 italic">
                  Official Transport Stamp
                </div>
                <div className="border-t-2 border-black pt-1">
                  <p className="font-black text-[11px] uppercase tracking-tight text-black">
                    PROPRIETOR
                  </p>
                  <p className="font-bold text-[9px] uppercase text-red-600">
                    SUPER PAK DATA WALE GOODS TRANSPORT CO.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Close Footer */}
        <div className="print:hidden pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{parsedRows.length} bilty entries loaded for {customer.name}</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
