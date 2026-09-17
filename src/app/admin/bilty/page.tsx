"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { EmptyState } from "@/components/shared/empty-state";
import {
  Package,
  Plus,
  Search,
  Printer,
  Truck,
  MapPin,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Clock,
  Download,
  Building2,
  Phone,
  FileText,
  MessageSquare,
  Eye,
  Edit,
  AlertTriangle,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  getBiltyTrackingWhatsAppMessage,
  getAdminToDriverWhatsAppMessage,
} from "@/lib/whatsapp";

export default function BiltyPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [newBiltyOpen, setNewBiltyOpen] = useState(false);
  const [editBiltyOpen, setEditBiltyOpen] = useState(false);
  const [printBilty, setPrintBilty] = useState<any>(null);
  const [statusModalBilty, setStatusModalBilty] = useState<any>(null);
  const [viewDetailsBilty, setViewDetailsBilty] = useState<any>(null);

  // Delete Bilty 2-step confirmation modal states
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deletingBilty, setDeletingBilty] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Smart Search term states for Add modal
  const [custSearchTerm, setCustSearchTerm] = useState("");
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  const [vehSearchTerm, setVehSearchTerm] = useState("");

  // Smart Search term states for Edit modal
  const [editCustSearchTerm, setEditCustSearchTerm] = useState("");
  const [editDriverSearchTerm, setEditDriverSearchTerm] = useState("");
  const [editVehSearchTerm, setEditVehSearchTerm] = useState("");

  // New Bilty Form State
  const [formData, setFormData] = useState({
    biltyNumber: "",
    trackingId: "",
    date: new Date().toISOString().slice(0, 10),
    customerId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    origin: "Lahore",
    destination: "Karachi",
    warehouse: "LAHORE",
    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",
    packageDetails: "General Commercial Cargo",
    quantity: "1",
    weight: "50",
    cpm: "",
    freight: "5000",
    additionalCharges: "200",
    discount: "0",
    paidAmount: "0",
    shipmentStatus: "BOOKED",
    notes: "",
  });

  // Edit Bilty Form State
  const [editFormData, setEditFormData] = useState<any>({
    id: "",
    biltyNumber: "",
    trackingId: "",
    date: new Date().toISOString().slice(0, 10),
    customerId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    origin: "Lahore",
    destination: "Karachi",
    warehouse: "LAHORE",
    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",
    packageDetails: "",
    quantity: "1",
    weight: "",
    cpm: "",
    freight: "0",
    additionalCharges: "0",
    discount: "0",
    paidAmount: "0",
    shipmentStatus: "BOOKED",
    notes: "",
  });

  // Status Update Modal State
  const [statusUpdate, setStatusUpdate] = useState({
    shipmentStatus: "IN_TRANSIT",
    location: "",
    statusNote: "",
    receivedBy: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
  });

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (warehouseFilter) params.append("warehouse", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/bilty?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConsignments(data.data);
      }
    } catch (err) {
      console.error("Error fetching consignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, drivRes, vehRes] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/admin/drivers"),
        fetch("/api/admin/vehicles"),
      ]);
      const [custData, drivData, vehData] = await Promise.all([
        custRes.json(),
        drivRes.json(),
        vehRes.json(),
      ]);
      if (custData.success) setCustomers(custData.data);
      if (drivData.success) setDrivers(drivData.data);
      if (vehData.success) setVehicles(vehData.data);
    } catch (err) {
      console.error("Error fetching dependencies:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBilty?.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/bilty?id=${encodeURIComponent(deletingBilty.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete bilty");
      }
      setActionFeedback({
        type: "success",
        text: `Bilty ${deletingBilty.biltyNumber || ""} (${deletingBilty.trackingId || ""}) was successfully deleted.`,
      });
      setDeleteStep(0);
      setDeletingBilty(null);
      fetchConsignments();
    } catch (err: any) {
      console.error("Delete bilty error:", err);
      setActionFeedback({
        type: "error",
        text: err.message || "Failed to delete consignment bilty.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
  }, [search, warehouseFilter, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Smart Search matchers
  const filterCustomers = (term: string) => {
    if (!term || !term.trim()) return customers;
    const q = term.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.accountId && c.accountId.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  };

  const filterDrivers = (term: string) => {
    if (!term || !term.trim()) return drivers;
    const q = term.toLowerCase().trim();
    return drivers.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.contact && d.contact.toLowerCase().includes(q)) ||
        (d.cnic && d.cnic.toLowerCase().includes(q)) ||
        (d.user?.email && d.user.email.toLowerCase().includes(q))
    );
  };

  const filterVehicles = (term: string) => {
    if (!term || !term.trim()) return vehicles;
    const q = term.toLowerCase().replace(/[\s-]/g, "");
    return vehicles.filter((v) => {
      const vNum = (v.vehicleNumber || "").toLowerCase().replace(/[\s-]/g, "");
      const vType = (v.vehicleType || "").toLowerCase();
      const vModel = (v.model || "").toLowerCase();
      return vNum.includes(q) || vType.includes(term.toLowerCase().trim()) || vModel.includes(term.toLowerCase().trim());
    });
  };

  const getDriverAssignedVehicle = (drvId: string) => {
    if (!drvId) return null;
    const drv = drivers.find((d) => d.id === drvId);
    if (!drv) return null;
    return drv.vehicleNumber || drv.vehicles?.[0]?.vehicleNumber || null;
  };

  // Open Add Bilty Modal with Auto-generated sequential numbers
  const handleOpenAddBilty = () => {
    const year = new Date().getFullYear();
    const count = consignments.length + 1;
    const seq = String(count).padStart(4, "0");
    const suggestedBilty = `SPD-LHR-${year}-${seq}`;
    const suggestedTracking = `SPD-${year}-${String(Date.now()).slice(-6)}`;

    setFormData({
      biltyNumber: suggestedBilty,
      trackingId: suggestedTracking,
      date: new Date().toISOString().slice(0, 10),
      customerId: "",
      senderName: "",
      senderPhone: "",
      senderAddress: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      origin: "Lahore",
      destination: "Karachi",
      warehouse: "LAHORE",
      vehicleId: "",
      vehicleNumber: "",
      driverId: "",
      driverName: "",
      packageDetails: "General Commercial Cargo",
      quantity: "1",
      weight: "50",
      cpm: "",
      freight: "5000",
      additionalCharges: "200",
      discount: "0",
      paidAmount: "0",
      shipmentStatus: "BOOKED",
      notes: "",
    });
    setCustSearchTerm("");
    setDriverSearchTerm("");
    setVehSearchTerm("");
    setFormError("");
    setNewBiltyOpen(true);
  };

  // Open Edit Bilty Modal with existing data loaded
  const handleOpenEdit = (bilty: any) => {
    setEditFormData({
      id: bilty.id,
      biltyNumber: bilty.biltyNumber || "",
      trackingId: bilty.trackingId || "",
      date: bilty.date ? new Date(bilty.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      customerId: bilty.customerId || "",
      senderName: bilty.senderName || "",
      senderPhone: bilty.senderPhone || "",
      senderAddress: bilty.senderAddress || "",
      receiverName: bilty.receiverName || "",
      receiverPhone: bilty.receiverPhone || "",
      receiverAddress: bilty.receiverAddress || "",
      origin: bilty.origin || "Lahore",
      destination: bilty.destination || "Karachi",
      warehouse: bilty.warehouse || "LAHORE",
      vehicleId: bilty.vehicleId || "",
      vehicleNumber: bilty.vehicleNumber || (bilty.vehicle ? bilty.vehicle.vehicleNumber : ""),
      driverId: bilty.driverId || "",
      driverName: bilty.driverName || (bilty.driver ? bilty.driver.name : ""),
      packageDetails: bilty.packageDetails || "",
      quantity: String(bilty.quantity || 1),
      weight: bilty.weight !== null && bilty.weight !== undefined ? String(bilty.weight) : "",
      cpm: bilty.cpm !== null && bilty.cpm !== undefined ? String(bilty.cpm) : "",
      freight: String(bilty.freight || 0),
      additionalCharges: String(bilty.additionalCharges || 0),
      discount: String(bilty.discount || 0),
      paidAmount: String(bilty.paidAmount || 0),
      shipmentStatus: bilty.shipmentStatus || "BOOKED",
      notes: bilty.notes || "",
    });
    setEditCustSearchTerm("");
    setEditDriverSearchTerm("");
    setEditVehSearchTerm("");
    setEditFormError("");
    setEditBiltyOpen(true);
  };

  // Handle Customer Selection
  const handleSelectCustomer = (cust: any, isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev: any) => ({
        ...prev,
        customerId: cust ? cust.id : "",
        senderName: cust ? (cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name) : prev.senderName,
        senderPhone: cust ? cust.phone || "" : prev.senderPhone,
        senderAddress: cust ? cust.address || `${cust.city}, Pakistan` : prev.senderAddress,
        warehouse: cust?.warehouse || prev.warehouse,
      }));
      setEditCustSearchTerm("");
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: cust ? cust.id : "",
        senderName: cust ? (cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name) : prev.senderName,
        senderPhone: cust ? cust.phone || "" : prev.senderPhone,
        senderAddress: cust ? cust.address || `${cust.city}, Pakistan` : prev.senderAddress,
        warehouse: cust?.warehouse || prev.warehouse,
      }));
      setCustSearchTerm("");
    }
  };

  // Handle Driver Selection
  const handleSelectDriver = (drv: any, isEdit = false) => {
    const drvAssignedVeh = drv ? drv.vehicleNumber || drv.vehicles?.[0]?.vehicleNumber : null;
    if (isEdit) {
      setEditFormData((prev: any) => {
        const nextVehId = (!prev.vehicleId && drvAssignedVeh)
          ? (vehicles.find((v) => v.vehicleNumber.toLowerCase() === drvAssignedVeh.toLowerCase())?.id || prev.vehicleId)
          : prev.vehicleId;
        const nextVehNum = (!prev.vehicleNumber && drvAssignedVeh) ? drvAssignedVeh : prev.vehicleNumber;
        return {
          ...prev,
          driverId: drv ? drv.id : "",
          driverName: drv ? drv.name : "",
          vehicleId: nextVehId,
          vehicleNumber: nextVehNum,
        };
      });
      setEditDriverSearchTerm("");
    } else {
      setFormData((prev) => {
        const nextVehId = (!prev.vehicleId && drvAssignedVeh)
          ? (vehicles.find((v) => v.vehicleNumber.toLowerCase() === drvAssignedVeh.toLowerCase())?.id || prev.vehicleId)
          : prev.vehicleId;
        const nextVehNum = (!prev.vehicleNumber && drvAssignedVeh) ? drvAssignedVeh : prev.vehicleNumber;
        return {
          ...prev,
          driverId: drv ? drv.id : "",
          driverName: drv ? drv.name : "",
          vehicleId: nextVehId,
          vehicleNumber: nextVehNum,
        };
      });
      setDriverSearchTerm("");
    }
  };

  // Handle Vehicle Selection
  const handleSelectVehicle = (veh: any, isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev: any) => ({
        ...prev,
        vehicleId: veh ? veh.id : "",
        vehicleNumber: veh ? veh.vehicleNumber : "",
      }));
      setEditVehSearchTerm("");
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleId: veh ? veh.id : "",
        vehicleNumber: veh ? veh.vehicleNumber : "",
      }));
      setVehSearchTerm("");
    }
  };

  // Live calculations for Add form
  const totalAmount = Math.max(
    0,
    (parseFloat(formData.freight) || 0) +
      (parseFloat(formData.additionalCharges) || 0) -
      (parseFloat(formData.discount) || 0)
  );
  const remainingBalance = Math.max(
    0,
    totalAmount - (parseFloat(formData.paidAmount) || 0)
  );
  const paymentStatus = remainingBalance <= 0 ? "PAID" : (parseFloat(formData.paidAmount) || 0) > 0 ? "PARTIAL" : "PENDING";

  // Live calculations for Edit form
  const editTotalAmount = Math.max(
    0,
    (parseFloat(editFormData.freight) || 0) +
      (parseFloat(editFormData.additionalCharges) || 0) -
      (parseFloat(editFormData.discount) || 0)
  );
  const editRemainingBalance = Math.max(
    0,
    editTotalAmount - (parseFloat(editFormData.paidAmount) || 0)
  );
  const editPaymentStatus = editRemainingBalance <= 0 ? "PAID" : (parseFloat(editFormData.paidAmount) || 0) > 0 ? "PARTIAL" : "PENDING";

  const handleCreateBilty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/bilty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create consignment bilty");
      }

      setNewBiltyOpen(false);
      setActionFeedback({ type: "success", text: `Bilty #${data.data?.biltyNumber || formData.biltyNumber} saved successfully to database.` });
      setTimeout(() => setActionFeedback(null), 4000);
      fetchConsignments();
      // Automatically open the printable voucher modal
      setPrintBilty(data.data);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBilty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setEditFormError("");

    try {
      const res = await fetch("/api/admin/bilty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update consignment bilty");
      }

      setEditBiltyOpen(false);
      setActionFeedback({ type: "success", text: `Bilty #${editFormData.biltyNumber} updated successfully in database.` });
      setTimeout(() => setActionFeedback(null), 4000);
      fetchConsignments();
    } catch (err: any) {
      setEditFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalBilty) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bilty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: statusModalBilty.id,
          shipmentStatus: statusUpdate.shipmentStatus,
          location: statusUpdate.location,
          statusNote: statusUpdate.statusNote,
          receivedBy: statusUpdate.receivedBy,
          deliveryDate: statusUpdate.deliveryDate,
        }),
      });
      if (res.ok) {
        setStatusModalBilty(null);
        fetchConsignments();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Bilty & Consignments Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate official consignment bilty vouchers, assign fleet drivers, update status, and print vouchers.
          </p>
        </div>
        <Button
          onClick={handleOpenAddBilty}
          className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Consignment Bilty</span>
        </Button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Bilty #, tracking, sender, receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="">All Hubs</option>
            <option value="LAHORE">Lahore Hub</option>
            <option value="KARACHI">Karachi Hub</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="BOOKING_RECEIVED">Booking Received</option>
            <option value="PICKUP_PENDING">Pickup Pending</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DRIVER_ON_THE_WAY">Driver On The Way</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchConsignments}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bilties Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-400 font-semibold">Loading consignments...</p>
        </div>
      ) : consignments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No consignments found"
          description="Create your first consignment bilty voucher to initiate shipment dispatch."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Bilty # / Tracking</TableHead>
                <TableHead className="text-xs font-bold">Shipper & Receiver</TableHead>
                <TableHead className="text-xs font-bold">Route & Hub</TableHead>
                <TableHead className="text-xs font-bold">Truck & Driver</TableHead>
                <TableHead className="text-xs font-bold">Total Freight</TableHead>
                <TableHead className="text-xs font-bold">Balance</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consignments.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <TableCell>
                    <div>
                      <p className="font-black text-xs text-slate-900 dark:text-white">{c.biltyNumber}</p>
                      <p className="text-[10px] text-spd-blue font-mono font-bold">{c.trackingId}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(c.date)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        From: {c.customer?.companyName || c.senderName}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        To: {c.receiverName} ({c.receiverPhone || "No phone"})
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.packageDetails}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{c.origin}</span>
                        <span>&rarr;</span>
                        <span>{c.destination}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold mt-1 inline-block ${
                          c.warehouse === "KARACHI"
                            ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                            : "bg-red-100 text-spd-red dark:bg-red-950/60 dark:text-red-400"
                        }`}
                      >
                        {c.warehouse || "LAHORE"} HUB
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {c.vehicleNumber || c.vehicle?.vehicleNumber || "Unassigned"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Driver: {c.driverName || c.driver?.name || "Unassigned"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(c.totalAmount)}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      Paid: {formatCurrency(c.paidAmount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-black ${
                        c.remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(c.remainingBalance)}
                    </span>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{c.paymentStatus}</p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        c.shipmentStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : c.shipmentStatus === "IN_TRANSIT" || c.shipmentStatus === "DRIVER_ON_THE_WAY"
                          ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {c.shipmentStatus.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 text-xs font-semibold gap-1"
                        title="View Shipment Details & Contacts"
                        onClick={() => setViewDetailsBilty(c)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Details</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-950/50 text-xs font-semibold gap-1"
                        title="Edit Bilty & Assignments"
                        onClick={() => handleOpenEdit(c)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Edit</span>
                      </Button>
                      {(() => {
                        const targetPhone = c.receiver?.whatsapp || c.receiverPhone || c.receiver?.phone || c.customer?.whatsapp || c.customer?.phone;
                        if (!targetPhone) return null;
                        const msg = getBiltyTrackingWhatsAppMessage({
                          biltyNumber: c.biltyNumber,
                          trackingId: c.trackingId,
                          status: c.shipmentStatus,
                          origin: c.origin,
                          destination: c.destination,
                        });
                        return (
                          <a
                            href={buildWhatsAppUrl(targetPhone, msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            title="WhatsApp Customer / Consignee"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        );
                      })()}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title="Print Bilty Voucher"
                        onClick={() => setPrintBilty(c)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete Bilty"
                        onClick={() => {
                          setDeletingBilty(c);
                          setDeleteStep(1);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-xs font-bold gap-1 shadow-sm"
                        title="Update Shipment Status"
                        onClick={() => {
                          setStatusModalBilty(c);
                          setStatusUpdate({
                            shipmentStatus: c.shipmentStatus,
                            location: `${c.destination} Terminal`,
                            statusNote: "",
                            receivedBy: c.receiverName || "",
                            deliveryDate: new Date().toISOString().slice(0, 10),
                          });
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 1: CREATE NEW BILTY */}
      <Dialog open={newBiltyOpen} onOpenChange={setNewBiltyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-spd-red" />
              New Consignment Bilty Voucher
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Generate sequential Bilty and real-time tracking ID with automatic customer linking, fleet assignment, and financial balance calculation.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateBilty} className="space-y-4 pt-2">
            {/* Voucher Identity & Date */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Bilty Number *
                  </Label>
                  <Input
                    required
                    value={formData.biltyNumber}
                    onChange={(e) => setFormData({ ...formData, biltyNumber: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                    placeholder="SPD-LHR-2026-0001"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tracking ID *
                  </Label>
                  <Input
                    required
                    value={formData.trackingId}
                    onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono"
                    placeholder="SPD-2026-XXXXXX"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Booking Date *
                  </Label>
                  <Input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Initial Status
                  </Label>
                  <div className="h-9 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-spd-blue text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-spd-blue animate-pulse" />
                    BOOKED (Dispatched at Origin)
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Shipper / Sender Section */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-spd-blue flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Shipper / Sender Details
                </span>
                <span className="text-[11px] text-slate-400">Link customer account or enter walk-in</span>
              </div>

              {/* Linked Customer Card or Smart Search */}
              {formData.customerId ? (
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-spd-blue text-white flex items-center justify-center font-bold text-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {customers.find((c) => c.id === formData.customerId)?.companyName ||
                          customers.find((c) => c.id === formData.customerId)?.name}
                        <span className="ml-2 text-[10px] font-medium text-spd-blue bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                          Linked Customer
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {customers.find((c) => c.id === formData.customerId)?.phone} &bull;{" "}
                        {customers.find((c) => c.id === formData.customerId)?.city}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectCustomer(null, false)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 px-2"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Unlink
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <Input
                        placeholder="Search customer by name, company, phone, city..."
                        value={custSearchTerm}
                        onChange={(e) => setCustSearchTerm(e.target.value)}
                        className="rounded-xl h-9 text-xs pl-8"
                      />
                    </div>
                    <select
                      onChange={(e) => {
                        const c = customers.find((cust) => cust.id === e.target.value);
                        if (c) handleSelectCustomer(c, false);
                      }}
                      value=""
                      className="w-48 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      <option value="">Quick Select...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName ? `${c.companyName} (${c.name})` : c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  {custSearchTerm && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-md divide-y divide-slate-100 dark:divide-slate-800">
                      {filterCustomers(custSearchTerm).length === 0 ? (
                        <div className="p-2.5 text-xs text-slate-400 text-center">No matching customers found</div>
                      ) : (
                        filterCustomers(custSearchTerm).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c, false)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                              </span>
                              <span className="ml-2 text-slate-400">{c.city}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[11px]">{c.phone}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender / Consignor Name *
                  </Label>
                  <Input
                    required
                    placeholder="Shipper name"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender Phone
                  </Label>
                  <Input
                    placeholder="03001234567"
                    value={formData.senderPhone}
                    onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender Address / Location
                  </Label>
                  <Input
                    placeholder="Address / Terminal"
                    value={formData.senderAddress}
                    onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Consignee / Receiver Section */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-spd-red flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Consignee / Receiver Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Receiver / Business Name *
                  </Label>
                  <Input
                    required
                    placeholder="Receiver Name / Firm"
                    value={formData.receiverName}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Receiver Phone *
                  </Label>
                  <Input
                    required
                    placeholder="03219876543"
                    value={formData.receiverPhone}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Delivery Address / Terminal
                  </Label>
                  <Input
                    placeholder="Receiver Address"
                    value={formData.receiverAddress}
                    onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Route, Hub, Vehicle & Driver */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Route, Fleet & Driver Assignment
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Origin Station *
                  </Label>
                  <Input
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                    placeholder="e.g. Lahore"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Destination Station *
                  </Label>
                  <Input
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                    placeholder="e.g. Karachi"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Warehouse Hub
                  </Label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="LAHORE">Lahore Hub</option>
                    <option value="KARACHI">Karachi Hub</option>
                  </select>
                </div>
              </div>

              {/* Driver & Vehicle Smart Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Driver */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Assign Driver (Optional)
                    </Label>
                    {formData.driverId && (
                      <button
                        type="button"
                        onClick={() => handleSelectDriver(null, false)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.driverId}
                    onChange={(e) => {
                      const d = drivers.find((drv) => drv.id === e.target.value);
                      handleSelectDriver(d, false);
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} &bull; {d.phone || d.contact} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Assign Fleet Vehicle (Optional)
                    </Label>
                    {formData.vehicleId && (
                      <button
                        type="button"
                        onClick={() => handleSelectVehicle(null, false)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => {
                      const v = vehicles.find((veh) => veh.id === e.target.value);
                      handleSelectVehicle(v, false);
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="">-- No Vehicle Assigned --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.model || v.vehicleType}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conflict Warning Banner */}
              {(() => {
                const regVeh = getDriverAssignedVehicle(formData.driverId);
                const hasConflict = !!(
                  formData.driverId &&
                  formData.vehicleNumber &&
                  regVeh &&
                  formData.vehicleNumber.toLowerCase().replace(/[-\s]/g, "") !==
                    regVeh.toLowerCase().replace(/[-\s]/g, "")
                );
                if (!hasConflict) return null;
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Driver + Vehicle Assignment Conflict</p>
                      <p className="mt-0.5 text-[11px]">
                        Driver <strong>{formData.driverName}</strong> is registered with vehicle{" "}
                        <strong>{regVeh}</strong>, but vehicle <strong>{formData.vehicleNumber}</strong> is currently
                        selected.
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const matchingVeh = vehicles.find(
                              (v) =>
                                v.vehicleNumber.toLowerCase().replace(/[-\s]/g, "") ===
                                regVeh.toLowerCase().replace(/[-\s]/g, "")
                            );
                            if (matchingVeh) handleSelectVehicle(matchingVeh, false);
                            else setFormData({ ...formData, vehicleNumber: regVeh });
                          }}
                          className="font-bold underline text-amber-900 dark:text-amber-200 hover:text-black text-[11px]"
                        >
                          Switch to driver&apos;s registered vehicle ({regVeh})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 4. Cargo / Package Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Cargo & Package Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Package Details / Goods Description *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. 50 Cartons Cotton Yarn / Auto Parts"
                    value={formData.packageDetails}
                    onChange={(e) => setFormData({ ...formData, packageDetails: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Quantity / Packages
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Total Weight (KG)
                  </Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    CPM / Dimensions (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. 2.4 CBM"
                    value={formData.cpm}
                    onChange={(e) => setFormData({ ...formData, cpm: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Special Instructions / Notes
                  </Label>
                  <Input
                    placeholder="Handle with care / Fragile"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 5. Financials & Calculation */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Financial Calculation
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Payment: {paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Base Freight (PKR) *
                  </Label>
                  <Input
                    required
                    type="number"
                    value={formData.freight}
                    onChange={(e) => setFormData({ ...formData, freight: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Labor / Additional
                  </Label>
                  <Input
                    type="number"
                    value={formData.additionalCharges}
                    onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Discount (PKR)
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Advance Paid (PKR)
                  </Label>
                  <Input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="rounded-xl h-9 text-xs border-emerald-300 dark:border-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Net Total Amount:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    Remaining Balance:
                  </span>
                  <span className="font-black text-sm text-amber-700 dark:text-amber-400">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewBiltyOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                <span>Save & Create Consignment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 1B: EDIT EXISTING BILTY */}
      <Dialog open={editBiltyOpen} onOpenChange={setEditBiltyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-spd-blue" />
              Edit Consignment Bilty Voucher
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify consignment details, reassign driver/vehicle, update customer link, or adjust financials.
            </DialogDescription>
          </DialogHeader>

          {editFormError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {editFormError}
            </div>
          )}

          <form onSubmit={handleUpdateBilty} className="space-y-4 pt-2">
            {/* Voucher Identity & Date */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Bilty Number *
                  </Label>
                  <Input
                    required
                    value={editFormData.biltyNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, biltyNumber: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tracking ID *
                  </Label>
                  <Input
                    required
                    value={editFormData.trackingId}
                    onChange={(e) => setEditFormData({ ...editFormData, trackingId: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Booking Date *
                  </Label>
                  <Input
                    required
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Shipment Status
                  </Label>
                  <select
                    value={editFormData.shipmentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, shipmentStatus: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-spd-blue"
                  >
                    <option value="BOOKED">BOOKED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="ARRIVED_AT_HUB">ARRIVED_AT_HUB</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 1. Shipper / Sender Section */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-spd-blue flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Shipper / Sender Details
                </span>
                <span className="text-[11px] text-slate-400">Link customer account or enter walk-in</span>
              </div>

              {/* Linked Customer Card or Smart Search */}
              {editFormData.customerId ? (
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-spd-blue text-white flex items-center justify-center font-bold text-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {customers.find((c) => c.id === editFormData.customerId)?.companyName ||
                          customers.find((c) => c.id === editFormData.customerId)?.name}
                        <span className="ml-2 text-[10px] font-medium text-spd-blue bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                          Linked Customer
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {customers.find((c) => c.id === editFormData.customerId)?.phone} &bull;{" "}
                        {customers.find((c) => c.id === editFormData.customerId)?.city}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectCustomer(null, true)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 px-2"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Unlink
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <Input
                        placeholder="Search customer by name, company, phone, city..."
                        value={editCustSearchTerm}
                        onChange={(e) => setEditCustSearchTerm(e.target.value)}
                        className="rounded-xl h-9 text-xs pl-8"
                      />
                    </div>
                    <select
                      onChange={(e) => {
                        const c = customers.find((cust) => cust.id === e.target.value);
                        if (c) handleSelectCustomer(c, true);
                      }}
                      value=""
                      className="w-48 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      <option value="">Quick Select...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName ? `${c.companyName} (${c.name})` : c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  {editCustSearchTerm && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-md divide-y divide-slate-100 dark:divide-slate-800">
                      {filterCustomers(editCustSearchTerm).length === 0 ? (
                        <div className="p-2.5 text-xs text-slate-400 text-center">No matching customers found</div>
                      ) : (
                        filterCustomers(editCustSearchTerm).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c, true)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                              </span>
                              <span className="ml-2 text-slate-400">{c.city}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[11px]">{c.phone}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender / Consignor Name *
                  </Label>
                  <Input
                    required
                    placeholder="Shipper name"
                    value={editFormData.senderName}
                    onChange={(e) => setEditFormData({ ...editFormData, senderName: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender Phone
                  </Label>
                  <Input
                    placeholder="03001234567"
                    value={editFormData.senderPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, senderPhone: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Sender Address / Location
                  </Label>
                  <Input
                    placeholder="Address / Terminal"
                    value={editFormData.senderAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, senderAddress: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Consignee / Receiver Section */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-spd-red flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Consignee / Receiver Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Receiver / Business Name *
                  </Label>
                  <Input
                    required
                    placeholder="Receiver Name / Firm"
                    value={editFormData.receiverName}
                    onChange={(e) => setEditFormData({ ...editFormData, receiverName: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Receiver Phone *
                  </Label>
                  <Input
                    required
                    placeholder="03219876543"
                    value={editFormData.receiverPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, receiverPhone: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Delivery Address / Terminal
                  </Label>
                  <Input
                    placeholder="Receiver Address"
                    value={editFormData.receiverAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, receiverAddress: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Route, Hub, Vehicle & Driver */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Route, Fleet & Driver Assignment
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Origin Station *
                  </Label>
                  <Input
                    required
                    value={editFormData.origin}
                    onChange={(e) => setEditFormData({ ...editFormData, origin: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Destination Station *
                  </Label>
                  <Input
                    required
                    value={editFormData.destination}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Warehouse Hub
                  </Label>
                  <select
                    value={editFormData.warehouse}
                    onChange={(e) => setEditFormData({ ...editFormData, warehouse: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="LAHORE">Lahore Hub</option>
                    <option value="KARACHI">Karachi Hub</option>
                  </select>
                </div>
              </div>

              {/* Driver & Vehicle Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Driver */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Assign Driver (Optional)
                    </Label>
                    {editFormData.driverId && (
                      <button
                        type="button"
                        onClick={() => handleSelectDriver(null, true)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                  <select
                    value={editFormData.driverId}
                    onChange={(e) => {
                      const d = drivers.find((drv) => drv.id === e.target.value);
                      handleSelectDriver(d, true);
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} &bull; {d.phone || d.contact} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Assign Fleet Vehicle (Optional)
                    </Label>
                    {editFormData.vehicleId && (
                      <button
                        type="button"
                        onClick={() => handleSelectVehicle(null, true)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                  <select
                    value={editFormData.vehicleId}
                    onChange={(e) => {
                      const v = vehicles.find((veh) => veh.id === e.target.value);
                      handleSelectVehicle(v, true);
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="">-- No Vehicle Assigned --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.model || v.vehicleType}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conflict Warning Banner */}
              {(() => {
                const regVeh = getDriverAssignedVehicle(editFormData.driverId);
                const hasConflict = !!(
                  editFormData.driverId &&
                  editFormData.vehicleNumber &&
                  regVeh &&
                  editFormData.vehicleNumber.toLowerCase().replace(/[-\s]/g, "") !==
                    regVeh.toLowerCase().replace(/[-\s]/g, "")
                );
                if (!hasConflict) return null;
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Driver + Vehicle Assignment Conflict</p>
                      <p className="mt-0.5 text-[11px]">
                        Driver <strong>{editFormData.driverName}</strong> is registered with vehicle{" "}
                        <strong>{regVeh}</strong>, but vehicle <strong>{editFormData.vehicleNumber}</strong> is currently
                        selected.
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const matchingVeh = vehicles.find(
                              (v) =>
                                v.vehicleNumber.toLowerCase().replace(/[-\s]/g, "") ===
                                regVeh.toLowerCase().replace(/[-\s]/g, "")
                            );
                            if (matchingVeh) handleSelectVehicle(matchingVeh, true);
                            else setEditFormData({ ...editFormData, vehicleNumber: regVeh });
                          }}
                          className="font-bold underline text-amber-900 dark:text-amber-200 hover:text-black text-[11px]"
                        >
                          Switch to driver&apos;s registered vehicle ({regVeh})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 4. Cargo / Package Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Cargo & Package Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Package Details / Goods Description *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. 50 Cartons Cotton Yarn / Auto Parts"
                    value={editFormData.packageDetails}
                    onChange={(e) => setEditFormData({ ...editFormData, packageDetails: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Quantity / Packages
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Total Weight (KG)
                  </Label>
                  <Input
                    type="number"
                    value={editFormData.weight}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    CPM / Dimensions (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. 2.4 CBM"
                    value={editFormData.cpm}
                    onChange={(e) => setEditFormData({ ...editFormData, cpm: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Special Instructions / Notes
                  </Label>
                  <Input
                    placeholder="Handle with care / Fragile"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 5. Financials & Calculation */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Financial Calculation
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Payment: {editPaymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Base Freight (PKR) *
                  </Label>
                  <Input
                    required
                    type="number"
                    value={editFormData.freight}
                    onChange={(e) => setEditFormData({ ...editFormData, freight: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Labor / Additional
                  </Label>
                  <Input
                    type="number"
                    value={editFormData.additionalCharges}
                    onChange={(e) => setEditFormData({ ...editFormData, additionalCharges: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Discount (PKR)
                  </Label>
                  <Input
                    type="number"
                    value={editFormData.discount}
                    onChange={(e) => setEditFormData({ ...editFormData, discount: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Advance Paid (PKR)
                  </Label>
                  <Input
                    type="number"
                    value={editFormData.paidAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, paidAmount: e.target.value })}
                    className="rounded-xl h-9 text-xs border-emerald-300 dark:border-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Net Total Amount:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(editTotalAmount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    Remaining Balance:
                  </span>
                  <span className="font-black text-sm text-amber-700 dark:text-amber-400">
                    {formatCurrency(editRemainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditBiltyOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                <span>Update Consignment Bilty</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: PRINTABLE BILTY VOUCHER */}
      <Dialog open={!!printBilty} onOpenChange={() => setPrintBilty(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b pb-3 mb-4 print:hidden">
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">Consignment Bilty Voucher</p>
              <p className="text-xs text-slate-400">Official goods transport voucher for dispatch & delivery</p>
            </div>
            <Button
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Consignment Voucher</span>
            </Button>
          </div>

          {/* PRINTABLE AREA */}
          <div id="printable-bilty" className="p-6 border-2 border-slate-900 rounded-xl bg-white text-black space-y-4 font-sans text-xs">
            {/* Voucher Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/spd-logo.jpg"
                  alt="SPD Logistics"
                  className="h-14 w-auto object-contain rounded border border-slate-300"
                />
                <div>
                  <h2 className="text-xl font-black tracking-tight text-red-600">
                    SUPER PAK DATA GOODS TRANSPORT CO.
                  </h2>
                  <p className="text-[11px] font-bold text-blue-900 uppercase">
                    SPD Logistics &bull; Nationwide Cargo & Highway Transport &bull; Est. 1996
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Main Head Office: Bhati Gate Transport Center, Lahore &bull; Karachi Port Terminal
                  </p>
                </div>
              </div>
              <div className="text-right border-2 border-red-600 p-2 rounded-lg bg-red-50">
                <p className="text-[10px] font-bold uppercase text-red-600">BILTY NUMBER</p>
                <p className="text-sm font-black text-red-700">{printBilty?.biltyNumber}</p>
                <p className="text-[9px] font-mono text-slate-700 mt-0.5">TRK: {printBilty?.trackingId}</p>
              </div>
            </div>

            {/* Meta Row */}
            <div className="grid grid-cols-4 gap-2 border-b pb-3 font-semibold text-[11px]">
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Booking Date</span>
                <span>{printBilty ? formatDate(printBilty.date) : ""}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Origin</span>
                <span className="font-bold">{printBilty?.origin}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Destination</span>
                <span className="font-bold">{printBilty?.destination}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] block">Warehouse Hub</span>
                <span className="font-bold text-red-600">{printBilty?.warehouse}</span>
              </div>
            </div>

            {/* Sender / Receiver Boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-300 rounded-lg">
                <p className="font-bold uppercase text-[10px] text-blue-900 border-b pb-1 mb-1">
                  Shipper / Consignor Details
                </p>
                <p className="font-bold text-xs">{printBilty?.senderName}</p>
                <p className="text-[11px]">{printBilty?.senderPhone || "No phone"}</p>
                <p className="text-[10px] text-slate-600">{printBilty?.senderAddress || "Lahore Station"}</p>
              </div>

              <div className="p-3 border border-slate-300 rounded-lg">
                <p className="font-bold uppercase text-[10px] text-red-600 border-b pb-1 mb-1">
                  Consignee / Receiver Details
                </p>
                <p className="font-bold text-xs">{printBilty?.receiverName}</p>
                <p className="text-[11px]">{printBilty?.receiverPhone || "No phone"}</p>
                <p className="text-[10px] text-slate-600">{printBilty?.receiverAddress || "Karachi Station"}</p>
              </div>
            </div>

            {/* Fleet & Package Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase border-b">
                  <tr>
                    <th className="p-2 border-r">Package Description</th>
                    <th className="p-2 border-r">Quantity</th>
                    <th className="p-2 border-r">Weight (KG)</th>
                    <th className="p-2 border-r">Vehicle #</th>
                    <th className="p-2">Driver Name</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr>
                    <td className="p-2 border-r font-semibold">{printBilty?.packageDetails}</td>
                    <td className="p-2 border-r font-bold">{printBilty?.quantity}</td>
                    <td className="p-2 border-r font-bold">{printBilty?.weight || "N/A"}</td>
                    <td className="p-2 border-r font-mono font-bold">{printBilty?.vehicleNumber || "Pending"}</td>
                    <td className="p-2 font-bold">{printBilty?.driverName || "Pending"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Charges Breakdown */}
            <div className="flex justify-end">
              <div className="w-72 border border-slate-300 rounded-lg p-3 space-y-1.5 bg-slate-50 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Freight:</span>
                  <span className="font-bold">{formatCurrency(printBilty?.freight || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Labor / Additional:</span>
                  <span>{formatCurrency(printBilty?.additionalCharges || 0)}</span>
                </div>
                {printBilty?.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(printBilty.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(printBilty?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(printBilty?.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-red-600">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(printBilty?.remainingBalance || 0)}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Stamp */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-[10px]">
              <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                Shipper Signature
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1 font-bold">
                Driver / Dispatcher Signature
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1 font-bold text-red-600">
                Official SPD Logistics Stamp
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: UPDATE SHIPMENT STATUS */}
      <Dialog open={!!statusModalBilty} onOpenChange={() => setStatusModalBilty(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-spd-blue" />
              Update Shipment Status & Tracking
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update status for Bilty: {statusModalBilty?.biltyNumber} ({statusModalBilty?.origin} &rarr; {statusModalBilty?.destination}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Shipment Status
              </Label>
              <select
                value={statusUpdate.shipmentStatus}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, shipmentStatus: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="BOOKED">Booked</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED_AT_DESTINATION">Arrived at Destination</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="DELIVERY_FAILED">Delivery Failed</option>
                <option value="RETURNED">Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Checkpoint Location
              </Label>
              <Input
                placeholder="e.g. Sukkur Toll Plaza / Multan Bypass / Karachi Hub"
                value={statusUpdate.location}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            {statusUpdate.shipmentStatus === "DELIVERED" && (
              <div className="space-y-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Delivery Confirmation
                </p>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Received By (Name / Stamp)
                  </Label>
                  <Input
                    required
                    placeholder="Receiver person name"
                    value={statusUpdate.receivedBy}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, receivedBy: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Status Notes / Remarks (Optional)
              </Label>
              <Input
                placeholder="Remarks regarding package condition or transit update"
                value={statusUpdate.statusNote}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, statusNote: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusModalBilty(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Status & Track"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: VIEW SHIPMENT DETAILS & CONTACTS (DRIVER & CUSTOMER) */}
      <Dialog open={!!viewDetailsBilty} onOpenChange={() => setViewDetailsBilty(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-spd-red" />
                Shipment Details &bull; {viewDetailsBilty?.biltyNumber}
              </DialogTitle>
              <span className="text-xs font-mono font-bold bg-blue-50 text-spd-blue px-2.5 py-1 rounded-full border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800">
                TRK: {viewDetailsBilty?.trackingId}
              </span>
            </div>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Route: {viewDetailsBilty?.origin} &rarr; {viewDetailsBilty?.destination} &bull; Hub: {viewDetailsBilty?.warehouse || "LAHORE"}
            </DialogDescription>
          </DialogHeader>

          {viewDetailsBilty && (() => {
            const driverPhone = viewDetailsBilty.driver?.phone || viewDetailsBilty.driver?.contact || "";
            const receiverPhone = viewDetailsBilty.receiver?.whatsapp || viewDetailsBilty.receiverPhone || viewDetailsBilty.receiver?.phone || "";
            const senderPhone = viewDetailsBilty.sender?.whatsapp || viewDetailsBilty.senderPhone || viewDetailsBilty.sender?.phone || "";

            const trackingMsg = getBiltyTrackingWhatsAppMessage({
              biltyNumber: viewDetailsBilty.biltyNumber,
              trackingId: viewDetailsBilty.trackingId,
              status: viewDetailsBilty.shipmentStatus,
              origin: viewDetailsBilty.origin,
              destination: viewDetailsBilty.destination,
            });

            const driverMsg = getAdminToDriverWhatsAppMessage({
              driverName: viewDetailsBilty.driver?.name || viewDetailsBilty.driverName,
            });

            return (
              <div className="space-y-5 pt-2 text-xs">
                {/* 1. Driver & Vehicle Information (Section 12) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-spd-blue" />
                      Assigned Driver & Vehicle
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Fleet Operations</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Driver Name</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {viewDetailsBilty.driver?.name || viewDetailsBilty.driverName || "No Driver Assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Driver Phone</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {driverPhone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Vehicle Number</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {viewDetailsBilty.vehicle?.vehicleNumber || viewDetailsBilty.vehicleNumber || "No Vehicle Assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned Vehicle Type</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {viewDetailsBilty.vehicle?.vehicleType || "Commercial Fleet Vehicle"}
                      </p>
                    </div>
                  </div>

                  {driverPhone && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <a
                        href={`tel:${driverPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Driver</span>
                      </a>
                      <a
                        href={buildWhatsAppUrl(driverPhone, driverMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Driver</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Customer Contact & Consignee Details */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Customer & Consignee Contact
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Consignee (Receiver)</p>
                      <p className="font-bold text-slate-900 dark:text-white">{viewDetailsBilty.receiverName || "Walk-in Consignee"}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Phone: <strong>{receiverPhone || "N/A"}</strong></p>
                      {viewDetailsBilty.receiverAddress && (
                        <p className="text-[10px] text-slate-500">Address: {viewDetailsBilty.receiverAddress}</p>
                      )}
                      {receiverPhone && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <a
                            href={`tel:${receiverPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" /> Call
                          </a>
                          <a
                            href={buildWhatsAppUrl(receiverPhone, trackingMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Shipper (Sender)</p>
                      <p className="font-bold text-slate-900 dark:text-white">{viewDetailsBilty.senderName || "Walk-in Shipper"}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Phone: <strong>{senderPhone || "N/A"}</strong></p>
                      {viewDetailsBilty.senderAddress && (
                        <p className="text-[10px] text-slate-500">Address: {viewDetailsBilty.senderAddress}</p>
                      )}
                      {senderPhone && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <a
                            href={`tel:${senderPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" /> Call
                          </a>
                          <a
                            href={buildWhatsAppUrl(senderPhone, trackingMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Tracking Event History (Section 8) */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Chronological Tracking History ({viewDetailsBilty.trackingEvents?.length || 0} events)
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto space-y-2.5">
                    {viewDetailsBilty.trackingEvents?.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No tracking history events recorded yet.</p>
                    ) : (
                      viewDetailsBilty.trackingEvents?.map((ev: any) => (
                        <div key={ev.id} className="p-2 bg-white dark:bg-slate-900 rounded-lg border text-[11px] flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{ev.status?.replace(/_/g, " ")}</span>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5">{ev.description}</p>
                            {ev.location && (
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-spd-red" /> {ev.location}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDate(ev.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="mt-4 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const b = viewDetailsBilty;
                setViewDetailsBilty(null);
                setPrintBilty(b);
              }}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Voucher
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewDetailsBilty(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: 2-STEP DELETE BILTY CONFIRMATION */}
      <Dialog
        open={deleteStep > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteStep(0);
            setDeletingBilty(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
          {deleteStep === 1 && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Are you sure you want to delete this Bilty?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 pt-1">
                  You are about to remove this consignment bilty from active logistics operations.
                </DialogDescription>
              </DialogHeader>

              {deletingBilty && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Bilty Number:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {deletingBilty.biltyNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Tracking ID:</span>
                    <span className="font-mono font-bold text-spd-blue">
                      {deletingBilty.trackingId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Route:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {deletingBilty.origin} → {deletingBilty.destination}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Consignee:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {deletingBilty.receiverName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Total Freight:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(deletingBilty.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Notice: Deleting this bilty removes it from active dispatch lists, customer/driver tracking, and frees any assigned vehicle or driver. Foreign accounting ledgers remain preserved for audit compliance.
              </p>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteStep(0);
                    setDeletingBilty(null);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteStep(2)}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteStep === 2 && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <DialogTitle className="text-lg font-black text-red-600 dark:text-red-400">
                  Confirm Bilty Deletion
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 pt-1">
                  Final confirmation required before permanent removal.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-3">
                <div className="text-xs text-red-900 dark:text-red-200 font-medium">
                  Are you absolutely sure you want to delete this Bilty?
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-red-100 dark:border-red-950 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Bilty Number:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {deletingBilty?.biltyNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Tracking ID:</span>
                    <span className="font-mono font-bold text-spd-red">
                      {deletingBilty?.trackingId}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-400">
                  This action cannot be undone. Bilty {deletingBilty?.biltyNumber} will be marked as DELETED and excluded from all operational lists.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteLoading}
                  onClick={() => setDeleteStep(1)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteLoading}
                  onClick={handleConfirmDelete}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-md"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Bilty</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

