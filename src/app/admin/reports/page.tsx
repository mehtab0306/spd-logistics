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

import {
  getStoredBilties,
  getStoredCustomers,
  getStoredDrivers,
  getStoredVehicles,
} from "@/lib/local-persistence";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let apiData: any = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("/api/admin/reports", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.success && data.data) {
          apiData = data.data;
        }
      } catch (e) {
        console.warn("API reports fetch notice:", e);
      }

      // Check if real local entries exist
      const localBilties = getStoredBilties().filter(
        (b) => b && b.shipmentStatus !== "DELETED" && !String(b.id || "").startsWith("bilty-demo-")
      );
      const localCustomers = getStoredCustomers();
      const localDrivers = getStoredDrivers();
      const localVehicles = getStoredVehicles();

      // If API summary is 0 or missing, but user has booked bilties in browser:
      if ((!apiData || !apiData.summary || apiData.summary.totalConsignments === 0) && localBilties.length > 0) {
        const totalConsignments = localBilties.length;
        const lahoreCount = localBilties.filter(
          (b) => (b.warehouse || "").toUpperCase().includes("LAHORE") || (b.origin || "").toLowerCase().includes("lahore")
        ).length;
        const karachiCount = localBilties.filter(
          (b) => (b.warehouse || "").toUpperCase().includes("KARACHI") || (b.origin || "").toLowerCase().includes("karachi")
        ).length;
        const deliveredCount = localBilties.filter((b) => b.shipmentStatus === "DELIVERED").length;
        const inTransitCount = localBilties.filter(
          (b) => b.shipmentStatus === "IN_TRANSIT" || b.shipmentStatus === "DISPATCHED"
        ).length;

        const totalFreight = localBilties.reduce(
          (acc, b) => acc + (parseFloat(b.freight || b.totalAmount || b.totalFreight) || 0),
          0
        );
        const totalPaid = localBilties.reduce((acc, b) => acc + (parseFloat(b.paidAmount) || 0), 0);
        const totalRemaining = localBilties.reduce((acc, b) => {
          const tot = parseFloat(b.freight || b.totalAmount || b.totalFreight) || 0;
          const pd = parseFloat(b.paidAmount) || 0;
          const rem = b.remainingBalance !== undefined ? parseFloat(b.remainingBalance) : Math.max(0, tot - pd);
          return acc + (isNaN(rem) ? 0 : rem);
        }, 0);

        setReportData({
          summary: {
            totalCustomers: Math.max(apiData?.summary?.totalCustomers || 0, localCustomers.length),
            totalDrivers: Math.max(apiData?.summary?.totalDrivers || 0, localDrivers.length),
            totalVehicles: Math.max(apiData?.summary?.totalVehicles || 0, localVehicles.length),
            totalConsignments,
            deliveredConsignments: deliveredCount,
            inTransitConsignments: inTransitCount,
            totalFreightRevenue: totalFreight,
            totalCollected: totalPaid,
            totalOutstanding: totalRemaining,
          },
          warehouseComparison: {
            lahore: {
              count: lahoreCount,
              percentage: totalConsignments > 0 ? Math.round((lahoreCount / totalConsignments) * 100) : 0,
            },
            karachi: {
              count: karachiCount,
              percentage: totalConsignments > 0 ? Math.round((karachiCount / totalConsignments) * 100) : 0,
            },
          },
          cashBooks: apiData?.cashBooks || [],
          recentPayments: apiData?.recentPayments || [],
        });
      } else if (apiData) {
        setReportData(apiData);
      } else {
        setReportData({
          summary: {
            totalCustomers: localCustomers.length,
            totalDrivers: localDrivers.length,
            totalVehicles: localVehicles.length,
            totalConsignments: 0,
            deliveredConsignments: 0,
            inTransitConsignments: 0,
            totalFreightRevenue: 0,
            totalCollected: 0,
            totalOutstanding: 0,
          },
          warehouseComparison: {
            lahore: { count: 0, percentage: 0 },
            karachi: { count: 0, percentage: 0 },
          },
          cashBooks: [],
          recentPayments: [],
        });
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReportData({
        summary: {
          totalCustomers: 0,
          totalDrivers: 0,
          totalVehicles: 0,
          totalConsignments: 0,
          deliveredConsignments: 0,
          inTransitConsignments: 0,
          totalFreightRevenue: 0,
          totalCollected: 0,
          totalOutstanding: 0,
        },
        warehouseComparison: {
          lahore: { count: 0, percentage: 0 },
          karachi: { count: 0, percentage: 0 },
        },
        cashBooks: [],
        recentPayments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportSummaryCSV = () => {
    const summary = reportData?.summary || {
      totalConsignments: 0,
      deliveredConsignments: 0,
      inTransitConsignments: 0,
      totalCustomers: 0,
      totalVehicles: 0,
      totalDrivers: 0,
      totalFreightRevenue: 0,
      totalCollected: 0,
      totalOutstanding: 0,
    };
    const warehouseComparison = reportData?.warehouseComparison || {
      lahore: { count: 0, percentage: 0 },
      karachi: { count: 0, percentage: 0 },
    };
    const lines = [
      "SPD Logistics Master Operations & Financial Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "METRIC,VALUE",
      `Total Consignments,${summary.totalConsignments || 0}`,
      `Delivered Consignments,${summary.deliveredConsignments || 0}`,
      `Active In-Transit,${summary.inTransitConsignments || 0}`,
      `Registered Customers,${summary.totalCustomers || 0}`,
      `Fleet Trucks,${summary.totalVehicles || 0}`,
      `Drivers,${summary.totalDrivers || 0}`,
      `Total Bilty Revenue (PKR),${summary.totalFreightRevenue || 0}`,
      `Total Freight Collected (PKR),${summary.totalCollected || 0}`,
      `Outstanding Receivables (PKR),${summary.totalOutstanding || 0}`,
      "",
      "WAREHOUSE,VOLUME,PERCENTAGE",
      `Lahore Central Hub,${warehouseComparison.lahore?.count || 0},${warehouseComparison.lahore?.percentage || 0}%`,
      `Karachi South Hub,${warehouseComparison.karachi?.count || 0},${warehouseComparison.karachi?.percentage || 0}%`,
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SPD_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.setAttribute("target", "_self");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // Defer cleanup for iOS Safari / WebKit asynchronous download processing
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      } catch (e) {
        // Safe cleanup fallback
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational &amp; Financial Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, Karachi vs Lahore comparison, cash balances, and performance KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportSummaryCSV}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Report</span>
          </Button>
          <Button
            onClick={() => window.print()}
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
                    {reportData?.warehouseComparison?.lahore?.count || 0} ({reportData?.warehouseComparison?.lahore?.percentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spd-red rounded-full transition-all duration-500"
                    style={{ width: `${reportData?.warehouseComparison?.lahore?.percentage || 0}%` }}
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
                    {reportData?.warehouseComparison?.karachi?.count || 0} ({reportData?.warehouseComparison?.karachi?.percentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spd-blue rounded-full transition-all duration-500"
                    style={{ width: `${reportData?.warehouseComparison?.karachi?.percentage || 0}%` }}
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
            {!reportData?.cashBooks || reportData.cashBooks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400">No Cash Book Transactions Recorded</p>
                <p className="text-[11px] text-slate-500 mt-1">Balances will display dynamically as vouchers are entered in Cash Books.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {reportData.cashBooks.map((cb: any) => (
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
                        {formatCurrency(cb.balance || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
