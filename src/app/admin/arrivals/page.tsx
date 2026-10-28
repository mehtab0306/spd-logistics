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
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintableChallan } from "@/components/challan/printable-challan";
import {
  getStoredChallans,
  saveStoredChallan,
  getDeletedChallanIds,
  mergeLocalWithApi,
  getStoredBilties,
  saveStoredBilty,
  saveStoredDelivery,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";
import { LogisticsTableSkeleton } from "@/components/shared/logistics-loader";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ArrivalsPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [printChallan, setPrintChallan] = useState<any>(null);

  useEffect(() => {
    fetchArrivedChallans();

    const handleFocus = () => {
      fetchArrivedChallans();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchArrivedChallans = async () => {
    try {
      setLoading(true);
      let apiChallans: any[] = [];

      // 1. Fetch directly from Supabase
      if (isSupabaseConfigured) {
        try {
          const { data: sbChallans } = await supabase
            .from("challans")
            .select("*")
            .order("created_at", { ascending: false });
          if (Array.isArray(sbChallans)) {
            for (const r of sbChallans) {
              apiChallans.push({
                id: r.id,
                challanNumber: r.challan_number || r.id,
                truckNumber: r.vehicle_number || "Pending",
                driverName: r.driver_name || "Pending",
                driverPhone: r.driver_phone || null,
                origin: r.origin,
                destination: r.destination,
                totalAmount: Number(r.total_truck_hire) || 0,
                truckFreight: Number(r.total_truck_hire) || 0,
                advancePaidToDriver: Number(r.advance_paid) || 0,
                status: r.status || "ARRIVED",
                createdAt: r.created_at,
              });
            }
          }
        } catch (sbErr) {
          console.warn("Supabase direct arrivals load warning:", sbErr);
        }
      }

      // 2. Fallback to API route
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("/api/admin/challan", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        const apiData = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.challans)
          ? data.challans
          : [];
        for (const item of apiData) {
          if (!apiChallans.some((c) => String(c.id) === String(item.id) || String(c.challanNumber) === String(item.challanNumber))) {
            apiChallans.push(item);
          }
        }
      } catch {}

      const merged = mergeLocalWithApi(
        getStoredChallans(),
        apiChallans,
        getDeletedChallanIds(),
        "challanNumber"
      );
      const arrived = merged.filter((c: any) => {
        const st = String(c.status || "").toUpperCase();
        return (
          st === "ARRIVED" ||
          st === "IN TRANSIT" ||
          st === "IN-TRANSIT" ||
          st === "DISPATCHED" ||
          st === "READY_FOR_DELIVERY" ||
          st === "OUT_FOR_DELIVERY" ||
          st === "COMPLETED"
        );
      });
      setChallans(arrived);
    } catch (err) {
      console.error("Error fetching arrivals:", err);
      const arrived = getStoredChallans().filter((c: any) => {
        const st = String(c.status || "").toUpperCase();
        return (
          st === "ARRIVED" ||
          st === "IN TRANSIT" ||
          st === "IN-TRANSIT" ||
          st === "DISPATCHED" ||
          st === "READY_FOR_DELIVERY" ||
          st === "OUT_FOR_DELIVERY" ||
          st === "COMPLETED"
        );
      });
      setChallans(arrived);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const [statusFilter, setStatusFilter] = useState<"ALL" | "ARRIVED" | "READY_FOR_DELIVERY">("ALL");

  const handleMarkReadyForDelivery = async (challan: any) => {
    setActionLoading(challan.id);
    try {
      const timestamp = new Date().toISOString();
      const updated = {
        ...challan,
        status: "READY_FOR_DELIVERY",
        shipmentStatus: "READY_FOR_DELIVERY",
        unloadedAt: timestamp,
        notes: `Inspected and un-loaded at ${challan.destination || "destination"} terminal. Consignments passed to delivery queue.`,
      };
      saveStoredChallan(updated);

      // Find all linked consignments in challan or local store
      const allBilties = getStoredBilties();
      const linkedBilties: any[] = [];
      if (Array.isArray(challan.consignments) && challan.consignments.length > 0) {
        linkedBilties.push(...challan.consignments);
      }
      for (const b of allBilties) {
        if (
          (b.challanId && String(b.challanId) === String(challan.id)) ||
          (b.challanNumber && String(b.challanNumber).toUpperCase() === String(challan.challanNumber).toUpperCase())
        ) {
          if (!linkedBilties.some((lb) => String(lb.id) === String(b.id) || String(lb.biltyNumber).toUpperCase() === String(b.biltyNumber).toUpperCase())) {
            linkedBilties.push(b);
          }
        }
      }

      // Update and push all linked bilties to delivery queue
      for (const b of linkedBilties) {
        const updatedBilty = {
          ...b,
          shipmentStatus: "READY_FOR_DELIVERY",
          deliveryStatus: "READY_FOR_DELIVERY",
          currentLocation: `${challan.destination || "Destination"} Terminal`,
          unloadedDate: timestamp,
          notes: (b.notes ? b.notes + " • " : "") + `Arrived on Challan #${challan.challanNumber}. Queued for local delivery.`,
        };
        saveStoredBilty(updatedBilty);
        saveStoredDelivery({
          ...updatedBilty,
          challanId: challan.id,
          challanNumber: challan.challanNumber,
          truckNumber: challan.truckNumber,
          driverName: challan.driverName,
          status: "READY_FOR_DELIVERY",
        });

        // Background API update
        fetch(`/api/admin/bilty/${encodeURIComponent(b.id || b.biltyNumber)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipmentStatus: "READY_FOR_DELIVERY",
            notes: updatedBilty.notes,
          }),
        }).catch(() => {});
      }

      // If no individual bilties, create a consolidated delivery queue manifest item
      if (linkedBilties.length === 0) {
        saveStoredDelivery({
          id: `del-${challan.id}`,
          challanId: challan.id,
          challanNumber: challan.challanNumber,
          biltyNumber: `MANIFEST-${challan.challanNumber}`,
          origin: challan.origin,
          destination: challan.destination,
          receiverName: challan.driverName ? `Assigned to ${challan.driverName}` : "Consignee Handover",
          receiverPhone: challan.driverPhone || "0300-0000000",
          packageDetails: `Consolidated cargo from Challan #${challan.challanNumber}`,
          quantity: challan.totalBilties || 1,
          weight: challan.totalWeight || 0,
          freight: challan.totalBiltyFreight || challan.totalFreight || 0,
          remainingBalance: 0,
          shipmentStatus: "READY_FOR_DELIVERY",
          status: "READY_FOR_DELIVERY",
          createdAt: timestamp,
        });
      }

      // Direct Supabase sync
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("challans")
            .update({ status: "READY_FOR_DELIVERY" })
            .or(`id.eq.${challan.id},challan_number.eq.${challan.challanNumber}`);

          for (const b of linkedBilties) {
            const bId = b.id;
            const bNo = b.biltyNumber;
            await supabase
              .from("bilties")
              .update({ status: "READY_FOR_DELIVERY" })
              .or(`id.eq.${bId},bilty_number.eq.${bNo},manual_bilty_number.eq.${bNo}`);
          }
        } catch (sbErr) {
          console.warn("Supabase mark ready sync notice:", sbErr);
        }
      }

      // Sync challan with API
      try {
        await fetch("/api/admin/challan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: challan.id,
            status: "READY_FOR_DELIVERY",
            notes: updated.notes,
          }),
        });
      } catch {}

      setChallans((prev) => prev.map((c) => (String(c.id) === String(challan.id) ? updated : c)));

      setFeedback({
        type: "success",
        text: `Challan ${challan.challanNumber} (${linkedBilties.length || 1} consignments) successfully passed to Delivery queue!`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = challans.filter((c) => {
    const st = String(c.status || "").toUpperCase();
    if (statusFilter === "ARRIVED" && st !== "ARRIVED") return false;
    if (statusFilter === "READY_FOR_DELIVERY" && st !== "READY_FOR_DELIVERY" && st !== "COMPLETED") return false;

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.challanNumber?.toLowerCase().includes(s) ||
      c.truckNumber?.toLowerCase().includes(s) ||
      c.destination?.toLowerCase().includes(s) ||
      c.driverName?.toLowerCase().includes(s)
    );
  });

  const handleExportExcel = () => {
    if (!filtered.length) return;
    const data = filtered.map((c) => ({
      "Challan #": c.challanNumber || "",
      "Arrival Date": c.arrivalDate ? new Date(c.arrivalDate).toLocaleDateString("en-GB") : "",
      "Origin": c.origin || "",
      "Destination Hub": c.destination || "",
      "Truck #": c.truckNumber || "",
      "Driver": c.driverName || "",
      "Driver Phone": c.driverPhone || "",
      "Status": c.status || "ARRIVED",
      "Consignments Count": Array.isArray(c.consignments) ? c.consignments.length : 0,
      "Total Freight (PKR)": c.totalAmount || 0,
      "Notes / Inspection": c.notes || "",
    }));
    exportToExcel(data, "Warehouse_Arrivals");
  };

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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl shadow-xs gap-2 h-10 px-4"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

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
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Arrivals ({challans.length})</option>
            <option value="ARRIVED">Awaiting Unload ({challans.filter((c) => String(c.status).toUpperCase() === "ARRIVED").length})</option>
            <option value="READY_FOR_DELIVERY">Sent to Delivery ({challans.filter((c) => String(c.status).toUpperCase() === "READY_FOR_DELIVERY" || String(c.status).toUpperCase() === "COMPLETED").length})</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchArrivedChallans}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} Trips
          </span>
        </div>
      </div>

      {/* Arrived Trips Table / Cards */}
      {loading && !isLoaded ? (
        <LogisticsTableSkeleton rows={5} subtitle="Tracking Destination Hub Arrivals..." />
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
