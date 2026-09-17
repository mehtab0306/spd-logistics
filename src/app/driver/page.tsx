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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  RefreshCw,
  Eye,
  ShieldCheck,
  User,
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  getDriverToCustomerWhatsAppMessage,
} from "@/lib/whatsapp";

export default function DriverPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [viewShipment, setViewShipment] = useState<any>(null);
  const [statusShipment, setStatusShipment] = useState<any>(null);
  const [deliveryShipment, setDeliveryShipment] = useState<any>(null);

  // Status update state
  const [targetStatus, setTargetStatus] = useState("IN_TRANSIT");
  const [checkpointLocation, setCheckpointLocation] = useState("");
  const [checkpointNotes, setCheckpointNotes] = useState("");

  // Delivery confirmation state
  const [deliveryReceivedBy, setDeliveryReceivedBy] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/driver/shipments");
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error("Error fetching driver data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusShipment) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/shipments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consignmentId: statusShipment.id,
          shipmentStatus: targetStatus,
          location: checkpointLocation || `${statusShipment.destination} Transit Route`,
          notes: checkpointNotes,
        }),
      });

      if (res.ok) {
        setStatusShipment(null);
        setCheckpointLocation("");
        setCheckpointNotes("");
        fetchDriverData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryShipment) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/shipments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consignmentId: deliveryShipment.id,
          shipmentStatus: "DELIVERED",
          location: `${deliveryShipment.destination} Drop Point`,
          notes: deliveryNotes,
          receivedBy: deliveryReceivedBy || deliveryShipment.receiverName,
        }),
      });

      if (res.ok) {
        setDeliveryShipment(null);
        setDeliveryReceivedBy("");
        setDeliveryNotes("");
        fetchDriverData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Failed to confirm delivery");
      }
    } catch (err) {
      console.error("Error confirming delivery:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-xs font-bold text-slate-400">Loading your assigned shipments...</p>
      </div>
    );
  }

  const { driver, activeShipments = [], completedShipments = [], adminContact = {} } = data || {};
  const adminPhone = adminContact?.phone || "0325 2024433";

  return (
    <div className="space-y-6">
      {/* Driver Profile Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 bg-slate-800 flex items-center justify-center shadow-md">
            {driver?.photo || driver?.user?.avatar ? (
              <img
                src={driver.photo || driver.user?.avatar}
                alt={driver.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Truck className="w-8 h-8 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  driver?.status === "AVAILABLE"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                }`}
              >
                Driver Status: {driver?.status || "AVAILABLE"}
              </span>
              <span className="text-xs text-slate-400">&bull; Assigned Truck: <strong>{driver?.vehicleNumber || "LES-9988"}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {driver?.name || "Fleet Driver"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Contact: <strong className="text-white">{driver?.phone || driver?.contact}</strong></span>
              <span>&bull;</span>
              <span>CNIC: <strong className="text-white font-mono">{driver?.cnic || "35201-1234567-1"}</strong></span>
              <span>&bull;</span>
              <span>License: <strong className="text-white">{driver?.licenseNumber || "HTV"}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Call Admin & WhatsApp Admin buttons */}
          <a
            href={`tel:${adminPhone}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>Call Admin</span>
          </a>
          <a
            href={buildWhatsAppUrl(adminPhone, `Assalamualaikum SPD Dispatch, this is driver ${driver?.name || "Driver"}. Reporting for transit instructions.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Admin</span>
          </a>
          <Button
            onClick={fetchDriverData}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-bold text-xs rounded-xl gap-2 h-9"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold uppercase text-emerald-600">Active Shipments</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {activeShipments.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Assigned consignments on trip</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold uppercase text-spd-blue">Delivered Cargo</span>
          <p className="text-2xl font-black text-spd-blue mt-1">
            {completedShipments.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Completed successful drops</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Total Assigned Trips</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {activeShipments.length + completedShipments.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Lifetime consignments</p>
        </div>
      </div>

      {/* Active Assigned Shipments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Current Assigned Consignments (Trip Schedule)
          </h2>
          <span className="text-xs font-bold text-slate-400">{activeShipments.length} Pending</span>
        </div>

        {activeShipments.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">All shipments delivered!</h3>
            <p className="text-xs text-slate-500">You currently have no active highway dispatches assigned.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeShipments.map((s: any) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bilty #</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{s.biltyNumber}</h3>
                    <p className="text-xs font-mono font-bold text-spd-blue">TRK: {s.trackingId}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400">
                    {s.shipmentStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Origin Station</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{s.origin}</p>
                    <p className="text-[10px] text-slate-500">{s.senderName}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Destination Drop</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{s.destination}</p>
                    <p className="text-[10px] text-slate-500">{s.receiverName}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-xs space-y-1.5">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">
                    Cargo: <strong>{s.packageDetails}</strong> ({s.quantity} items &bull; {s.weight || "N/A"} KG)
                  </p>
                  <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Phone className="w-3 h-3 text-emerald-600" /> Receiver: <strong>{s.receiverName}</strong> ({s.receiverPhone || "No phone"})
                  </p>
                  {s.receiverAddress && (
                    <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-spd-red" /> Delivery Address: {s.receiverAddress}
                    </p>
                  )}
                </div>

                {/* Customer Contact Quick Actions: Call Customer & WhatsApp Customer */}
                {(() => {
                  const customerPhone = s.receiver?.whatsapp || s.receiver?.phone || s.receiverPhone;
                  const customerMsg = getDriverToCustomerWhatsAppMessage({
                    customerName: s.receiverName || s.receiver?.name,
                    driverName: data?.driver?.name,
                    biltyNumber: s.biltyNumber,
                    trackingId: s.trackingId,
                    status: s.shipmentStatus,
                  });
                  return (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <a
                        href={customerPhone ? `tel:${customerPhone}` : "#"}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          customerPhone
                            ? "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                            : "opacity-40 pointer-events-none border-slate-200 text-slate-400"
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Call Customer</span>
                      </a>
                      <a
                        href={customerPhone ? buildWhatsAppUrl(customerPhone, customerMsg) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          customerPhone
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                            : "opacity-40 pointer-events-none border-slate-200 text-slate-400"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Customer</span>
                      </a>
                    </div>
                  );
                })()}

                {/* Driver Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewShipment(s)}
                    className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Shipment</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setStatusShipment(s);
                      setTargetStatus("IN_TRANSIT");
                      setCheckpointLocation(`${s.destination} Motorway Route`);
                      setCheckpointNotes("");
                    }}
                    className="flex-1 bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    <span>Update Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setDeliveryShipment(s);
                      setDeliveryReceivedBy(s.receiverName || "");
                      setDeliveryNotes("");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Deliveries History */}
      {completedShipments.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Recent Completed Deliveries
          </h2>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">Bilty # & Date</TableHead>
                  <TableHead className="text-xs font-bold">Route</TableHead>
                  <TableHead className="text-xs font-bold">Consignee</TableHead>
                  <TableHead className="text-xs font-bold">Delivered Date & Time</TableHead>
                  <TableHead className="text-xs font-bold">Received By</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedShipments.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{c.biltyNumber}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.trackingId}</p>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {c.origin} &rarr; {c.destination}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {c.receiverName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {c.deliveryDate ? formatDate(c.deliveryDate) : formatDate(c.updatedAt)} ({c.deliveryTime || "Delivered"})
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-600">
                      {c.receivedBy || c.receiverName}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        CONFIRMED
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 1. VIEW SHIPMENT DETAILS MODAL */}
      <Dialog open={!!viewShipment} onOpenChange={() => setViewShipment(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-spd-blue" />
              Consignment Details: {viewShipment?.biltyNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              Tracking ID: {viewShipment?.trackingId} &bull; Route: {viewShipment?.origin} &rarr; {viewShipment?.destination}
            </DialogDescription>
          </DialogHeader>

          {viewShipment && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Sender / Origin</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewShipment.senderName}</p>
                  <p className="text-[11px] text-slate-500">{viewShipment.senderPhone || "No phone"}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{viewShipment.origin} Terminal</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600">Receiver / Destination</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewShipment.receiverName}</p>
                  <p className="text-[11px] text-slate-500">{viewShipment.receiver?.whatsapp || viewShipment.receiverPhone || viewShipment.receiver?.phone || "No phone"}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{viewShipment.destination}</p>
                  {(() => {
                    const custPhone = viewShipment.receiver?.whatsapp || viewShipment.receiverPhone || viewShipment.receiver?.phone;
                    if (!custPhone) return null;
                    const custMsg = getDriverToCustomerWhatsAppMessage({
                      customerName: viewShipment.receiverName || viewShipment.receiver?.name,
                      driverName: data?.driver?.name,
                      biltyNumber: viewShipment.biltyNumber,
                      trackingId: viewShipment.trackingId,
                      status: viewShipment.shipmentStatus,
                    });
                    return (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <a
                          href={`tel:${custPhone}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold"
                        >
                          <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Call
                        </a>
                        <a
                          href={buildWhatsAppUrl(custPhone, custMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {viewShipment.receiverAddress && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Delivery Address</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{viewShipment.receiverAddress}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Package Items</p>
                  <p className="font-black text-slate-900 dark:text-white mt-0.5">{viewShipment.quantity} Qty</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Weight</p>
                  <p className="font-black text-slate-900 dark:text-white mt-0.5">{viewShipment.weight || "N/A"} KG</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Payment Status</p>
                  <p className="font-black text-emerald-600 mt-0.5">{viewShipment.paymentStatus || "PAID"}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Package Contents / Notes</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{viewShipment.packageDetails || "General Cargo"}</p>
                {viewShipment.remarks && (
                  <p className="text-[11px] text-slate-500 mt-1">Special Instructions: {viewShipment.remarks}</p>
                )}
              </div>

              {/* Checkpoint Tracking History */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracking Event Log</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {viewShipment.trackingEvents && viewShipment.trackingEvents.length > 0 ? (
                    viewShipment.trackingEvents.map((evt: any, idx: number) => (
                      <div key={evt.id || idx} className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-spd-blue">{evt.status.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(evt.timestamp || evt.createdAt)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{evt.description}</p>
                        {evt.location && (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {evt.location}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs text-center py-3">No tracking events logged yet.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setViewShipment(null)}
                  className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-bold text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. UPDATE STATUS MODAL */}
      <Dialog open={!!statusShipment} onOpenChange={() => setStatusShipment(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-spd-blue" />
              Update Shipment Status
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Bilty: {statusShipment?.biltyNumber} &bull; Route: {statusShipment?.origin} &rarr; {statusShipment?.destination}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                New Status
              </Label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="PICKED_UP">Picked Up from Warehouse</option>
                <option value="IN_TRANSIT">In Transit (Highway Route)</option>
                <option value="ARRIVED_AT_DESTINATION">Arrived at Destination Terminal</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery (Local Van)</option>
                <option value="ON_HOLD">On Hold (Highway Weather / Roadblock)</option>
                <option value="DELIVERY_FAILED">Delivery Failed (Customer Unreachable)</option>
                <option value="RETURNED">Returned to Terminal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Current Location / Checkpoint
              </Label>
              <Input
                required
                placeholder="e.g. Sukkur Bypass, Hyderabad Toll, City Terminal"
                value={checkpointLocation}
                onChange={(e) => setCheckpointLocation(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Trip Notes / Remarks (Optional)
              </Label>
              <Input
                placeholder="e.g. Cleared toll plaza, moving towards warehouse"
                value={checkpointNotes}
                onChange={(e) => setCheckpointNotes(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusShipment(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. TWO-STEP DELIVERY CONFIRMATION MODAL */}
      <Dialog open={!!deliveryShipment} onOpenChange={() => setDeliveryShipment(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Delivery
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Are you sure this shipment has been successfully delivered to the customer?
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDelivery} className="space-y-4 pt-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
              <p className="font-black text-emerald-800 dark:text-emerald-300">
                Bilty: {deliveryShipment?.biltyNumber} ({deliveryShipment?.trackingId})
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Customer: <strong>{deliveryShipment?.receiverName}</strong>
              </p>
              <p className="text-slate-500">
                Location: {deliveryShipment?.destination} &bull; {deliveryShipment?.packageDetails}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Received By (Person Name) *
              </Label>
              <Input
                required
                placeholder="Receiver name or authorized representative"
                value={deliveryReceivedBy}
                onChange={(e) => setDeliveryReceivedBy(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Delivery Note / Remarks (Optional)
              </Label>
              <Input
                placeholder="e.g. Delivered in good condition at main office"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeliveryShipment(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delivered"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
