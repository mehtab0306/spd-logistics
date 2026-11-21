"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Navigation,
  Truck,
  Phone,
  MessageSquare,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  ArrowRight,
  Package,
  FileSpreadsheet,
  Activity,
  History,
  Send,
  Building,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PrintableChallan } from "@/components/challan/printable-challan";
import { BatchChallanPrint } from "@/components/challan/batch-challan-print";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import {
  getStoredChallans,
  saveStoredChallan,
  removeStoredChallan,
  getDeletedChallanIds,
  saveStoredBilty,
  mergeLocalWithApi,
  setCookieCache,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";
import { Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { LogisticsTableSkeleton } from "@/components/shared/logistics-loader";

export default function ChallanInTransitPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { highlightClass } = useSmartHighlight(challans);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Single Challan Print modal
  const [printChallan, setPrintChallan] = useState<any>(null);
  // Batch Challan Print modal
  const [printBatchManifests, setPrintBatchManifests] = useState(false);

  // Location Tracking & Checkpoint Modal state
  const [trackingModalChallan, setTrackingModalChallan] = useState<any>(null);
  const [checkpointForm, setCheckpointForm] = useState({
    location: "",
    status: "Moving",
    notes: "",
  });
  const [loggingCheckpoint, setLoggingCheckpoint] = useState(false);

  // Helper to calculate Arrival Status and Late Alerts
  const getArrivalStatus = (c: any) => {
    if (!c.expectedArrivalDate) return null;
    try {
      const timeStr = c.expectedArrivalTime || "23:59";
      const targetDate = new Date(`${c.expectedArrivalDate}T${timeStr}:00`);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) {
        const lateHours = Math.abs(diffHours);
        return {
          isLate: true,
          label: lateHours > 24 ? `⚠️ LATE: ${Math.floor(lateHours / 24)}d behind schedule` : `⚠️ LATE: ${lateHours}h behind schedule`,
        };
      } else if (diffDays <= 0 || diffHours <= 12) {
        return {
          isLate: false,
          label: `Arriving Today (${c.expectedArrivalTime || "evening"})`,
        };
      } else if (diffDays === 1) {
        return {
          isLate: false,
          label: `Arriving Tomorrow`,
        };
      } else {
        return {
          isLate: false,
          label: `Arrives in ${diffDays} days`,
        };
      }
    } catch {
      return null;
    }
  };

  // Log new location checkpoint
  const handleLogCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalChallan || !checkpointForm.location.trim()) {
      toast.error("Please enter a checkpoint location");
      return;
    }

    try {
      setLoggingCheckpoint(true);
      const newCheckpoint = {
        id: `cp-${Date.now()}`,
        location: checkpointForm.location.trim(),
        status: checkpointForm.status,
        notes: checkpointForm.notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      const existingEvents = Array.isArray(trackingModalChallan.trackingEvents)
        ? trackingModalChallan.trackingEvents
        : [];
      const updatedEvents = [newCheckpoint, ...existingEvents];

      const updatedChallan = {
        ...trackingModalChallan,
        currentLocation: newCheckpoint.location,
        trackingEvents: updatedEvents,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update in local state & localStorage
      setChallans((prev) =>
        prev.map((c) => (c.id === trackingModalChallan.id ? updatedChallan : c))
      );
      setTrackingModalChallan(updatedChallan);
      saveStoredChallan(updatedChallan);

      // 2. Sync to Supabase
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("challans")
            .update({
              tracking_events: updatedEvents,
              current_location: newCheckpoint.location,
            })
            .eq("id", trackingModalChallan.id);
        } catch (sbErr) {
          console.warn("Supabase checkpoint sync notice:", sbErr);
        }
      }

      // 3. Reset form
      setCheckpointForm({ location: "", status: "Moving", notes: "" });
      toast.success(`Checkpoint logged: ${newCheckpoint.location} (${newCheckpoint.status})`);
    } catch (err: any) {
      toast.error(err.message || "Failed to log checkpoint");
    } finally {
      setLoggingCheckpoint(false);
    }
  };

  // Helper to normalize transit status
  const isChallanInTransit = (c: any) => {
    if (!c) return false;
    const norm = String(c.status || "").toUpperCase().replace(/[\s-]+/g, "_");
    return norm === "IN_TRANSIT" || norm === "DISPATCHED" || norm === "ON_TRIP" || norm === "PENDING_ARRIVAL";
  };

  // 1. Load data strictly once when client mounts
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("spd_challans") ||
        localStorage.getItem("spd_local_challans") ||
        sessionStorage.getItem("spd_challans");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter(isChallanInTransit);
          if (active.length > 0) {
            setChallans(active);
          }
        }
      }
    } catch (err) {
      console.error("Error loading challans on mount:", err);
    } finally {
      setIsLoaded(true); // Mark client ready
    }
  }, []);

  // 2. Only write back to localStorage AFTER initial load has completed
  useEffect(() => {
    if (!isLoaded) return; // CRITICAL: NEVER overwrite storage before initial load completes!
    if (challans.length > 0) {
      try {
        const serialized = JSON.stringify(challans);
        localStorage.setItem("spd_challans", serialized);
        localStorage.setItem("spd_local_challans", serialized);
        sessionStorage.setItem("spd_challans", serialized);
        setCookieCache("spd_challans_cache", serialized);
      } catch (err) {
        console.warn("Sync challans to storage error:", err);
      }
    }
  }, [challans, isLoaded]);

  useEffect(() => {
    fetchChallans();
    const handleFocus = () => {
      fetchChallans();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchChallans = async () => {
    try {
      setLoading(true);

      let supabaseChallans: any[] = [];
      let supabaseFetchedSuccessfully = false;
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from("challans")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data)) {
            supabaseFetchedSuccessfully = true;
            supabaseChallans = data.map((r: any) => ({
              id: r.id || r.challan_number,
              challanNumber: r.challan_number || r.id,
              truckNumber: r.vehicle_number || r.truck_number,
              driverName: r.driver_name,
              driverPhone: r.driver_phone,
              origin: r.origin_station || r.origin || "Karachi",
              destination: r.destination_station || r.destination || "Lahore",
              status: r.status || "IN_TRANSIT",
              dispatchDate: r.created_at,
              createdAt: r.created_at,
              ...r,
            }));
          }
        } catch (sbErr) {
          console.warn("Supabase fetch challans warning:", sbErr);
        }
      }

      let apiChallans: any[] = [];
      if (!supabaseFetchedSuccessfully) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const res = await fetch("/api/admin/challan", { signal: controller.signal });
          clearTimeout(timeoutId);
          const data = await res.json();
          apiChallans = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.challans)
            ? data.challans
            : [];
        } catch {}
      }

      const localChallans = getStoredChallans();
      const combinedActive = mergeLocalWithApi(
        supabaseChallans,
        localChallans,
        getDeletedChallanIds(),
        "challanNumber"
      );

      const merged = mergeLocalWithApi(
        combinedActive,
        apiChallans,
        getDeletedChallanIds(),
        "challanNumber"
      );
      const active = merged.filter(isChallanInTransit);

      const dedupedActive: any[] = [];
      const seenChallanIds = new Set<string>();
      const seenChallanNumbers = new Set<string>();
      for (const item of active) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        const cNum = String(item.challanNumber || "").trim().toUpperCase();
        if (seenChallanIds.has(id)) continue;
        if (cNum && seenChallanNumbers.has(cNum)) continue;
        seenChallanIds.add(id);
        if (cNum) seenChallanNumbers.add(cNum);
        dedupedActive.push(item);
      }

      setChallans(dedupedActive);
    } catch (err) {
      console.error("Error fetching challans in transit:", err);
      const active = getStoredChallans().filter(isChallanInTransit);
      setChallans(active);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const handleMarkArrived = async (challan: any) => {
    setActionLoading(challan.id);
    try {
      const arrivalDate = new Date().toISOString();
      const updatedChallan = {
        ...challan,
        status: "ARRIVED",
        arrivalDate,
      };

      // Immediately update in localStorage
      saveStoredChallan(updatedChallan);
      if (Array.isArray(challan.consignments)) {
        for (const b of challan.consignments) {
          saveStoredBilty({
            ...b,
            shipmentStatus: "ARRIVED_AT_DESTINATION",
          });
        }
      }

      setChallans((prev) => prev.filter((c) => String(c.id) !== String(challan.id)));

      // Cloud Supabase sync
      if (isSupabaseConfigured) {
        try {
          await supabase.from("challans").update({ status: "ARRIVED", arrival_date: arrivalDate }).eq("id", challan.id);
          if (Array.isArray(challan.consignments)) {
            for (const b of challan.consignments) {
              await supabase.from("bilties").update({ status: "ARRIVED_AT_DESTINATION" }).eq("id", b.id);
            }
          }
        } catch (sbErr) {
          console.warn("Supabase arrival update error:", sbErr);
        }
      }

      try {
        await fetch("/api/admin/challan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: challan.id,
            status: "ARRIVED",
            arrivalDate,
          }),
        });
      } catch {}

      setFeedback({
        type: "success",
        text: `Challan ${challan.challanNumber} marked as Arrived at ${challan.destination}!`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update arrival status" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTrip = async (c: any) => {
    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to move Challan #${c.challanNumber || c.id} to Recycle Bin?`)) {
      return;
    }
    removeStoredChallan(c.id, c);
    setChallans((prev) => prev.filter((item) => item.id !== c.id));

    // Supabase cloud deletion
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("challans")
          .delete()
          .or(`id.eq.${c.id},challan_number.eq.${c.challanNumber || c.id}`);
      } catch (sbErr) {
        console.warn("Supabase challan delete warning:", sbErr);
      }
    }

    setFeedback({
      type: "success",
      text: `Challan #${c.challanNumber || c.id} was moved to Recycle Bin (/admin/trash).`,
    });
  };

  const filteredChallans = challans.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.challanNumber?.toLowerCase().includes(s) ||
      c.truckNumber?.toLowerCase().includes(s) ||
      c.driverName?.toLowerCase().includes(s) ||
      c.origin?.toLowerCase().includes(s) ||
      c.destination?.toLowerCase().includes(s)
    );
  });

  const handleExportExcel = () => {
    if (!filteredChallans.length) return;
    const data = filteredChallans.map((c) => ({
      "Challan #": c.challanNumber || "",
      "Date": c.date ? new Date(c.date).toLocaleDateString("en-GB") : "",
      "Status": c.status || "IN_TRANSIT",
      "Origin": c.origin || "",
      "Destination": c.destination || "",
      "Warehouse": c.warehouse || "",
      "Truck #": c.truckNumber || "",
      "Hiring Mode": c.hiringMode === "MARKET_BROKER" ? "Market Broker" : "Company Fleet",
      "Broker": c.brokerName || "-",
      "Driver Name": c.driverName || "",
      "Driver Phone": c.driverPhone || "",
      "Bilties Count": Array.isArray(c.consignments) ? c.consignments.length : 0,
      "Total Freight (PKR)": c.totalAmount || 0,
      "Truck Freight (PKR)": c.truckFreight || c.brokerFreight || 0,
      "Advance Paid (PKR)": c.advancePaidToDriver || c.brokerAdvance || 0,
      "Estimated Profit (PKR)": c.estimatedProfit || 0,
      "Notes": c.notes || "",
    }));
    exportToExcel(data, "Challan_In_Transit");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Isolated Single Challan Print Modal */}
      {printChallan && (
        <PrintableChallan challan={printChallan} onClose={() => setPrintChallan(null)} />
      )}

      {/* Batch All Manifests Print Modal */}
      {printBatchManifests && (
        <BatchChallanPrint
          challans={filteredChallans}
          onClose={() => setPrintBatchManifests(false)}
        />
      )}

      {/* Header - Hidden in Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trip Setup
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-600">Active Highway Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Navigation className="w-7 h-7 text-emerald-600" />
            Challan in Transit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time highway fleet monitor. Track dispatched trucks, contact drivers via call/WhatsApp, and record hub arrivals.
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

          <Button
            variant="outline"
            onClick={() => setPrintBatchManifests(true)}
            className="bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 font-bold text-xs rounded-xl shadow-xs gap-2 h-10 px-4"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print All Manifests (PDF)</span>
          </Button>

          <Link href="/admin/challan">
            <Button className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Create New Challan</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border print:hidden ${
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

      {/* Filter / Search Bar - Hidden in Print */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Challan #, Truck #, Driver, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchChallans}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-500">
            {filteredChallans.length} Active Trips in Transit
          </span>
        </div>
      </div>

      {/* Trips Grid - Hidden in Print when Printing Single or Batch Manifest */}
      {loading ? (
        <div className="print:hidden">
          <LogisticsTableSkeleton rows={5} subtitle="Tracking Active Fleet in Transit..." />
        </div>
      ) : filteredChallans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Active Challans in Transit
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All dispatched trucks have arrived at destination terminals or no trips are currently on route.
          </p>
          <Link href="/admin/challan">
            <Button size="sm" className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold">
              Dispatch New Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
          {filteredChallans.map((c) => {
            const bilties = c.consignments || [];
            const activePhone = (c.activeDriverPhone === "secondary" && c.driverSecondaryPhone) ? c.driverSecondaryPhone : (c.driverPhone || c.driverSecondaryPhone);
            const waMsg = `Assalam-o-Alaikum ${c.driverName || "Driver"}, regarding Challan ${c.challanNumber} (${c.truckNumber}) on route ${c.origin} to ${c.destination}. Please provide current checkpoint update.`;
            const waUrl = activePhone ? buildWhatsAppUrl(activePhone, waMsg) : "";
            const arrivalStatus = getArrivalStatus(c);
            const isUrgent = c.priority === "Urgent" || c.dispatchMode === "Urgent";
            const isMarket = Boolean(c.isMarketVehicle || c.vehicleSource === "market");

            return (
                  <div
                    key={c.id}
                    id={`record-${c.id}`}
                    data-record-id={c.id}
                    className={cn(
                      "trip-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4 hover:shadow-md transition-all print:hidden",
                      highlightClass(c.id) || highlightClass(c.challanNumber)
                    )}
                  >
                    {/* Trip Card Top Bar with Priority, Vehicle Type & Late Alert */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                            {c.challanNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {c.status}
                          </span>
                          {isUrgent ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400">
                              ⚡ Urgent
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
                              🚚 Normal
                            </span>
                          )}
                          {isMarket ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Market Truck
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Company Fleet
                            </span>
                          )}
                          {arrivalStatus && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black",
                                arrivalStatus.isLate
                                  ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400 animate-pulse"
                                  : "bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-300"
                              )}
                            >
                              {arrivalStatus.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dispatched {formatDate(c.dispatchDate || c.createdAt)}</span>
                          {c.currentLocation && (
                            <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 pl-1">
                              &bull; <MapPin className="w-3 h-3 text-red-600 inline" /> Last at {c.currentLocation}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintChallan(c)}
                        className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Manifest</span>
                      </Button>
                    </div>

                    {/* Route & Truck Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Corridor Route
                        </span>
                        <div className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 flex-wrap">
                          <span>{c.origin}</span>
                          {Array.isArray(c.deliveryStops) && c.deliveryStops.filter(Boolean).length > 0 ? (
                            c.deliveryStops.filter(Boolean).map((stop: string, sIdx: number) => (
                              <React.Fragment key={sIdx}>
                                <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="text-amber-800 dark:text-amber-300 font-bold">{stop}</span>
                              </React.Fragment>
                            ))
                          ) : null}
                          <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-spd-blue">{c.destination}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Assigned Truck #
                        </span>
                        <span className="font-black text-slate-800 dark:text-slate-100 font-mono">
                          {c.truckNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Driver Personnel
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {c.driverName || "Assigned Driver"}
                        </span>
                        {activePhone && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Phone: {activePhone}
                          </span>
                        )}
                        {c.driverCnic && (
                          <span className="text-[9.5px] text-slate-400 font-mono block">
                            CNIC: {c.driverCnic}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Payload Manifest
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {bilties.length} Bilties &bull; {c.totalWeight || 0} kg
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Customer Freight
                        </span>
                        <span className="font-black text-emerald-600 font-mono">
                          {formatCurrency(c.totalBiltyFreight || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Truck Cost
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {formatCurrency(c.truckFreight || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Advance Paid
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {formatCurrency(c.advancePaidToDriver || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Net Profit
                        </span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrency(c.netProfit || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Checkpoint / WhatsApp / Call Driver + Mark Arrived */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTrackingModalChallan(c)}
                        className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-slate-300 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>Tracking History</span>
                      </Button>

                      {activePhone && (
                        <>
                          <a
                            href={`tel:${activePhone}`}
                            className="flex-1 min-w-[100px]"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>Call</span>
                            </Button>
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[100px]"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </Button>
                          </a>
                        </>
                      )}

                      <Button
                        type="button"
                        disabled={actionLoading === c.id}
                        onClick={() => handleMarkArrived(c)}
                        className="flex-1 min-w-[120px] h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                      >
                        {actionLoading === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Record Arrival</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteTrip(c)}
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-700 shrink-0"
                        title="Move Trip to Recycle Bin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* Location Tracking & Checkpoint History Modal */}
      <Dialog
        open={Boolean(trackingModalChallan)}
        onOpenChange={(open) => {
          if (!open) setTrackingModalChallan(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>Location Tracking &amp; Journey History</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Challan #{trackingModalChallan?.challanNumber} &bull; Truck {trackingModalChallan?.truckNumber} &bull; {trackingModalChallan?.origin} to {trackingModalChallan?.destination}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Log New Checkpoint Form */}
            <form onSubmit={handleLogCheckpoint} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Log Current Highway Checkpoint (Twice Daily)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                    Location Name *
                  </Label>
                  <Input
                    required
                    value={checkpointForm.location}
                    placeholder="e.g. Hyderabad Bypass, Rahim Yar Khan"
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, location: e.target.value })}
                    className="h-9 text-xs font-medium rounded-xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                    Vehicle Movement Status *
                  </Label>
                  <select
                    value={checkpointForm.status}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, status: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="Moving">Moving on Highway</option>
                    <option value="Stopped / Rest Break">Stopped / Rest Break</option>
                    <option value="Intermediate Stop">Intermediate Delivery Stop</option>
                    <option value="Traffic Jam">Traffic Jam / Highway Delay</option>
                    <option value="Maintenance / Breakdown">Maintenance / Mechanical Breakdown</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                    Delay Reason / Driver Notes (Optional)
                  </Label>
                  <Input
                    value={checkpointForm.notes}
                    placeholder="e.g. Heavy fog near Sukkur, tyre puncture delayed 45 mins"
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, notes: e.target.value })}
                    className="h-9 text-xs font-medium rounded-xl bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={loggingCheckpoint}
                  className="h-8 px-4 rounded-xl text-xs font-bold bg-spd-blue hover:bg-spd-blueHover text-white gap-1.5 shadow-xs"
                >
                  {loggingCheckpoint ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Save Checkpoint</span>
                </Button>
              </div>
            </form>

            {/* Checkpoint Chronological History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Recorded Journey History</span>
              </h4>

              {Array.isArray(trackingModalChallan?.trackingEvents) && trackingModalChallan.trackingEvents.length > 0 ? (
                <div className="space-y-2">
                  {trackingModalChallan.trackingEvents.map((event: any, idx: number) => (
                    <div
                      key={event.id || idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-600 inline" />
                            {event.location}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.2 rounded-full text-[9.5px] font-bold",
                              event.status === "Moving"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : event.status?.includes("Maintenance") || event.status?.includes("Jam")
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700 border border-slate-300"
                            )}
                          >
                            {event.status}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                            {event.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono whitespace-nowrap">
                        {event.timestamp ? formatDate(event.timestamp) : "Recent"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No checkpoints recorded yet. Use the form above to log location checkpoints.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
