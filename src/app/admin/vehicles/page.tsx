"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Truck,
  Plus,
  Search,
  MapPin,
  UserCog,
  RefreshCw,
  Loader2,
  Calendar,
  FileText,
  Package,
  Trash2,
  AlertTriangle,
  Printer,
  Phone,
  Edit,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import {
  getStoredVehicles,
  saveStoredVehicle,
  removeStoredVehicle,
  getDeletedVehicleIds as getStoredDeletedVehicleIds,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredBilties,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(vehicles);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteVehicle, setDeleteVehicle] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    registrationNumber: "",
    vehicleType: "Heavy Truck (22-Wheeler)",
    make: "Hino",
    model: "700 Series",
    year: "2022",
    capacity: "35",
    ownerName: "SPD Logistics Fleet",
    currentLocation: "Lahore Terminal",
    route: "Lahore - Karachi Highway",
    driverId: "",
    status: "AVAILABLE",
    notes: "",
  });

  const getLocalVehicles = (): any[] => {
    return getStoredVehicles();
  };

  const getDeletedVehicleIds = (): string[] => {
    return getStoredDeletedVehicleIds();
  };

  const saveLocalVehicle = (v: any) => {
    saveStoredVehicle(v);
  };

  const removeLocalVehicle = (id: string, vehicleNumber?: string) => {
    removeStoredVehicle(id);
    if (vehicleNumber) removeStoredVehicle(vehicleNumber);
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      let apiList: any[] = [];
      try {
        const res = await fetch(`/api/admin/vehicles?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          apiList = data.data;
        }
      } catch (err) {
        console.warn("API vehicle fetch error:", err);
      }

      // Merge local vehicles (kept at top) with API seed vehicles
      const localList = getLocalVehicles();
      const deletedIds = getDeletedVehicleIds();
      let list = mergeLocalWithApi(localList, apiList, deletedIds, "vehicleNumber").filter(
        (v) => !deletedIds.includes(v.vehicleNumber)
      );

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (v) =>
            v.vehicleNumber?.toLowerCase().includes(q) ||
            v.registrationNumber?.toLowerCase().includes(q) ||
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            v.ownerName?.toLowerCase().includes(q) ||
            v.driver?.name?.toLowerCase().includes(q)
        );
      }
      if (statusFilter) {
        list = list.filter((v) => v.status === statusFilter);
      }

      // Dynamically link created and local bilties to vehicles
      const allBilties = getStoredBilties();

      for (const v of list) {
        const vNumNorm = (v.vehicleNumber || v.registrationNumber || "").toLowerCase().replace(/[\s-]/g, "");
        const matched = allBilties.filter((b: any) => {
          const bVNumNorm = (b.vehicleNumber || b.vehicle?.vehicleNumber || "").toLowerCase().replace(/[\s-]/g, "");
          const matchVNum = bVNumNorm && vNumNorm && (bVNumNorm === vNumNorm || bVNumNorm.includes(vNumNorm) || vNumNorm.includes(bVNumNorm));
          const matchVId = b.vehicleId && String(b.vehicleId) === String(v.id);
          const matchDriver = (v.driverId && String(b.driverId) === String(v.driverId)) || (v.driver?.name && b.driverName?.toLowerCase() === v.driver.name.toLowerCase());
          return matchVNum || matchVId || matchDriver;
        });

        const existing = Array.isArray(v.consignments) ? v.consignments : [];
        const combined = [...existing];
        for (const m of matched) {
          if (!combined.some((c: any) => c.id === m.id || c.biltyNumber === m.biltyNumber)) {
            combined.unshift(m);
          }
        }

        v.consignments = combined;
      }

      setVehicles(list);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicle) return;
    setDeleting(true);
    try {
      removeLocalVehicle(deleteVehicle.id, deleteVehicle.vehicleNumber);
      setVehicles((prev) =>
        prev.filter((v) => v.id !== deleteVehicle.id && v.vehicleNumber !== deleteVehicle.vehicleNumber)
      );

      if (selectedVehicle?.id === deleteVehicle.id || selectedVehicle?.vehicleNumber === deleteVehicle.vehicleNumber) {
        setSelectedVehicle(null);
      }

      fetch(`/api/admin/vehicles?id=${deleteVehicle.id}`, {
        method: "DELETE",
      }).catch(() => {});

      setActionFeedback({
        type: "success",
        text: `Vehicle ${deleteVehicle.vehicleNumber} deleted successfully from fleet.`,
      });
      setDeleteVehicle(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({ type: "error", text: "Unable to delete vehicle." });
    } finally {
      setDeleting(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      let apiDrivers: any[] = [];
      try {
        const res = await fetch("/api/admin/drivers");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          apiDrivers = data.data;
        }
      } catch {}
      setDrivers(mergeLocalWithApi(getStoredDrivers(), apiDrivers, getDeletedDriverIds()));
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers(getStoredDrivers());
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, [search, statusFilter]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const assignedDriver = drivers.find((d) => d.id === formData.driverId);
      const newVeh = {
        id: `v_loc_${Date.now()}`,
        vehicleNumber: formData.vehicleNumber.trim(),
        registrationNumber: formData.registrationNumber.trim() || `REG-${formData.vehicleNumber.trim()}`,
        vehicleType: formData.vehicleType,
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : 2022,
        capacity: formData.capacity ? parseFloat(formData.capacity) : 35,
        ownerName: formData.ownerName,
        currentLocation: formData.currentLocation,
        route: formData.route,
        status: formData.status,
        driver: assignedDriver ? { id: assignedDriver.id, name: assignedDriver.name, phone: assignedDriver.phone } : null,
        consignments: [],
        _count: { consignments: 0 },
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage immediately
      saveLocalVehicle(newVeh);

      // Prepend to vehicles state immediately
      setVehicles((prev) => [newVeh, ...prev]);

      // Fire background API call
      fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).catch((err) => console.warn("Background vehicle API save:", err));

      setAddModalOpen(false);
      setFormData({
        vehicleNumber: "",
        registrationNumber: "",
        vehicleType: "Heavy Truck (22-Wheeler)",
        make: "Hino",
        model: "700 Series",
        year: "2022",
        capacity: "35",
        ownerName: "SPD Logistics Fleet",
        currentLocation: "Lahore Terminal",
        route: "Lahore - Karachi Highway",
        driverId: "",
        status: "AVAILABLE",
        notes: "",
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to add vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    if (!vehicles.length) return;
    const data = vehicles.map((v) => ({
      "Vehicle #": v.vehicleNumber || "",
      "Registration #": v.registrationNumber || "",
      "Type": v.vehicleType || "",
      "Make & Model": `${v.make || ""} ${v.model || ""}`.trim(),
      "Year": v.year || "",
      "Capacity (Tons)": v.capacity || "",
      "Owner / Fleet": v.ownerName || "",
      "Current Location": v.currentLocation || "",
      "Route": v.route || "",
      "Assigned Driver": v.driver?.name || v.driverName || "-",
      "Status": v.status || "AVAILABLE",
      "Notes": v.notes || "",
    }));
    exportToExcel(data, "SPD_Fleet_Vehicles");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Fleet Vehicles & Transport Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage heavy cargo trucks, trailers, container carriers, driver assignments, and routes.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!vehicles.length}
            className="w-full sm:w-auto rounded-xl bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold gap-2 h-10 px-4 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            onClick={() => router.push("/admin/vehicles/new")}
            className="w-full sm:w-auto bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search vehicle #, model, route, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchVehicles}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vehicles Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-blue" />
          <p className="text-xs text-slate-400 font-semibold">Loading fleet vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No vehicles registered"
          description="Register your first transport truck or trailer to assign consignments."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Plate / Number</TableHead>
                <TableHead className="text-xs font-bold">Type & Model</TableHead>
                <TableHead className="text-xs font-bold">Capacity</TableHead>
                <TableHead className="text-xs font-bold">Assigned Driver</TableHead>
                <TableHead className="text-xs font-bold">Current Hub & Route</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow
                  key={v.id}
                  id={`record-${v.id}`}
                  data-record-id={v.id}
                  className={cn(
                    "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all",
                    highlightClass(v.id) || highlightClass(v.vehicleNumber)
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center font-bold text-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-xs text-slate-900 dark:text-white">{v.vehicleNumber}</p>
                        <p className="text-[10px] text-slate-400">{v.ownerName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {v.vehicleType}
                    </p>
                    <p className="text-[10px] text-slate-400">{v.make} {v.model} ({v.year || "N/A"})</p>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                    {v.capacity ? `${v.capacity} Tons` : "N/A"}
                  </TableCell>
                  <TableCell>
                    {v.driver ? (
                      <div className="flex items-center gap-1.5">
                        <UserCog className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {v.driver.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No driver assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-spd-red" />
                        {v.currentLocation || "Lahore Terminal"}
                      </p>
                      <p className="text-[10px] text-slate-400">{v.route || "National Highway"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        v.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : v.status === "ASSIGNED" || v.status === "ON_TRIP"
                          ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVehicle(v)}
                        className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1.5 border-spd-blue/30 text-spd-blue hover:bg-spd-blue/10"
                        title="View Vehicle Account & Bilty History"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Account & Bilties</span>
                        {v.consignments?.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-spd-blue text-white font-bold">
                            {v.consignments.length}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/vehicles/${v.id}/edit`)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                        title="Edit vehicle details"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteVehicle(v)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="Delete vehicle from fleet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* VEHICLE ACCOUNT & BILTY HISTORY MODAL */}
      <Dialog
        open={!!selectedVehicle}
        onOpenChange={() => {
          setSelectedVehicle(null);
          setHistorySearch("");
          setHistoryStatusFilter("");
        }}
      >
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="border-b pb-4 shrink-0 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-spd-blue" />
                  Vehicle Account & Bilty History: {selectedVehicle?.vehicleNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  {selectedVehicle?.vehicleType} &bull; {selectedVehicle?.make || ""} {selectedVehicle?.model || ""} &bull; Capacity: {selectedVehicle?.capacity ? `${selectedVehicle.capacity} Tons` : "N/A"} &bull; Route: {selectedVehicle?.route || "Nationwide"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto ${
                    selectedVehicle?.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : selectedVehicle?.status === "ASSIGNED" || selectedVehicle?.status === "ON_TRIP"
                      ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  }`}
                >
                  {selectedVehicle?.status}
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Bilties</p>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {selectedVehicle?.consignments?.length || 0}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Delivered</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  {selectedVehicle?.consignments?.filter((c: any) => c.shipmentStatus === 'DELIVERED').length || 0}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-spd-blue dark:text-blue-400">Active / In-Transit</p>
                <p className="text-base font-black text-spd-blue dark:text-blue-300">
                  {selectedVehicle?.consignments?.filter((c: any) => c.shipmentStatus !== 'DELIVERED' && c.shipmentStatus !== 'CANCELLED').length || 0}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Total Freight</p>
                <p className="text-base font-black text-amber-700 dark:text-amber-300">
                  {formatCurrency(selectedVehicle?.consignments?.reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0) || 0)}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by Bilty #, sender, receiver, driver, route..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="BOOKING_RECEIVED">Booking Received</option>
                <option value="PICKUP_PENDING">Pickup Pending</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DRIVER_ON_THE_WAY">Driver On The Way</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </DialogHeader>

          {/* Consignments List (Screen-only) */}
          <div className="flex-1 overflow-y-auto pt-2 print:hidden">
            {(() => {
              const list = (selectedVehicle?.consignments || []).filter((c: any) => {
                const matchesSearch = !historySearch ||
                  c.biltyNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.trackingId?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.senderName?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.receiverName?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.driverName?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.origin?.toLowerCase().includes(historySearch.toLowerCase()) ||
                  c.destination?.toLowerCase().includes(historySearch.toLowerCase());
                const matchesStatus = !historyStatusFilter || c.shipmentStatus === historyStatusFilter;
                return matchesSearch && matchesStatus;
              });

              if (list.length === 0) {
                return (
                  <div className="py-12 text-center">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No consignments found</p>
                    <p className="text-xs text-slate-400 mt-0.5">This vehicle currently has no matching bilty records.</p>
                  </div>
                );
              }

              return (
                <Table className="min-w-[750px]">
                  <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Bilty #</TableHead>
                      <TableHead className="text-xs font-bold">Booking Date</TableHead>
                      <TableHead className="text-xs font-bold">Route</TableHead>
                      <TableHead className="text-xs font-bold">Customer & Consignee</TableHead>
                      <TableHead className="text-xs font-bold">Cargo & Weight</TableHead>
                      <TableHead className="text-xs font-bold">Freight</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((c: any) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell>
                          <p className="font-mono font-black text-xs text-spd-red">{c.biltyNumber}</p>
                          <p className="text-[10px] font-mono text-slate-400">{c.trackingId}</p>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(c.date)}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {c.origin} &rarr; {c.destination}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.driverName || "Assigned Driver"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{c.receiverName || "Consignee"}</p>
                          <p className="text-[10px] text-slate-400">Shipper: {c.senderName || "Valued Shipper"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.weight ? `${c.weight} kg` : "N/A"}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.quantity || 1} pkgs</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {formatCurrency(c.totalAmount || 0)}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              c.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : c.paymentStatus === 'PARTIAL'
                                ? 'bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}
                          >
                            {c.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              c.shipmentStatus === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : c.shipmentStatus === 'CANCELLED'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                : 'bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400'
                            }`}
                          >
                            {c.shipmentStatus?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>

          {/* Modal Footer (Screen-only) */}
          <DialogFooter className="border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedVehicle(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </Button>
          </DialogFooter>

          {/* DEDICATED A4 PRINTABLE LEDGER SHEET */}
          <div
            id="printable-statement"
            data-print-target="true"
            className="printable-document hidden print:block font-sans text-black p-4 space-y-3 bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/images/spd-logo.jpg"
                  alt="SPD Logistics"
                  className="h-14 w-auto object-contain rounded border border-slate-300"
                />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-red-600">
                    SUPER PAK DATA GOODS TRANSPORT CO.
                  </h1>
                  <p className="text-[11px] font-bold text-blue-900 uppercase">
                    Fleet Operations &bull; Vehicle Ledger & Bilty History Statement &bull; Est. 1996
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Central Terminal: Bhati Gate Transport Center, Lahore &bull; Karachi Port Hub &bull; 0325 2024433 / 0300 2024433
                  </p>
                </div>
              </div>
              <div className="text-right border-2 border-slate-900 p-2 rounded-lg bg-slate-50">
                <p className="text-[9px] font-bold uppercase text-slate-500">STATEMENT DATE</p>
                <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">FLEET REF: {selectedVehicle?.vehicleNumber}</p>
              </div>
            </div>

            {/* Vehicle Specifications Block */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase text-blue-900 border-b border-slate-200 pb-1 mb-2">
                Commercial Fleet Vehicle Profile
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Registration / Plate</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVehicle?.vehicleNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Type & Body</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle?.vehicleType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Make / Model / Year</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year || "N/A"})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Rated Capacity</span>
                  <span className="font-bold text-slate-900">{selectedVehicle?.capacity ? `${selectedVehicle.capacity} Tons` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Primary Highway Route</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle?.route || "Nationwide Highway"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Current Terminal Hub</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle?.currentLocation || "Lahore Central Terminal"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Assigned Driver</span>
                  <span className="font-bold text-slate-900">{selectedVehicle?.driver?.name || "Assigned Fleet Driver"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Operational Status</span>
                  <span className="font-bold uppercase text-slate-900">{selectedVehicle?.status}</span>
                </div>
              </div>
            </div>

            {/* Performance Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Consignments</span>
                <span className="text-sm font-black text-slate-900">{selectedVehicle?.consignments?.length || 0}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Delivered Trips</span>
                <span className="text-sm font-black text-emerald-700">
                  {selectedVehicle?.consignments?.filter((c: any) => c.shipmentStatus === 'DELIVERED').length || 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-blue-600 block">Active In-Transit</span>
                <span className="text-sm font-black text-blue-700">
                  {selectedVehicle?.consignments?.filter((c: any) => c.shipmentStatus !== 'DELIVERED' && c.shipmentStatus !== 'CANCELLED').length || 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-red-600 block">Total Freight Value</span>
                <span className="text-sm font-black text-red-700">
                  {formatCurrency(selectedVehicle?.consignments?.reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0) || 0)}
                </span>
              </div>
            </div>

            {/* Bilty Records Table */}
            <div>
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Consignment Bilty Records & Trip Manifest
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-1.5 text-left">Bilty #</th>
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-left">Shipper / Sender</th>
                    <th className="border border-slate-300 p-1.5 text-left">Consignee / Receiver</th>
                    <th className="border border-slate-300 p-1.5 text-left">Route</th>
                    <th className="border border-slate-300 p-1.5 text-right">Cargo</th>
                    <th className="border border-slate-300 p-1.5 text-right">Freight (PKR)</th>
                    <th className="border border-slate-300 p-1.5 text-center">Payment</th>
                    <th className="border border-slate-300 p-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedVehicle?.consignments || []).slice(0, 8).map((c: any, i: number) => (
                    <tr key={c.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-slate-300 p-1 font-mono font-bold text-red-700">{c.biltyNumber}</td>
                      <td className="border border-slate-300 p-1 whitespace-nowrap">{formatDate(c.date)}</td>
                      <td className="border border-slate-300 p-1 font-medium">{c.senderName}</td>
                      <td className="border border-slate-300 p-1 font-medium">{c.receiverName}</td>
                      <td className="border border-slate-300 p-1">{c.origin} &rarr; {c.destination}</td>
                      <td className="border border-slate-300 p-1 text-right font-medium">{c.weight ? `${c.weight} kg` : `${c.quantity || 1} pkgs`}</td>
                      <td className="border border-slate-300 p-1 text-right font-black">{formatCurrency(c.totalAmount || 0)}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold uppercase">{c.paymentStatus}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{c.shipmentStatus?.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                  {(selectedVehicle?.consignments?.length || 0) > 8 && (
                    <tr className="bg-slate-50 text-[9px] text-slate-600 italic font-medium">
                      <td colSpan={9} className="border border-slate-300 p-1 text-center">
                        (+ {(selectedVehicle?.consignments?.length || 0) - 8} additional consignments recorded in SPD Portal)
                      </td>
                    </tr>
                  )}
                  {(!selectedVehicle?.consignments || selectedVehicle.consignments.length === 0) && (
                    <tr>
                      <td colSpan={9} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                        No recent consignment history found for this vehicle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Row */}
            <div className="grid grid-cols-3 gap-8 pt-4 text-center text-xs">
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Fleet Dispatch Officer</p>
                <p className="text-[10px] text-slate-500 mt-0.5">SPD Logistics Terminal</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Vehicle Driver / Incharge</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Verified & Signed</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Accounts & Audit Department</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Official Stamp & Date</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE VEHICLE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteVehicle} onOpenChange={(open) => !open && setDeleteVehicle(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Delete Fleet Vehicle?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
              Are you sure you want to remove vehicle <span className="font-bold text-slate-900 dark:text-white">{deleteVehicle?.vehicleNumber}</span> ({deleteVehicle?.vehicleType}) from the fleet roster? This action will remove it from active assignments.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteVehicle(null)}
              disabled={deleting}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteVehicle}
              disabled={deleting}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-md shadow-rose-600/20"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
