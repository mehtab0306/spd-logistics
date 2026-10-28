"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Package,
  Calendar,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  Printer,
  FileText,
  MapPin,
  FileSpreadsheet,
  FileCheck,
  ShieldCheck,
  Truck,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LogisticsTableSkeleton } from "@/components/shared/logistics-loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getStoredBilties,
  saveStoredBilty,
  getStoredDeliveries,
  saveStoredDelivery,
  getStoredChallans,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";
import { PrintableGatePass } from "@/components/delivery/printable-gate-pass";
import { PodModal } from "@/components/delivery/pod-modal";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"READY" | "DELIVERED" | "ALL">("READY");

  // Confirm Handover Modal State
  const [deliveryModalBilty, setDeliveryModalBilty] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState({
    receivedBy: "",
    receiverCnic: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
    collectRemainingAmount: true,
    deliveryNotes: "",
  });

  // POD Modal State
  const [podModalItem, setPodModalItem] = useState<any>(null);

  // Gate Pass Modal State
  const [gatePassItem, setGatePassItem] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDeliveryQueue();

    const handleFocus = () => {
      fetchDeliveryQueue();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchDeliveryQueue = async () => {
    try {
      setLoading(true);
      const apiBilties: any[] = [];

      // 1. Fetch directly from Supabase
      if (isSupabaseConfigured) {
        try {
          const { data: sbBilties } = await supabase
            .from("bilties")
            .select("*")
            .order("created_at", { ascending: false });
          if (Array.isArray(sbBilties)) {
            for (const b of sbBilties) {
              const bNum = b.manual_bilty_number || b.bilty_number || b.id;
              apiBilties.push({
                id: b.id,
                biltyNumber: bNum,
                senderName: b.sender_name,
                receiverName: b.receiver_name,
                receiverPhone: b.receiver_phone,
                receiverCnic: b.receiver_cnic,
                origin: b.origin_station,
                destination: b.destination_station,
                totalFreight: Number(b.freight_amount) || 0,
                paidAmount: Number(b.advance_paid) || 0,
                remainingBalance: Number(b.remaining_balance) || 0,
                status: b.status || "In-Transit",
                shipmentStatus: b.status || "In-Transit",
                paymentStatus: (Number(b.remaining_balance) || 0) <= 0 ? "PAID" : "PARTIAL",
                packageDetails: b.cargo_details || "Commercial Cargo",
                createdAt: b.created_at,
              });
            }
          }
        } catch (sbErr) {
          console.warn("Supabase direct bilties delivery queue warning:", sbErr);
        }
      }

      // 2. Fetch from Bilties API & Challans API
      try {
        const [bRes, cRes] = await Promise.all([
          fetch("/api/admin/bilty").catch(() => null),
          fetch("/api/admin/challan").catch(() => null),
        ]);

        if (bRes && bRes.ok) {
          const bData = await bRes.json().catch(() => ({}));
          const bDataArr = Array.isArray(bData.data)
            ? bData.data
            : Array.isArray(bData.consignments)
            ? bData.consignments
            : [];
          for (const b of bDataArr) {
            const bKey = String(b.biltyNumber || b.id || "").toUpperCase().trim();
            if (!apiBilties.some((existing: any) => String(existing.biltyNumber || existing.id || "").toUpperCase().trim() === bKey)) {
              apiBilties.push(b);
            }
          }
        }

        if (cRes && cRes.ok) {
          const cData = await cRes.json().catch(() => ({}));
          const cArr = Array.isArray(cData.data)
            ? cData.data
            : Array.isArray(cData.challans)
            ? cData.challans
            : [];

          // Extract consignments inside challans that are arrived or in delivery
          for (const ch of cArr) {
            const chStatus = String(ch.status || "").toUpperCase();
            if (chStatus === "ARRIVED" || chStatus === "READY_FOR_DELIVERY" || chStatus === "COMPLETED") {
              if (Array.isArray(ch.consignments) && ch.consignments.length > 0) {
                for (const cb of ch.consignments) {
                  apiBilties.push({
                    ...cb,
                    challanId: ch.id,
                    challanNumber: ch.challanNumber,
                    truckNumber: ch.truckNumber,
                    driverName: ch.driverName,
                    shipmentStatus: cb.shipmentStatus || "READY_FOR_DELIVERY",
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("API delivery queue load warning:", e);
      }

      // 2. Fetch local storage records
      const localDeliveries = getStoredDeliveries();
      const localBilties = getStoredBilties();
      const localChallans = getStoredChallans();

      // Extract from local arrived challans
      const challanExtracted: any[] = [];
      for (const ch of localChallans) {
        const chStatus = String(ch.status || "").toUpperCase();
        if (chStatus === "ARRIVED" || chStatus === "READY_FOR_DELIVERY" || chStatus === "COMPLETED") {
          if (Array.isArray(ch.consignments) && ch.consignments.length > 0) {
            for (const cb of ch.consignments) {
              challanExtracted.push({
                ...cb,
                challanId: ch.id,
                challanNumber: ch.challanNumber,
                truckNumber: ch.truckNumber,
                driverName: ch.driverName,
                shipmentStatus: cb.shipmentStatus || "READY_FOR_DELIVERY",
              });
            }
          }
        }
      }

      // Merge and deduplicate by clean ID or biltyNumber
      const combined = [
        ...localDeliveries,
        ...challanExtracted,
        ...localBilties,
        ...apiBilties,
      ];

      const seen = new Map<string, any>();
      for (const item of combined) {
        if (!item) continue;
        const key = String(item.biltyNumber || item.id || "").toUpperCase().trim();
        if (!key) continue;

        if (!seen.has(key)) {
          seen.set(key, item);
        } else {
          // Merge preserving status
          seen.set(key, { ...seen.get(key), ...item });
        }
      }

      const unifiedQueue = Array.from(seen.values());
      setDeliveries(unifiedQueue);
    } catch (err) {
      console.error("Error loading delivery queue:", err);
      setDeliveries([...getStoredDeliveries(), ...getStoredBilties()]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelivery = (bilty: any) => {
    setDeliveryModalBilty(bilty);
    setDeliveryData({
      receivedBy: bilty.receiverName || bilty.customer?.name || "",
      receiverCnic: bilty.receiverCnic || "",
      deliveryDate: new Date().toISOString().slice(0, 10),
      collectRemainingAmount: (bilty.remainingBalance || 0) > 0,
      deliveryNotes: "",
    });
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalBilty) return;

    setSubmitting(true);
    try {
      const remaining = deliveryModalBilty.remainingBalance || 0;
      const willCollect = deliveryData.collectRemainingAmount && remaining > 0;
      const newPaid = willCollect
        ? (deliveryModalBilty.paidAmount || 0) + remaining
        : deliveryModalBilty.paidAmount || 0;
      const newRemaining = willCollect ? 0 : remaining;

      const timestamp = new Date().toISOString();
      const updatedItem = {
        ...deliveryModalBilty,
        shipmentStatus: "DELIVERED",
        deliveryStatus: "DELIVERED",
        deliveredDate: deliveryData.deliveryDate || timestamp,
        receivedBy: deliveryData.receivedBy,
        receiverCnic: deliveryData.receiverCnic,
        deliveryNotes: deliveryData.deliveryNotes,
        paidAmount: newPaid,
        remainingBalance: newRemaining,
        paymentStatus: newRemaining <= 0 ? "PAID" : deliveryModalBilty.paymentStatus,
        trackingEvents: [
          ...(Array.isArray(deliveryModalBilty.trackingEvents) ? deliveryModalBilty.trackingEvents : []),
          {
            id: `evt-${Date.now()}`,
            status: "DELIVERED",
            location: deliveryModalBilty.destination || "Destination Terminal",
            notes: `Consignment delivered to ${deliveryData.receivedBy} on ${deliveryData.deliveryDate}. ${deliveryData.deliveryNotes}`,
            timestamp,
          },
        ],
      };

      // 1. Update local storage
      saveStoredDelivery(updatedItem);
      saveStoredBilty(updatedItem);

      // 2. Update server API
      try {
        await fetch(`/api/admin/bilty/${encodeURIComponent(deliveryModalBilty.id || deliveryModalBilty.biltyNumber)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipmentStatus: "DELIVERED",
            paidAmount: newPaid,
            remainingBalance: newRemaining,
            notes: updatedItem.deliveryNotes,
          }),
        });
      } catch (err) {
        console.warn("API update fallback active:", err);
      }

      // 3. Direct Supabase update
      if (isSupabaseConfigured) {
        try {
          const bId = deliveryModalBilty.id;
          const bNum = deliveryModalBilty.biltyNumber;
          await supabase
            .from("bilties")
            .update({
              status: "Delivered",
              remaining_balance: newRemaining,
              advance_paid: newPaid,
            })
            .or(`id.eq.${bId},bilty_number.eq.${bNum},manual_bilty_number.eq.${bNum}`);
        } catch (sbErr) {
          console.warn("Supabase confirm delivery update warning:", sbErr);
        }
      }

      setDeliveries((prev) =>
        prev.map((d) =>
          String(d.biltyNumber || d.id).toUpperCase() ===
          String(deliveryModalBilty.biltyNumber || deliveryModalBilty.id).toUpperCase()
            ? updatedItem
            : d
        )
      );

      setFeedback({
        type: "success",
        text: `Consignment #${deliveryModalBilty.biltyNumber} successfully marked as DELIVERED to ${deliveryData.receivedBy}!`,
      });
      setDeliveryModalBilty(null);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to confirm delivery" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePod = (updatedItem: any) => {
    saveStoredDelivery(updatedItem);
    saveStoredBilty(updatedItem);
    setDeliveries((prev) =>
      prev.map((d) =>
        String(d.biltyNumber || d.id).toUpperCase() ===
        String(updatedItem.biltyNumber || updatedItem.id).toUpperCase()
          ? updatedItem
          : d
      )
    );
    setFeedback({
      type: "success",
      text: `Proof of Delivery (POD) updated for Bilty #${updatedItem.biltyNumber}!`,
    });
  };

  // Case-Insensitive Status Matching & Queue Logic
  const isDeliveredStatus = (status: string) => {
    const s = String(status || "").toUpperCase();
    return s === "DELIVERED" || s === "COMPLETED" || s === "RECEIVED";
  };

  const filteredDeliveries = deliveries.filter((item) => {
    const isDelivered = isDeliveredStatus(item.shipmentStatus);

    if (statusFilter === "READY" && isDelivered) return false;
    if (statusFilter === "DELIVERED" && !isDelivered) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.biltyNumber?.toLowerCase().includes(q) ||
      item.trackingId?.toLowerCase().includes(q) ||
      item.receiverName?.toLowerCase().includes(q) ||
      item.receiverPhone?.toLowerCase().includes(q) ||
      item.destination?.toLowerCase().includes(q) ||
      item.truckNumber?.toLowerCase().includes(q) ||
      item.driverName?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = () => {
    if (!filteredDeliveries.length) return;
    const data = filteredDeliveries.map((b) => ({
      "Bilty #": b.biltyNumber || "",
      "Booking Date": b.date ? new Date(b.date).toLocaleDateString("en-GB") : "",
      "Route": `${b.origin || ""} → ${b.destination || ""}`,
      "Sender (Shipper)": b.senderName || "",
      "Receiver (Consignee)": b.receiverName || "",
      "Receiver Phone": b.receiverPhone || "",
      "Delivery Address": b.deliveryAddress || b.receiverAddress || "",
      "Cargo Packages": `${b.quantity || 1} Pkgs (${b.packageDetails || ""})`,
      "Weight (KG)": b.weight || 0,
      "Total Freight (PKR)": b.totalAmount || b.freight || 0,
      "Advance Paid": b.paidAmount || 0,
      "Balance Due": b.remainingBalance || 0,
      "Delivery Status": b.shipmentStatus || "READY_FOR_DELIVERY",
      "Delivered Date": b.deliveredDate ? new Date(b.deliveredDate).toLocaleDateString("en-GB") : "-",
      "Received By": b.receivedBy || "-",
      "Receiver CNIC": b.receiverCnic || "-",
      "POD Photo": b.podPhoto || b.podImage ? "Attached" : "No",
    }));

    exportToExcel(data, `Delivery_Queue_${statusFilter}`);
  };

  const readyCount = deliveries.filter((d) => !isDeliveredStatus(d.shipmentStatus)).length;
  const deliveredCount = deliveries.filter((d) => isDeliveredStatus(d.shipmentStatus)).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Printable Gate Pass Modal */}
      {gatePassItem && (
        <PrintableGatePass item={gatePassItem} onClose={() => setGatePassItem(null)} />
      )}

      {/* Proof of Delivery (POD) Modal */}
      {podModalItem && (
        <PodModal
          item={podModalItem}
          onClose={() => setPodModalItem(null)}
          onSavePod={handleSavePod}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Terminal Operations
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-600">Last-Mile Handover</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            Consignment Delivery Queue &amp; POD
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage arrived cargo releases, issue security gate passes, record receiver verification, and upload proof of delivery (POD).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!filteredDeliveries.length}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl shadow-xs gap-2 h-10 px-4"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Link href="/admin/arrivals">
            <Button variant="outline" className="rounded-xl text-xs font-bold gap-2 h-10 px-4">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Warehouse Arrivals</span>
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
            placeholder="Search Bilty #, Receiver name, phone, truck..."
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
            <option value="READY">Ready for Delivery ({readyCount})</option>
            <option value="DELIVERED">Delivered &amp; Completed ({deliveredCount})</option>
            <option value="ALL">All Deliveries ({deliveries.length})</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDeliveryQueue}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-500">
            {filteredDeliveries.length} Records
          </span>
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <LogisticsTableSkeleton rows={5} subtitle="Loading Consignment Delivery Records..." />
      ) : filteredDeliveries.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Consignments in {statusFilter === "READY" ? "Active Delivery Queue" : "This Queue"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When trucks arrive at the warehouse, click &ldquo;Unload &amp; Send to Delivery&rdquo; in Warehouse Arrivals to release consignments here.
          </p>
          <Link href="/admin/arrivals">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold">
              Check Arrivals
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Bilty # / Date</th>
                  <th className="p-3">Route / Hub</th>
                  <th className="p-3">Consignee / Receiver</th>
                  <th className="p-3">Goods / Packages</th>
                  <th className="p-3 text-right">Freight &amp; Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDeliveries.map((b) => {
                  const isDelivered = isDeliveredStatus(b.shipmentStatus);
                  const remaining = b.remainingBalance || 0;
                  const hasPod = Boolean(b.podPhoto || b.podImage || b.hasPod || isDelivered);

                  return (
                    <tr
                      key={b.id || b.biltyNumber}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-bold font-mono text-red-600 block text-xs">
                          {b.biltyNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(b.date || b.createdAt)}
                        </span>
                        {b.challanNumber && (
                          <span className="text-[9px] font-mono text-blue-600 block">
                            Challan: {b.challanNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.origin} &rarr; {b.destination}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {b.destination} Station
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.receiverName || "Consignee Handover"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {b.receiverPhone || "No phone"}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                          {b.deliveryAddress || b.receiverAddress || "Local Warehouse Pick-up"}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.packageDetails || "Commercial Merchandise"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {b.quantity || 1} Pkgs &bull; {b.weight || 0} kg
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block">
                          {formatCurrency(b.totalAmount || b.freight || 0)}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold block ${
                            remaining <= 0 ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {remaining <= 0 ? "Paid In Full" : `Due: ${formatCurrency(remaining)}`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {b.shipmentStatus || "READY_FOR_DELIVERY"}
                        </span>
                      </td>

                      {/* 3 Instant Action Buttons: Mark Delivered, Proof of Delivery (POD), Print Gate Pass */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Action 1: Mark Delivered */}
                          {!isDelivered ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenDelivery(b)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1 h-8 px-2.5"
                              title="Mark consignment as delivered and confirm consignee handover"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Delivered</span>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          )}

                          {/* Action 2: Proof of Delivery (POD) */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPodModalItem(b)}
                            className="rounded-xl text-xs font-semibold gap-1 h-8 px-2.5 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-800"
                            title="View / Upload Proof of Delivery (POD) receipt & stamp"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">POD</span>
                          </Button>

                          {/* Action 3: Print Gate Pass */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setGatePassItem(b)}
                            className="rounded-xl text-xs font-semibold gap-1 h-8 px-2.5 text-slate-700 border-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700"
                            title="Print outward delivery gate pass & cargo release voucher"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Gate Pass</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM DELIVERY MODAL */}
      <Dialog open={!!deliveryModalBilty} onOpenChange={() => setDeliveryModalBilty(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Delivery &amp; Handover
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record consignee verification details, settle freight balance, and release shipment.
            </DialogDescription>
          </DialogHeader>

          {deliveryModalBilty && (
            <form onSubmit={handleConfirmDelivery} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Bilty Number:</span>
                  <span className="font-mono font-black text-red-600">
                    {deliveryModalBilty.biltyNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Consignor (Shipper):</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {deliveryModalBilty.senderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Destination:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {deliveryModalBilty.destination}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">Remaining Balance Due:</span>
                  <span className="font-mono font-black text-amber-600">
                    {formatCurrency(deliveryModalBilty.remainingBalance || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Received By (Full Name) *
                </Label>
                <Input
                  required
                  value={deliveryData.receivedBy}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, receivedBy: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Receiver CNIC / Identification #
                </Label>
                <Input
                  value={deliveryData.receiverCnic}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, receiverCnic: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Handover Date *
                </Label>
                <Input
                  type="date"
                  required
                  value={deliveryData.deliveryDate}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, deliveryDate: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Delivery Remarks / Condition Notes
                </Label>
                <Input
                  value={deliveryData.deliveryNotes}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })
                  }
                  placeholder=""
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {(deliveryModalBilty.remainingBalance || 0) > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="collectRemaining"
                    checked={deliveryData.collectRemainingAmount}
                    onChange={(e) =>
                      setDeliveryData({
                        ...deliveryData,
                        collectRemainingAmount: e.target.checked,
                      })
                    }
                    className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="collectRemaining"
                    className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
                  >
                    Collect remaining balance of {formatCurrency(deliveryModalBilty.remainingBalance)} at delivery
                  </label>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeliveryModalBilty(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Delivery Handover</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
