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
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PrintableChallan } from "@/components/challan/printable-challan";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import {
  getStoredChallans,
  saveStoredChallan,
  removeStoredChallan,
  getDeletedChallanIds,
  saveStoredBilty,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";
import { Trash2 } from "lucide-react";

export default function ChallanInTransitPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(challans);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Print modal
  const [printChallan, setPrintChallan] = useState<any>(null);

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
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
      const active = merged.filter(
        (c: any) => c.status === "IN_TRANSIT" || c.status === "DISPATCHED"
      );
      setChallans(active);
    } catch (err) {
      console.error("Error fetching challans in transit:", err);
      const active = getStoredChallans().filter(
        (c: any) => c.status === "IN_TRANSIT" || c.status === "DISPATCHED"
      );
      setChallans(active);
    } finally {
      setLoading(false);
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

  const handleDeleteTrip = (c: any) => {
    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to move Challan #${c.challanNumber || c.id} to Recycle Bin?`)) {
      return;
    }
    removeStoredChallan(c.id, c);
    setChallans((prev) => prev.filter((item) => item.id !== c.id));
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
      {/* Printable Challan Modal */}
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
            disabled={!filteredChallans.length}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl shadow-xs gap-2 h-10 px-4"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
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

      {/* Trips Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading trips in transit...</p>
        </div>
      ) : filteredChallans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredChallans.map((c) => {
            const bilties = c.consignments || [];
            const waMsg = `Assalam-o-Alaikum ${c.driverName || "Driver"}, regarding Challan ${c.challanNumber} (${c.truckNumber}) on route ${c.origin} to ${c.destination}. Please provide current checkpoint update.`;
            const waUrl = c.driverPhone ? buildWhatsAppUrl(c.driverPhone, waMsg) : "";

            return (
              <div
                key={c.id}
                id={`record-${c.id}`}
                data-record-id={c.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4 hover:shadow-md transition-all",
                  highlightClass(c.id) || highlightClass(c.challanNumber)
                )}
              >
                {/* Trip Card Top Bar */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {c.challanNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dispatched {formatDate(c.dispatchDate || c.createdAt)}</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintChallan(c)}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Manifest</span>
                  </Button>
                </div>

                {/* Route & Truck Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Corridor Route
                    </span>
                    <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      {c.origin} <ArrowRight className="w-3 h-3 text-emerald-600" /> {c.destination}
                    </span>
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
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {c.driverPhone || "No phone"}
                    </span>
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
                <div className="flex items-center justify-between text-xs px-1">
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

                {/* Action Buttons: WhatsApp / Call Driver + Mark Arrived */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {c.driverPhone && (
                    <>
                      <a
                        href={`tel:${c.driverPhone}`}
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Call Driver</span>
                        </Button>
                      </a>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
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
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
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
    </div>
  );
}
