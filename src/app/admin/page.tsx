import React from "react";
import prisma from "@/lib/prisma";
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
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    customers,
    consignments,
    vehicles,
    drivers,
    payments,
    cashBooks,
    pendingDeliveries,
    deliveredCount,
    lahoreBiltyCount,
    karachiBiltyCount,
    allConsignments,
    recentConsignments,
    recentActivity,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.consignment.count({ where: { shipmentStatus: { not: "DELETED" } } }),
    prisma.vehicle.count(),
    prisma.driver.count(),
    prisma.payment.count(),
    prisma.cashBook.count(),
    prisma.consignment.count({
      where: {
        NOT: [{ shipmentStatus: "DELIVERED" }, { shipmentStatus: "CANCELLED" }, { shipmentStatus: "DELETED" }],
      },
    }),
    prisma.consignment.count({
      where: { shipmentStatus: "DELIVERED" },
    }),
    prisma.consignment.count({
      where: { warehouse: { contains: "LAHORE" }, shipmentStatus: { not: "DELETED" } },
    }),
    prisma.consignment.count({
      where: { warehouse: { contains: "KARACHI" }, shipmentStatus: { not: "DELETED" } },
    }),
    prisma.consignment.findMany({
      where: { shipmentStatus: { not: "DELETED" } },
      select: {
        totalAmount: true,
        paidAmount: true,
        remainingBalance: true,
      },
    }),
    prisma.consignment.findMany({
      where: { shipmentStatus: { not: "DELETED" } },
      take: 6,
      orderBy: { date: "desc" },
      include: {
        customer: { select: { name: true, companyName: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  const totalRevenue = allConsignments.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalCollected = allConsignments.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalReceivable = allConsignments.reduce((sum, c) => sum + c.remainingBalance, 0);

  const lahorePct = consignments > 0 ? Math.round((lahoreBiltyCount / consignments) * 100) : 50;
  const karachiPct = consignments > 0 ? Math.round((karachiBiltyCount / consignments) * 100) : 50;

  return (
    <div className="space-y-8">
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
        <div className="flex items-center gap-3">
          <Link href="/admin/bilty">
            <Button className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2">
              <Package className="w-4 h-4" />
              <span>Create New Bilty</span>
            </Button>
          </Link>
          <Link href="/admin/customers">
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-bold text-xs rounded-xl gap-2">
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
          value={customers.toString()}
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
            {formatCurrency(totalRevenue)}
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
            {formatCurrency(totalCollected)}
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
            {formatCurrency(totalReceivable)}
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
            {vehicles} Trucks / {drivers} Drivers
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{cashBooks} Separate Cash Books</p>
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
                <span className="text-slate-900 dark:text-white">{lahoreBiltyCount} ({lahorePct}%)</span>
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
                <span className="text-slate-900 dark:text-white">{karachiBiltyCount} ({karachiPct}%)</span>
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
            <Link href="/admin/bilty">
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

          {recentConsignments.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No bilties created yet"
              description="Create your first bilty voucher to populate active consignments."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentConsignments.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-3">
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
                      {c.customer?.companyName || c.senderName || "Walk-in Customer"}
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
                </div>
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

          {recentActivity.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No recent logs"
              description="System activities will be automatically recorded here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentActivity.map((log) => (
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
