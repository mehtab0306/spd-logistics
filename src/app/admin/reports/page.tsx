"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Printer,
  Download,
  MapPin,
  Package,
  Users,
  Truck,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportSummaryCSV = () => {
    if (!reportData) return;
    const { summary, warehouseComparison } = reportData;
    const lines = [
      "SPD Logistics Master Operations & Financial Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "METRIC,VALUE",
      `Total Consignments,${summary.totalConsignments}`,
      `Delivered Consignments,${summary.deliveredConsignments}`,
      `Active In-Transit,${summary.inTransitConsignments}`,
      `Registered Customers,${summary.totalCustomers}`,
      `Fleet Trucks,${summary.totalVehicles}`,
      `Drivers,${summary.totalDrivers}`,
      `Total Bilty Revenue (PKR),${summary.totalFreightRevenue}`,
      `Total Freight Collected (PKR),${summary.totalCollected}`,
      `Outstanding Receivables (PKR),${summary.totalOutstanding}`,
      "",
      "WAREHOUSE,VOLUME,PERCENTAGE",
      `Lahore Central Hub,${warehouseComparison.lahore.count},${warehouseComparison.lahore.percentage}%`,
      `Karachi South Hub,${warehouseComparison.karachi.count},${warehouseComparison.karachi.percentage}%`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SPD_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational & Financial Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, Karachi vs Lahore comparison, cash balances, and performance KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportSummaryCSV}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </Button>
          <Button
            onClick={() => window.print()}
            disabled={loading}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Executive Summary</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-400 font-semibold">Compiling real-time report data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400">Total Booked Freight</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(reportData?.summary?.totalFreightRevenue || 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across all registered consignments</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <span className="text-xs font-bold uppercase text-emerald-600">Collected Revenue</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(reportData?.summary?.totalCollected || 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Cleared customer and cash payments</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <span className="text-xs font-bold uppercase text-amber-600">Outstanding Balance</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {formatCurrency(reportData?.summary?.totalOutstanding || 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Pending customer receivable ledger</p>
            </div>
          </div>

          {/* Regional Hub Comparison */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-spd-red" />
                Karachi Hub vs. Lahore Hub Operations Analysis
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {reportData?.summary?.totalConsignments || 0} Total Recorded Bilties
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="p-4 rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-spd-red uppercase">Lahore Central Station</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {reportData?.warehouseComparison?.lahore?.count} ({reportData?.warehouseComparison?.lahore?.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spd-red rounded-full"
                    style={{ width: `${Math.max(5, reportData?.warehouseComparison?.lahore?.percentage || 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Primary booking and distribution terminal serving Punjab, KPK, and Northern Pakistan corridors.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-spd-blue uppercase">Karachi South Station</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {reportData?.warehouseComparison?.karachi?.count} ({reportData?.warehouseComparison?.karachi?.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spd-blue rounded-full"
                    style={{ width: `${Math.max(5, reportData?.warehouseComparison?.karachi?.percentage || 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Seaport and industrial dispatch hub connecting southern ports, coastal routes, and Sindh regions.
                </p>
              </div>
            </div>
          </div>

          {/* Cash Books Regional Balances */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Operating Cash Books Summary
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {reportData?.cashBooks?.map((cb: any) => (
                <div
                  key={cb.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{cb.name}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{cb.city} Office</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(cb.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
