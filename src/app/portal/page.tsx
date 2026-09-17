"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Package,
  Clock,
  Wallet,
  Search,
  CheckCircle2,
  Printer,
  Truck,
  Building2,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerPortalPage() {
  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bilties" | "tracking" | "ledger">("bilties");

  // Tracking tab input & selected consignment
  const [trackingSearch, setTrackingSearch] = useState("");
  const [selectedBilty, setSelectedBilty] = useState<any>(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal");
      const data = await res.json();
      if (data.success) {
        setPortalData(data.data);
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-spd-blue" />
        <p className="text-xs font-bold text-slate-400">Loading your customer dashboard...</p>
      </div>
    );
  }

  const { customer, consignments, stats, ledger } = portalData || {
    customer: {},
    consignments: [],
    stats: { totalShipments: 0, activeCount: 0, deliveredCount: 0, outstandingBalance: 0 },
    ledger: [],
  };

  return (
    <div className="space-y-6">
      {/* Customer Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-blue-500/40 bg-slate-800 flex items-center justify-center shadow-md">
            {customer?.photo || customer?.user?.avatar ? (
              <img
                src={customer.photo || customer.user?.avatar}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Verified Customer Account
              </span>
              <span className="text-xs text-slate-400">Hub: {customer.warehouse || "LAHORE"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {customer.companyName || customer.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>Account: <strong className="text-white font-mono">{customer.accountId}</strong></span>
              <span>&bull;</span>
              <span>Phone: <strong className="text-white">{customer.phone || "N/A"}</strong></span>
              {customer.creditLimit > 0 && (
                <>
                  <span>&bull;</span>
                  <span>Credit Limit: <strong className="text-emerald-400">{formatCurrency(customer.creditLimit)}</strong></span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTab("tracking")}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Consignment</span>
          </Button>
          <Button
            onClick={() => {
              setActiveTab("ledger");
              setTimeout(() => window.print(), 200);
            }}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-bold text-xs rounded-xl gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Consignments</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-spd-blue">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalShipments}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Lifetime booked bilties</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-spd-blue">Active In-Transit</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-spd-blue">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-spd-blue mt-2">
            {stats.activeCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched on highway</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-600">Delivered Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {stats.deliveredCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Confirmed received</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(stats.outstandingBalance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending freight settlement</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("bilties")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "bilties"
              ? "bg-spd-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          My Bilties ({consignments.length})
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "tracking"
              ? "bg-spd-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Track Shipment
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "ledger"
              ? "bg-spd-blue text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          My Ledger & Statements
        </button>
      </div>

      {/* TAB 1: MY BILTIES */}
      {activeTab === "bilties" && (
        <div className="space-y-4">
          {consignments.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No consignments booked yet</h3>
              <p className="text-xs text-slate-500">Contact SPD dispatch center to book your cargo shipment.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Bilty # & Date</TableHead>
                    <TableHead className="text-xs font-bold">Tracking ID</TableHead>
                    <TableHead className="text-xs font-bold">Consignee (Receiver)</TableHead>
                    <TableHead className="text-xs font-bold">Route</TableHead>
                    <TableHead className="text-xs font-bold">Freight</TableHead>
                    <TableHead className="text-xs font-bold">Balance</TableHead>
                    <TableHead className="text-xs font-bold">Shipment Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consignments.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell>
                        <p className="font-black text-xs text-slate-900 dark:text-white">{c.biltyNumber}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(c.date)}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-spd-blue">
                        {c.trackingId}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.receiverName}</p>
                        <p className="text-[10px] text-slate-400">{c.receiverPhone || "No phone"}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {c.origin} &rarr; {c.destination}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-bold ${
                            c.remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(c.remainingBalance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                            c.shipmentStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          }`}
                        >
                          {c.shipmentStatus.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBilty(c)}
                          className="text-xs font-bold text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl gap-1"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRACK SHIPMENT */}
      {activeTab === "tracking" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-spd-blue" />
              Live Shipment Status & Timeline
            </h2>
            <div className="flex gap-3 max-w-md">
              <Input
                placeholder="Enter Tracking ID or Bilty Number..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
              <Button
                onClick={() => {
                  const match = consignments.find(
                    (c: any) =>
                      c.trackingId.toLowerCase() === trackingSearch.trim().toLowerCase() ||
                      c.biltyNumber.toLowerCase() === trackingSearch.trim().toLowerCase()
                  );
                  if (match) setSelectedBilty(match);
                  else alert("No consignment found with this tracking ID in your account.");
                }}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md"
              >
                Track
              </Button>
            </div>
          </div>

          {selectedBilty && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Consignment</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedBilty.biltyNumber}</h3>
                  <p className="text-xs font-mono font-bold text-spd-blue">Tracking: {selectedBilty.trackingId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      selectedBilty.shipmentStatus === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : selectedBilty.shipmentStatus === "ON_HOLD"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                    }`}
                  >
                    {selectedBilty.shipmentStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* 6-Stage Visual Progress Timeline */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shipment Progress</h4>
                {(() => {
                  const stages = [
                    { key: "BOOKED", label: "Booked" },
                    { key: "PICKED_UP", label: "Picked Up" },
                    { key: "IN_TRANSIT", label: "In Transit" },
                    { key: "ARRIVED_AT_DESTINATION", label: "Arrived at Destination" },
                    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
                    { key: "DELIVERED", label: "Delivered" },
                  ];

                  const statusOrder: Record<string, number> = {
                    BOOKED: 0,
                    PICKED_UP: 1,
                    IN_TRANSIT: 2,
                    ARRIVED_AT_DESTINATION: 3,
                    OUT_FOR_DELIVERY: 4,
                    DELIVERED: 5,
                  };

                  const currentIndex = statusOrder[selectedBilty.shipmentStatus] !== undefined ? statusOrder[selectedBilty.shipmentStatus] : 1;
                  const isDelivered = selectedBilty.shipmentStatus === "DELIVERED";

                  return (
                    <div className="w-full">
                      <div className="hidden sm:grid grid-cols-6 gap-2 relative">
                        <div className="absolute top-3.5 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />
                        <div
                          className="absolute top-3.5 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                          style={{
                            width: `${Math.min(100, (currentIndex / (stages.length - 1)) * 100)}%`,
                          }}
                        />

                        {stages.map((stage, idx) => {
                          const isDone = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;

                          return (
                            <div key={stage.key} className="flex flex-col items-center text-center z-10 space-y-1">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2 ${
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"
                                } ${isCurrent && !isDelivered ? "ring-2 ring-emerald-500/30" : ""}`}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] font-bold ${
                                  isDone ? "text-slate-900 dark:text-white" : "text-slate-400"
                                }`}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="sm:hidden space-y-1.5">
                        {stages.map((stage, idx) => {
                          const isDone = idx <= currentIndex;
                          return (
                            <div key={stage.key} className="flex items-center gap-2 text-xs">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                              }`}>
                                {isDone ? "✓" : idx + 1}
                              </span>
                              <span className={isDone ? "font-bold text-slate-900 dark:text-white" : "text-slate-400"}>
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transit Checkpoints History</h4>
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {selectedBilty.trackingEvents?.map((event: any, idx: number) => (
                    <div key={event.id || idx} className="relative">
                      <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-spd-blue" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {event.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(event.timestamp || event.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{event.description}</p>
                        {event.location && (
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Account Ledger Statement
              </h2>
              <p className="text-xs text-slate-400">
                Opening Balance: {formatCurrency(customer.openingBalance || 0)} &bull; Current Balance: {formatCurrency(stats.outstandingBalance)}
              </p>
            </div>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="rounded-xl text-xs font-bold gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">Date & Voucher #</TableHead>
                  <TableHead className="text-xs font-bold">Description / Details</TableHead>
                  <TableHead className="text-xs font-bold text-red-600">Debit (Charges)</TableHead>
                  <TableHead className="text-xs font-bold text-emerald-600">Credit (Payments)</TableHead>
                  <TableHead className="text-xs font-bold text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">
                      No ledger transactions posted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((tx: any) => (
                    <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{formatDate(tx.date)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{tx.voucherNumber || "VCH"}</p>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-red-600">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-black text-slate-900 dark:text-white text-right">
                        {formatCurrency(tx.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* BILTY DETAILS MODAL */}
      <Dialog open={!!selectedBilty} onOpenChange={() => setSelectedBilty(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Bilty Details: {selectedBilty?.biltyNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tracking ID: {selectedBilty?.trackingId} &bull; Route: {selectedBilty?.origin} to {selectedBilty?.destination}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Receiver Name</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedBilty?.receiverName}</p>
                <p className="text-[10px] text-slate-500">{selectedBilty?.receiverPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Destination Hub</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedBilty?.destination}</p>
                <p className="text-[10px] text-slate-500">{selectedBilty?.warehouse} Hub</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Total Freight</p>
                <p className="font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(selectedBilty?.totalAmount || 0)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Paid</p>
                <p className="font-bold text-emerald-600 mt-0.5">{formatCurrency(selectedBilty?.paidAmount || 0)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Balance</p>
                <p className="font-bold text-amber-600 mt-0.5">{formatCurrency(selectedBilty?.remainingBalance || 0)}</p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Package Contents</p>
              <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold">
                {selectedBilty?.packageDetails} ({selectedBilty?.quantity} items &bull; {selectedBilty?.weight || "N/A"} KG)
              </p>
            </div>

            {selectedBilty?.driver && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between gap-2">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Assigned Transit Driver</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedBilty.driver.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedBilty.vehicle ? `Vehicle: ${selectedBilty.vehicle.vehicleNumber}` : "In Transit"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedBilty.driver.phone || selectedBilty.driver.contact) && (
                    <>
                      <a
                        href={`tel:${selectedBilty.driver.phone || selectedBilty.driver.contact}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
