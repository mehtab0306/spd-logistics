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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
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

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/vehicles?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers");
      const data = await res.json();
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
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
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add vehicle");
      }

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
      fetchVehicles();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
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
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search vehicle #, model, route, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
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
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
          <Table>
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
                <TableRow key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-spd-blue" />
              Register New Fleet Vehicle
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register commercial vehicle, set tonnage capacity, assign route, and link fleet driver.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateVehicle} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Vehicle Number / Registration Plate *
                </Label>
                <Input
                  required
                  placeholder="e.g. LES-8899 / KHI-4422"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Vehicle Category / Type
                </Label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="Heavy Truck (22-Wheeler)">Heavy Truck (22-Wheeler)</option>
                  <option value="10-Wheeler Truck">10-Wheeler Truck</option>
                  <option value="6-Wheeler Mazda">6-Wheeler Mazda</option>
                  <option value="Container Trailer (40ft)">Container Trailer (40ft)</option>
                  <option value="Flatbed Carrier">Flatbed Carrier</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Make & Model
                </Label>
                <Input
                  placeholder="e.g. Hino 700 / Isuzu Giga"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Cargo Capacity (Metric Tons)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 35"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Current Hub / Location
                </Label>
                <Input
                  placeholder="Lahore Terminal Hub"
                  value={formData.currentLocation}
                  onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Designated Highway Route
                </Label>
                <Input
                  placeholder="Lahore - Karachi Express Highway"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Assign Driver
                </Label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="">No Driver Assigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} &bull; {d.phone || d.contact}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Fleet Status
                </Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Add Vehicle</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
          <DialogHeader className="border-b pb-4 shrink-0">
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

          {/* Consignments List */}
          <div className="flex-1 overflow-y-auto pt-2">
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
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Bilty # / Date</TableHead>
                      <TableHead className="text-xs font-bold">Route</TableHead>
                      <TableHead className="text-xs font-bold">Sender / Receiver</TableHead>
                      <TableHead className="text-xs font-bold">Driver</TableHead>
                      <TableHead className="text-xs font-bold">Weight / Pkgs</TableHead>
                      <TableHead className="text-xs font-bold">Freight</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((c: any) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell>
                          <p className="text-xs font-black text-spd-blue">{c.biltyNumber}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(c.date)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {c.origin} &rarr; {c.destination}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.warehouse}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{c.senderName}</p>
                          <p className="text-[10px] text-slate-400">To: {c.receiverName}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {c.driverName || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.weight ? `${c.weight} kg` : "N/A"}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.quantity} pkgs</p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
