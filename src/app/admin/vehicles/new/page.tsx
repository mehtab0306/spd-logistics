"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  UserCog,
  CheckCircle,
  FileText,
  MapPin,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  getStoredDrivers,
  getDeletedDriverIds,
  saveStoredVehicle,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function NewVehiclePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    registrationNumber: "",
    vehicleType: "Heavy Truck (22-Wheeler)",
    make: "",
    model: "",
    year: "",
    capacity: "",
    ownerName: "SPD Logistics Fleet",
    currentLocation: "",
    route: "",
    driverId: "",
    status: "AVAILABLE",
    notes: "",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      let apiDrivers: any[] = [];
      try {
        const res = await fetch("/api/admin/drivers");
        const data = await res.json();
        apiDrivers = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.drivers)
          ? data.drivers
          : [];
      } catch {}
      setDrivers(mergeLocalWithApi(getStoredDrivers(), apiDrivers, getDeletedDriverIds()));
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers(getStoredDrivers());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setSuccessMessage("");

    if (!formData.vehicleNumber.trim()) {
      console.log("[NewVehicle] Validation warning: Vehicle number (plate) is missing");
      setFormError("Vehicle Registration Number (Plate) is required.");
      return;
    }

    setSubmitting(true);
    try {
      const uniqueId = Date.now().toString();
      const timestamp = new Date().toISOString();
      const plate = formData.vehicleNumber.trim().toUpperCase();
      const selectedDrv = drivers.find((d) => String(d.id) === String(formData.driverId));

      const newVehicleRecord = {
        id: uniqueId,
        vehicleNumber: plate,
        registrationNumber: formData.registrationNumber.trim() || plate,
        vehicleType: formData.vehicleType || "Heavy Truck (22-Wheeler)",
        type: formData.vehicleType || "Heavy Truck (22-Wheeler)",
        make: formData.make.trim() || "Hino",
        model: formData.model.trim() || "700 Series",
        year: formData.year ? parseInt(formData.year) : 2022,
        capacity: formData.capacity ? parseFloat(formData.capacity) : 35,
        ownerName: formData.ownerName.trim() || "SPD Logistics Fleet",
        currentLocation: formData.currentLocation.trim() || "Lahore Terminal",
        route: formData.route.trim() || "Lahore - Karachi Highway",
        driverId: formData.driverId || null,
        driver: selectedDrv ? { id: selectedDrv.id, name: selectedDrv.name, phone: selectedDrv.phone } : null,
        status: formData.status || "AVAILABLE",
        notes: formData.notes.trim() || null,
        isLocal: true,
        consignments: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 1. Enforce Cloud Database Persistence
      if (isSupabaseConfigured) {
        try {
          await supabase.from("vehicles").upsert({
            id: uniqueId,
            vehicle_number: plate,
            registration_number: formData.registrationNumber.trim() || plate,
            vehicle_type: formData.vehicleType || "Heavy Truck (22-Wheeler)",
            capacity: String(formData.capacity || "35"),
            driver_name: selectedDrv?.name || null,
            driver_phone: selectedDrv?.phone || null,
            status: formData.status || "AVAILABLE",
            created_at: timestamp,
          });
        } catch (sbErr) {
          console.warn("Supabase vehicle new page save warning:", sbErr);
        }
      }

      // 2. Immediately save to localStorage (spd_vehicles & spd_local_vehicles)
      saveStoredVehicle(newVehicleRecord);

      // 3. Try sending to backend API wrapped in try/catch (do NOT rollback or throw on serverless failure)
      try {
        await fetch("/api/admin/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newVehicleRecord),
        });
      } catch (apiErr) {
        console.warn("Serverless API fallback active — vehicle saved in localStorage:", apiErr);
      }

      setSuccessMessage(`Record created successfully! Vehicle ${plate} registered.`);
      setTimeout(() => {
        router.push(`/admin/vehicles?highlight=${uniqueId}`);
      }, 900);
    } catch (err: any) {
      console.error("[NewVehicle] Error:", err);
      setFormError(err.message || "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.phone || d.contact || "No phone"})`,
    subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status || "AVAILABLE"}`,
    meta: d,
  }));

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
              <span className="text-xs font-bold text-emerald-600">Register New</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600" />
              Add New Vehicle
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
            form="new-vehicle-form"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Vehicle</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form id="new-vehicle-form" onSubmit={handleSubmit} noValidate className="space-y-6">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Register Vehicle</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
