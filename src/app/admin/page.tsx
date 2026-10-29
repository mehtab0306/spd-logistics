"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  Truck,
  UserCog,
  CreditCard,
  Wallet,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getStoredBilties,
  getStoredCustomers,
  getStoredDrivers,
  getStoredChallans,
} from "@/lib/local-persistence";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [consignments, setConsignments] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [totalFreight, setTotalFreight] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [trucksCount, setTrucksCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);
  const [cashBooksCount, setCashBooksCount] = useState(2);
  const [lahoreCount, setLahoreCount] = useState(0);
  const [karachiCount, setKarachiCount] = useState(0);
  const [recentBilties, setRecentBilties] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Initial load: Purge any legacy stale offline cache keys from window.localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const legacyCacheKeys = [
          "spd_local_bilties",
          "spd_bilties",
          "spd_local_tracking",
          "spd_deliveries",
          "spd_ledger_items",
          "spd_offline_accounts",
          "spd_cached_stats",
          "spd_offline_bilties",
          "spd_cache_v1",
          "spd_local_challans",
          "spd_local_customers",
        ];
        legacyCacheKeys.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.warn("Storage cache purge notice:", e);
      }
    }
  }, []);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      let biltiesList: any[] = [];
      let custCount = 0;
      let drvList: any[] = [];
      let chList: any[] = [];
      let cbCount = 0;
      let logsList: any[] = [];

      // 1. Direct Live Supabase Cloud Database Query
      if (isSupabaseConfigured) {
        try {
          const [bRes, cRes, dRes, chRes, cbRes, nRes] = await Promise.allSettled([
            supabase
              .from("bilties")
              .select("*")
              .or("is_deleted.is.null,is_deleted.eq.false")
              .neq("status", "DELETED")
              .order("created_at", { ascending: false }),
            supabase.from("customers").select("*", { count: "exact", head: true }),
            supabase.from("drivers").select("*"),
            supabase.from("challans").select("*"),
            supabase.from("cash_books").select("id", { count: "exact", head: true }),
            supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(6),
          ]);

          if (bRes.status === "fulfilled" && Array.isArray(bRes.value.data)) {
            biltiesList = bRes.value.data.filter((b: any) => !b.is_deleted && b.status !== "DELETED");
          }
          if (cRes.status === "fulfilled" && typeof cRes.value.count === "number") {
            custCount = cRes.value.count;
          }
          if (dRes.status === "fulfilled" && Array.isArray(dRes.value.data)) {
            drvList = dRes.value.data;
          }
          if (chRes.status === "fulfilled" && Array.isArray(chRes.value.data)) {
            chList = chRes.value.data;
          }
          if (cbRes.status === "fulfilled" && typeof cbRes.value.count === "number") {
            cbCount = cbRes.value.count;
          }
          if (nRes.status === "fulfilled" && Array.isArray(nRes.value.data)) {
            logsList = nRes.value.data.map((n: any) => ({
              id: n.id,
              action: n.type || "INFO",
              module: n.title || "SYSTEM",
              details: n.message || "Notification logged",
              createdAt: n.created_at || new Date().toISOString(),
            }));
          }
        } catch (sbErr) {
          console.warn("Supabase dashboard live query error:", sbErr);
        }
      } else {
        // Fallback only if Supabase environment variables are missing
        try {
          const res = await fetch("/api/admin/bilty", { cache: "no-store" });
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            biltiesList = data.data.filter((b: any) => !b.is_deleted && b.status !== "DELETED");
          }
        } catch {}
      }

      // Calculate Real-Time KPIs directly from active Supabase records
      const totalConsignments = biltiesList.length;
      const activeInTransit = biltiesList.filter((b: any) => {
        const st = String(b.status || b.shipmentStatus || "").toLowerCase();
        return st === "in-transit" || st === "in_transit" || st.includes("transit") || st.includes("dispatch");
      }).length;

      const delivered = biltiesList.filter((b: any) => {
        const st = String(b.status || b.shipmentStatus || "").toLowerCase();
        return st === "delivered" || st.includes("deliver");
      }).length;

      const totalBiltyFreight = biltiesList.reduce((acc: number, b: any) => {
        return acc + (Number(b.freight_amount ?? b.total_freight ?? b.totalFreight ?? b.totalAmount) || 0);
      }, 0);

      const totalPaidAmount = biltiesList.reduce((acc: number, b: any) => {
        return acc + (Number(b.advance_paid ?? b.paidAmount) || 0);
      }, 0);

      const outstandingBalance = biltiesList.reduce((acc: number, b: any) => {
        return acc + (Number(b.remaining_balance ?? b.remainingBalance) || 0);
      }, 0);

      // Hub Volume Calculations
      let lhr = 0;
      let khi = 0;
      for (const b of biltiesList) {
        const orig = String(b.origin_station || b.origin || "").toLowerCase();
        const dest = String(b.destination_station || b.destination || "").toLowerCase();
        const wh = String(b.warehouse || "").toLowerCase();
        if (orig.includes("lahore") || dest.includes("lahore") || wh.includes("lahore")) lhr++;
        if (orig.includes("karachi") || dest.includes("karachi") || wh.includes("karachi")) khi++;
      }

      setConsignments(totalConsignments);
      setPendingDeliveries(activeInTransit);
      setDeliveredCount(delivered);
      setCustomerCount(custCount);
      setTotalFreight(totalBiltyFreight);
      setTotalPaid(totalPaidAmount);
      setTotalRemaining(outstandingBalance);
      setTrucksCount(chList.length);
      setDriversCount(drvList.length);
      setCashBooksCount(cbCount);
      setLahoreCount(lhr);
      setKarachiCount(khi);

      // Format recent bilties
      const formattedRecent = biltiesList.slice(0, 6).map((c: any) => ({
        id: c.id || c.bilty_number || c.biltyNumber,
        biltyNumber: c.bilty_number || c.biltyNumber || c.id,
        origin: c.origin_station || c.origin || "Lahore",
        destination: c.destination_station || c.destination || "Karachi",
        senderName: c.sender_name || c.senderName || "Walk-in Customer",
        customerName: c.customer?.companyName || c.sender_name || c.senderName || "Walk-in Customer",
        totalAmount: Number(c.freight_amount ?? c.total_freight ?? c.totalFreight ?? c.totalAmount ?? 0),
        shipmentStatus: String(c.status || c.shipmentStatus || "BOOKED").toUpperCase(),
      }));
      setRecentBilties(formattedRecent);

      if (logsList.length > 0) {
        setRecentLogs(logsList);
      }
    } catch (err) {
      console.error("Dashboard metrics calculation error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();

    const handleFocus = () => {
      fetchDashboardMetrics();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("spd-bilty-updated", handleFocus);
    window.addEventListener("spd-customer-updated", handleFocus);
    window.addEventListener("spd-data-updated", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("spd-bilty-updated", handleFocus);
      window.removeEventListener("spd-customer-updated", handleFocus);
      window.removeEventListener("spd-data-updated", handleFocus);
    };
  }, [fetchDashboardMetrics]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardMetrics();
  };

  const lahorePct = consignments > 0 ? Math.round((lahoreCount / consignments) * 100) : 50;
  const karachiPct = consignments > 0 ? Math.round((karachiCount / consignments) * 100) : 50;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-spd-red/20 text-red-400 border border-red-500/30">
              Enterprise Fleet Operations
            </span>
            <span className="text-xs text-slate-400 font-medium">&bull; Real-time Central Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            SPD Logistics Management Command
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Nationwide cargo network &bull; Karachi &bull; Lahore &bull; Islamabad &bull; Motorway & Highway Corridors
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={handleManualRefresh}
            className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-750 font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-spd-red" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Live"}</span>
          </Button>
          <Link href="/admin/bilty/new">
            <Button className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4">
              <Package className="w-4 h-4" />
              <span>Create New Bilty</span>
            </Button>
          </Link>
          <Link href="/admin/customers/new">
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-bold text-xs rounded-xl gap-2 h-10 px-4">
              <Users className="w-4 h-4 text-spd-blue" />
              <span>Add Customer</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Consignments"
          value={consignments.toString()}
          icon={Package}
          description="Total recorded bilties"
        />
        <StatsCard
          title="Active In-Transit"
          value={pendingDeliveries.toString()}
          icon={Truck}
          description="Dispatched on highway"
        />
        <StatsCard
          title="Delivered Orders"
          value={deliveredCount.toString()}
          icon={CheckCircle2}
          description="Confirmed recipient deliveries"
        />
        <StatsCard
          title="Registered Clients"
          value={customerCount.toString()}
          icon={Users}
          description="Verified customer accounts"
        />
      </div>

      {/* Financial & Fleet Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Bilty Freight</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-spd-blue">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
            {formatCurrency(totalFreight)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total booked cargo billing</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Paid Amount</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Collected freight revenue</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pending customer balance</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Fleet Assets</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:purple-950/60 text-purple-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
            {trucksCount} Trucks / {driversCount} Drivers
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{cashBooksCount} Separate Cash Books</p>
        </div>
      </div>

      {/* Karachi vs Lahore Warehouse Operations Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-spd-red" />
                Karachi vs. Lahore Warehouse Hubs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Operations volume and consignment flow</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{consignments} Total Bilties</span>
          </div>

          <div className="space-y-4">
            {/* Lahore Hub */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-spd-red" />
                  Lahore Central Hub (Bhati Gate & Terminal)
                </span>
                <span className="text-slate-900 dark:text-white">{lahoreCount} ({lahorePct}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, lahorePct)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Main hub for Punjab and Northern dispatch operations.</p>
            </div>

            {/* Karachi Hub */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-spd-blue" />
                  Karachi South Hub (Port & Transport Nagar)
                </span>
                <span className="text-slate-900 dark:text-white">{karachiCount} ({karachiPct}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, karachiPct)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Gateway hub for Sindh, coastal, and shipping terminal cargo.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link href="/admin/cash-books" className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-spd-red/40 transition-colors">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Hammad Cash Book</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">Lahore Office</p>
            </Link>
            <Link href="/admin/cash-books" className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-spd-blue/40 transition-colors">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Hammad Cash Book</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">Karachi Office</p>
            </Link>
          </div>
        </div>

        {/* Quick Operations Nav */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white">Quick Operations</h2>
            <span className="text-xs text-slate-400">Direct Module Links</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/admin/bilty/new">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-spd-red hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-spd-red flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">New Bilty</p>
                  <p className="text-[10px] text-slate-400">Create voucher</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/customers">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-spd-blue hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Customers</p>
                  <p className="text-[10px] text-slate-400">Manage & logins</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/drivers">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Drivers</p>
                  <p className="text-[10px] text-slate-400">Fleet drivers</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/cash-books">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Cash Books</p>
                  <p className="text-[10px] text-slate-400">LHR & KHI books</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/payments">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Payments</p>
                  <p className="text-[10px] text-slate-400">Record receipt</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/reports">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Reports</p>
                  <p className="text-[10px] text-slate-400">Export & stats</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bilties & System Audit Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bilties */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-spd-blue" />
              Recent Consignment Bilties
            </h2>
            <Link href="/admin/bilty">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {recentBilties.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No bilties created yet"
              description="Create your first bilty voucher to populate active consignments."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentBilties.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/bilty/${encodeURIComponent(c.biltyNumber || c.id)}`}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.biltyNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {c.origin} &rarr; {c.destination}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.customerName || c.senderName || "Walk-in Customer"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(c.totalAmount)}
                    </p>
                    <span className="text-[10px] font-bold text-spd-blue">
                      {c.shipmentStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Audit Activity */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Live System Activity Logs
            </h2>
            <Link href="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No recent logs"
              description="System activities will be automatically recorded here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {log.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {log.details || "Activity performed by system user"}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
