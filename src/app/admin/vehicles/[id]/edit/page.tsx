"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Truck,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  getStoredVehicles,
  saveStoredVehicle,
  getStoredDrivers,
  getDeletedDriverIds,
  mergeLocalWithApi,
} from "@/lib/local-persistence";

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    vehicleNumber: "",
    registrationNumber: "",
    vehicleType: "Heavy Truck (22-Wheeler)",
    make: "",
    model: "",
    year: "",
    capacity: "",
    ownerName: "",
    currentLocation: "",
    route: "",
    driverId: "",
    status: "AVAILABLE",
    notes: "",
  });

  useEffect(() => {
    if (vehicleId) {
      Promise.all([fetchVehicle(), fetchDrivers()]).finally(() => setLoading(false));
    }
  }, [vehicleId]);

  const fetchDrivers = async () => {
    const localDrv = getStoredDrivers();
    const deletedDrv = getDeletedDriverIds();
    if (localDrv.length > 0) setDrivers(localDrv);
    try {
      const res = await fetch("/api/admin/drivers");
      const data = await res.json();
      if (data.drivers) {
        setDrivers(
          mergeLocalWithApi(localDrv, data.drivers, deletedDrv, "cnic")
        );
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const fetchVehicle = async () => {
    const localVeh = getStoredVehicles();
    const localFound = localVeh.find((v: any) => v.id === vehicleId);
    if (localFound) {
      setFormData({
        id: localFound.id,
        vehicleNumber: localFound.vehicleNumber || localFound.registrationNumber || "",
        registrationNumber: localFound.registrationNumber || "",
        vehicleType: localFound.type || localFound.vehicleType || "Heavy Truck (22-Wheeler)",
        make: localFound.make || "",
        model: localFound.model || "",
        year: localFound.year ? String(localFound.year) : "",
        capacity: localFound.capacity ? String(localFound.capacity) : "",
        ownerName: localFound.ownerName || "",
        currentLocation: localFound.currentLocation || "",
        route: localFound.route || "",
        driverId: localFound.driverId || "",
        status: localFound.status || "AVAILABLE",
        notes: localFound.notes || "",
      });
    }

    try {
      const res = await fetch("/api/admin/vehicles");
      const data = await res.json();
      if (data.vehicles && !localFound) {
        const found = data.vehicles.find((v: any) => v.id === vehicleId);
        if (found) {
          setFormData({
            id: found.id,
            vehicleNumber: found.vehicleNumber || found.registrationNumber || "",
            registrationNumber: found.registrationNumber || "",
            vehicleType: found.type || found.vehicleType || "Heavy Truck (22-Wheeler)",
            make: found.make || "",
            model: found.model || "",
            year: found.year ? String(found.year) : "",
            capacity: found.capacity ? String(found.capacity) : "",
            ownerName: found.ownerName || "",
            currentLocation: found.currentLocation || "",
            route: found.route || "",
            driverId: found.driverId || "",
            status: found.status || "AVAILABLE",
            notes: found.notes || "",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching vehicle:", err);
      if (!localFound) setFormError("Failed to load vehicle details.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.vehicleNumber.trim()) {
      setFormError("Vehicle number (plate) is required.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedDriver = drivers.find((d: any) => d.id === formData.driverId) || null;
      const payload = {
        id: vehicleId,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        registrationNumber: formData.registrationNumber.trim() || formData.vehicleNumber.trim().toUpperCase(),
        vehicleType: formData.vehicleType,
        type: formData.vehicleType,
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year) : null,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
        ownerName: formData.ownerName.trim(),
        currentLocation: formData.currentLocation.trim(),
        route: formData.route.trim(),
        driverId: formData.driverId || null,
        driver: selectedDriver,
        status: formData.status,
        notes: formData.notes.trim(),
      };

      // Save immediately to localStorage
      saveStoredVehicle(payload);

      try {
        await fetch("/api/admin/vehicles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (apiErr) {
        console.warn("Serverless PUT vehicle fallback to localStorage:", apiErr);
      }

      setFormSuccess("Record created successfully!");
      setTimeout(() => {
        router.push("/admin/vehicles");
      }, 500);
    } catch (err: any) {
      setFormError(err.message || "Failed to update vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.phone || d.contact || "No phone"})`,
    subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status}`,
    meta: d,
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading vehicle details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/vehicles">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fleet Management
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-blue-600">Edit Vehicle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" />
              Edit Vehicle: {formData.vehicleNumber}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/vehicles">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-vehicle-form"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      <form id="edit-vehicle-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identification & Registration */}
        <FormSectionCard
          title="Vehicle Identification & Registration"
          badge="Registration"
          description="Official registration plate, registration certificate number, ownership, and classification"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Vehicle Registration Number (Plate) *
            </Label>
            <Input
              required
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Registration Book / Chassis Number
            </Label>
            <Input
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Vehicle Type *
            </Label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="Heavy Truck (22-Wheeler)">Heavy Truck (22-Wheeler)</option>
              <option value="Flatbed Trailer">Flatbed Trailer</option>
              <option value="Container Carrier">Container Carrier</option>
              <option value="10-Wheeler Truck">10-Wheeler Truck</option>
              <option value="Mazda / Light Commercial">Mazda / Light Commercial</option>
              <option value="Pickup / Van">Pickup / Van</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Fleet / Owner Name
            </Label>
            <Input
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Section 2: Technical Specifications & Capacity */}
        <FormSectionCard
          title="Specifications & Capacity"
          badge="Specs"
          description="Make, model, manufacturing year, and tonnage payload capacity"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Vehicle Make / Brand
            </Label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Model Series
            </Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Manufacturing Year
            </Label>
            <Input
              type="number"
              min="1980"
              max="2035"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Max Payload Capacity (Tons)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Section 3: Driver & Route Assignment */}
        <FormSectionCard
          title="Driver & Route Assignment"
          badge="Operations"
          description="Assign permanent driver, default operational corridor, and current terminal"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Driver
            </Label>
            <SearchableSelect
              options={driverOptions}
              value={formData.driverId}
              onChange={(val) => setFormData({ ...formData, driverId: val })}
              placeholder=""
              emptyMessage="No drivers registered"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Current Terminal / Hub
            </Label>
            <Input
              value={formData.currentLocation}
              onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Primary Highway Route
            </Label>
            <Input
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Fleet Status
            </Label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Operational Notes
            </Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/admin/vehicles">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Vehicle Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
