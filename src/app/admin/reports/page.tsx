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
import { LogisticsCardSkeleton } from "@/components/shared/logistics-loader";

import {
  getStoredBilties,
  getStoredCustomers,
  getStoredDrivers,
  getStoredVehicles,
} from "@/lib/local-persistence";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Primary: Live Supabase queries if configured
      if (isSupabaseConfigured) {
        try {
          const [bRes, cRes, dRes, vRes] = await Promise.allSettled([
            supabase
              .from("bilties")
              .select("*")
              .or("is_deleted.is.null,is_deleted.eq.false")
              .neq("status", "DELETED"),
            supabase.from("customers").select("*", { count: "exact", head: true }),
            supabase.from("drivers").select("*", { count: "exact", head: true }),
            supabase.from("vehicles").select("*", { count: "exact", head: true }),
          ]);

          const rawBilties = bRes.status === "fulfilled" && Array.isArray(bRes.value.data) ? bRes.value.data : [];
          const activeBilties = rawBilties.filter((b: any) => !b.is_deleted && b.status !== "DELETED");

          const totalConsignments = activeBilties.length;
          const totalCustomers = cRes.status === "fulfilled" && typeof cRes.value.count === "number" ? cRes.value.count : 0;
          const totalDrivers = dRes.status === "fulfilled" && typeof dRes.value.count === "number" ? dRes.value.count : 0;
          const totalVehicles = vRes.status === "fulfilled" && typeof vRes.value.count === "number" ? vRes.value.count : 0;

          const lahoreCount = activeBilties.filter(
            (b: any) => (b.origin_station || b.origin || "").toLowerCase().includes("lahore")
          ).length;
          const karachiCount = activeBilties.filter(
            (b: any) => (b.origin_station || b.origin || "").toLowerCase().includes("karachi")
          ).length;
          const deliveredCount = activeBilties.filter(
            (b: any) => (b.status || "").toUpperCase() === "DELIVERED"
          ).length;
          const inTransitCount = activeBilties.filter((b: any) =>
            ["IN_TRANSIT", "DISPATCHED"].includes((b.status || "").toUpperCase())
          ).length;

          const totalFreight = activeBilties.reduce(
            (acc: number, b: any) => acc + (Number(b.freight_amount ?? b.total_freight ?? 0) || 0),
            0
          );
          const totalPaid = activeBilties.reduce(
            (acc: number, b: any) => acc + (Number(b.advance_paid ?? 0) || 0),
            0
          );
          const totalRemaining = activeBilties.reduce((acc: number, b: any) => {
            const freight = Number(b.freight_amount ?? b.total_freight ?? 0) || 0;
            const paid = Number(b.advance_paid ?? 0) || 0;
            const rem =
              b.remaining_balance !== undefined && b.remaining_balance !== null
                ? Number(b.remaining_balance)
                : Math.max(0, freight - paid);
            return acc + (isNaN(rem) ? 0 : rem);
          }, 0);

          let cashBooks: any[] = [];
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch("/api/admin/reports", { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data?.data?.cashBooks) {
              cashBooks = data.data.cashBooks;
            }
          } catch {}

          setReportData({
            summary: {
              totalCustomers,
              totalDrivers,
              totalVehicles,
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
            cashBooks,
            recentPayments: [],
          });
          return;
        } catch (sbErr) {
          console.warn("Direct Supabase reports query notice, falling back:", sbErr);
        }
      }

      // Secondary fallback if Supabase not configured
      let apiData: any = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch("/api/admin/reports", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.success && data.data) {
          apiData = data.data;
        }
      } catch (e) {
        console.warn("API reports fetch notice:", e);
      }

      const localBilties = getStoredBilties().filter(
        (b) => b && b.shipmentStatus !== "DELETED" && !String(b.id || "").startsWith("bilty-demo-")
      );
      const localCustomers = getStoredCustomers();
      const localDrivers = getStoredDrivers();
      const localVehicles = getStoredVehicles();

      if (apiData) {
        setReportData(apiData);
      } else {
        setReportData({
          summary: {
            totalCustomers: localCustomers.length,
            totalDrivers: localDrivers.length,
            totalVehicles: localVehicles.length,
            totalConsignments: localBilties.length,
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
    const exportFilename = `SPD_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (
      typeof navigator !== "undefined" &&
      typeof File !== "undefined" &&
      typeof navigator.canShare === "function"
    ) {
      try {
        const shareFile = new File([blob], exportFilename, { type: "text/csv;charset=utf-8" });
        if (navigator.canShare({ files: [shareFile] })) {
          navigator.share({
            files: [shareFile],
            title: exportFilename,
          }).catch(() => {});
        }
      } catch {}
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", exportFilename);
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
        <LogisticsCardSkeleton count={6} subtitle="Compiling Real-Time Analytics & Financial KPIs..." />
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
              <div className="p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-spd-blue uppercase">Karachi South Station (Head Office)</span>
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
                  Head office, seaport and industrial dispatch hub connecting southern ports, coastal routes, and Sindh regions.
                </p>
              </div>

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
                  Regional terminal serving Punjab, KPK, and Northern Pakistan corridors.
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
