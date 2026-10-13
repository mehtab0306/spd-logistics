"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Truck,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  ArrowRight,
  Printer,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintableChallan } from "@/components/challan/printable-challan";
import {
  getStoredChallans,
  saveStoredChallan,
  getDeletedChallanIds,
  mergeLocalWithApi,
} from "@/lib/local-persistence";

export default function ArrivalsPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [printChallan, setPrintChallan] = useState<any>(null);

  useEffect(() => {
    fetchArrivedChallans();
  }, []);

  const fetchArrivedChallans = async () => {
    try {
      setLoading(true);
      let apiChallans: any[] = [];
      try {
        const res = await fetch("/api/admin/challan");
        const data = await res.json();
        apiChallans = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.challans)
          ? data.challans
          : [];
      } catch {}

      const merged = mergeLocalWithApi(
        getStoredChallans(),
        apiChallans,
        getDeletedChallanIds(),
        "challanNumber"
      );
      const arrived = merged.filter(
        (c: any) => c.status === "ARRIVED" || c.status === "COMPLETED"
      );
      setChallans(arrived);
    } catch (err) {
      console.error("Error fetching arrivals:", err);
      const arrived = getStoredChallans().filter(
        (c: any) => c.status === "ARRIVED" || c.status === "COMPLETED"
      );
      setChallans(arrived);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReadyForDelivery = async (challan: any) => {
    setActionLoading(challan.id);
    try {
      const updated = {
        ...challan,
        status: "COMPLETED",
        notes: `Inspected and un-loaded at ${challan.destination} warehouse. Consignments released for delivery.`,
      };
      saveStoredChallan(updated);
      setChallans((prev) => prev.map((c) => (String(c.id) === String(challan.id) ? updated : c)));

      try {
        await fetch("/api/admin/challan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: challan.id,
            status: "COMPLETED",
            notes: updated.notes,
          }),
        });
      } catch {}

      setFeedback({
        type: "success",
        text: `Challan ${challan.challanNumber} cargo un-loaded & moved to Delivery queue!`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = challans.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.challanNumber?.toLowerCase().includes(s) ||
      c.truckNumber?.toLowerCase().includes(s) ||
      c.destination?.toLowerCase().includes(s) ||
      c.driverName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {printChallan && (
        <PrintableChallan challan={printChallan} onClose={() => setPrintChallan(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trip Setup
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-spd-red">Destination Terminal Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-spd-red" />
            Warehouse Arrivals & Cargo Reception
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify arrived trucks, inspect manifests, unload commercial cargo packages, and pass to the last-mile delivery queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/delivery">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4">
              <Package className="w-4 h-4" />
              <span>Go to Delivery Queue</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Challan #, Truck #, Destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchArrivedChallans}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} Arrived Trips
          </span>
        </div>
      </div>

      {/* Arrived Trips Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs font-semibold text-slate-500">Loading arrivals...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Pending Hub Arrivals
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Dispatched trucks in transit will appear here once marked as arrived at their destination terminal.
          </p>
          <Link href="/admin/challan-in-transit">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold">
              View Challan in Transit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const bilties = c.consignments || [];
            const isCompleted = c.status === "COMPLETED";

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {c.challanNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCompleted
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>Arrived at <strong>{c.destination} Hub</strong></span>
                      <span>&bull;</span>
                      <span>Dispatched from {c.origin}</span>
                      <span>&bull;</span>
                      <span>{formatDate(c.arrivalDate || c.updatedAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrintChallan(c)}
                      className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Manifest</span>
                    </Button>
                    {!isCompleted && (
                      <Button
                        disabled={actionLoading === c.id}
                        onClick={() => handleMarkReadyForDelivery(challanData(c))}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                      >
                        {actionLoading === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Unload & Send to Delivery</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Vehicle Plate
                    </span>
                    <span className="font-black text-slate-800 dark:text-slate-100 font-mono">
                      {c.truckNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Driver
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {c.driverName || "Assigned Driver"} ({c.driverPhone || "N/A"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Manifest Cargo
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {bilties.length} Bilties &bull; {c.totalWeight || 0} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Freight
                    </span>
                    <span className="font-black text-emerald-600 font-mono">
                      {formatCurrency(c.totalBiltyFreight || 0)}
                    </span>
                  </div>
                </div>

                {/* Bilties inside this arrival */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Consignment Manifest Checklist ({bilties.length} Items)
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {bilties.map((b: any, idx: number) => (
                      <div
                        key={b.id || idx}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold font-mono text-red-600 block">
                              {b.biltyNumber}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {b.packageDetails || "Cargo"} &bull; {b.quantity || 1} Pkgs &bull;{" "}
                              {b.weight || 0} kg
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">
                            Receiver: {b.receiverName} ({b.receiverPhone})
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            {b.receiverAddress || "Local Terminal Delivery"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  function challanData(c: any) {
    return c;
  }
}
