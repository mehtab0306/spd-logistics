"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
  Truck,
  UserCog,
  MapPin,
  Calendar,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { formatCurrency } from "@/lib/utils";
import {
  getStoredCustomers,
  getDeletedCustomerIds,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  saveStoredBilty,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { PAKISTAN_CITIES } from "@/lib/constants";

export default function NewBiltyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    biltyNumber: "",
    trackingId: "",
    date: new Date().toISOString().slice(0, 10),
    warehouse: "LAHORE",
    origin: "Lahore",
    destination: "Karachi",

    customerId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",

    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",

    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",

    packageDetails: "",
    quantity: "1",
    weight: "",
    cpm: "",

    freight: "",
    additionalCharges: "",
    discount: "",
    paidAmount: "",

    shipmentStatus: "BOOKED",
    notes: "",
  });

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [custRes, drvRes, vehRes] = await Promise.all([
        fetch("/api/admin/customers").catch(() => null),
        fetch("/api/admin/drivers").catch(() => null),
        fetch("/api/admin/vehicles").catch(() => null),
      ]);

      const parseJsonSafe = async (res: Response | null) => {
        if (!res) return { data: [] };
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          return res.json().catch(() => ({ data: [] }));
        }
        return { data: [] };
      };

      const custData = await parseJsonSafe(custRes);
      const drvData = await parseJsonSafe(drvRes);
      const vehData = await parseJsonSafe(vehRes);

      const custArr = Array.isArray(custData.data) ? custData.data : Array.isArray(custData.customers) ? custData.customers : [];
      const drvArr = Array.isArray(drvData.data) ? drvData.data : Array.isArray(drvData.drivers) ? drvData.drivers : [];
      const vehArr = Array.isArray(vehData.data) ? vehData.data : Array.isArray(vehData.vehicles) ? vehData.vehicles : [];

      const mergedCustomers = mergeLocalWithApi(getStoredCustomers(), custArr, getDeletedCustomerIds());
      const mergedDrivers = mergeLocalWithApi(getStoredDrivers(), drvArr, getDeletedDriverIds());
      const mergedVehicles = mergeLocalWithApi(getStoredVehicles(), vehArr, getDeletedVehicleIds(), "registrationNumber");

      setCustomers(mergedCustomers);
      setDrivers(mergedDrivers);
      setVehicles(mergedVehicles);
    } catch (err) {
      console.error("Error loading bilty prerequisites:", err);
      setCustomers(getStoredCustomers());
      setDrivers(getStoredDrivers());
      setVehicles(getStoredVehicles());
    }
  };

  const handleCustomerSelect = (customerId: string, meta?: any) => {
    setFormData((prev) => {
      const cust = meta || customers.find((c) => String(c.id) === String(customerId));
      if (cust) {
        return {
          ...prev,
          customerId,
          senderName: cust.name || cust.companyName || prev.senderName,
          senderPhone: cust.phone || cust.whatsapp || prev.senderPhone,
          senderAddress: cust.address || prev.senderAddress,
        };
      }
      return { ...prev, customerId };
    });
  };

  const handleVehicleSelect = (vehicleId: string, meta?: any) => {
    setFormData((prev) => {
      const veh = meta || vehicles.find((v) => String(v.id) === String(vehicleId));
      if (veh) {
        let matchedDriverId = prev.driverId;
        let matchedDriverName = prev.driverName;
        const assignedDrvId = veh.driverId || veh.assignedDriverId;
        if (assignedDrvId) {
          matchedDriverId = assignedDrvId;
          const drv = drivers.find((d) => String(d.id) === String(assignedDrvId));
          if (drv) matchedDriverName = drv.name;
        }
        return {
          ...prev,
          vehicleId,
          vehicleNumber: veh.vehicleNumber || veh.registrationNumber || "",
          driverId: matchedDriverId,
          driverName: matchedDriverName,
        };
      }
      return { ...prev, vehicleId, vehicleNumber: "" };
    });
  };

  const handleDriverSelect = (driverId: string, meta?: any) => {
    setFormData((prev) => {
      const drv = meta || drivers.find((d) => String(d.id) === String(driverId));
      return {
        ...prev,
        driverId,
        driverName: drv ? drv.name : prev.driverName,
      };
    });
  };

  // Live calculations
  const freightNum = parseFloat(formData.freight) || 0;
  const addlNum = parseFloat(formData.additionalCharges) || 0;
  const discountNum = parseFloat(formData.discount) || 0;
  const paidNum = parseFloat(formData.paidAmount) || 0;

  const totalAmount = Math.max(0, freightNum + addlNum - discountNum);
  const remainingBalance = totalAmount - paidNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!formData.senderName.trim()) {
      console.log("[NewBilty] Validation warning: Sender name is missing");
      setFormError("Sender name or registered customer selection is required.");
      return;
    }
    if (!formData.receiverName.trim()) {
      console.log("[NewBilty] Validation warning: Receiver name is missing");
      setFormError("Receiver / Consignee name is required.");
      return;
    }
    if (!formData.receiverPhone.trim()) {
      console.log("[NewBilty] Validation warning: Receiver phone is missing");
      setFormError("Receiver mobile phone number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const uniqueId = Date.now().toString();
      const timestamp = new Date().toISOString();
      const year = new Date().getFullYear();
      const hubCode = formData.warehouse === "KARACHI" ? "KHI" : "LHR";

      const finalBiltyNumber =
        formData.biltyNumber.trim().toUpperCase() ||
        `SPD-${hubCode}-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalTrackingId =
        formData.trackingId.trim().toUpperCase() ||
        `SPD-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

      const paymentStatus =
        remainingBalance <= 0 && totalAmount > 0
          ? "PAID"
          : paidNum > 0
          ? "PARTIAL"
          : "UNPAID";

      const selectedCust = customers.find((c) => String(c.id) === String(formData.customerId));
      const selectedDrv = drivers.find((d) => String(d.id) === String(formData.driverId));
      const selectedVeh = vehicles.find((v) => String(v.id) === String(formData.vehicleId));

      const newBiltyRecord = {
        id: uniqueId,
        biltyNumber: finalBiltyNumber,
        trackingId: finalTrackingId,
        date: formData.date ? new Date(formData.date).toISOString() : timestamp,
        warehouse: formData.warehouse || "LAHORE",
        origin: formData.origin || "Lahore",
        destination: formData.destination || "Karachi",
        customerId: formData.customerId || null,
        customer: selectedCust ? { id: selectedCust.id, name: selectedCust.name, companyName: selectedCust.companyName } : null,
        senderName: formData.senderName.trim(),
        senderPhone: formData.senderPhone.trim() || "0300-0000000",
        senderAddress: formData.senderAddress.trim() || `${formData.origin}, Pakistan`,
        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        receiverAddress: formData.receiverAddress.trim() || `${formData.destination}, Pakistan`,
        vehicleId: formData.vehicleId || null,
        vehicleNumber: formData.vehicleNumber || selectedVeh?.registrationNumber || selectedVeh?.vehicleNumber || null,
        vehicle: selectedVeh
          ? {
              id: selectedVeh.id,
              registrationNumber: selectedVeh.registrationNumber || selectedVeh.vehicleNumber,
              vehicleNumber: selectedVeh.vehicleNumber || selectedVeh.registrationNumber,
              type: selectedVeh.type || selectedVeh.make,
            }
          : null,
        driverId: formData.driverId || null,
        driverName: formData.driverName || selectedDrv?.name || null,
        driver: selectedDrv ? { id: selectedDrv.id, name: selectedDrv.name, phone: selectedDrv.phone } : null,
        packageDetails: formData.packageDetails.trim() || "General Commercial Cargo",
        quantity: parseInt(formData.quantity) || 1,
        weight: formData.weight ? parseFloat(formData.weight) : 100,
        cpm: formData.cpm ? parseFloat(formData.cpm) : null,
        freight: freightNum,
        additionalCharges: addlNum,
        discount: discountNum,
        totalAmount,
        paidAmount: paidNum,
        remainingBalance,
        paymentStatus,
        shipmentStatus: formData.shipmentStatus || "BOOKED",
        challanId: null,
        notes: formData.notes.trim() || null,
        isLocal: true,
        trackingEvents: [
          {
            id: `evt-${uniqueId}`,
            status: formData.shipmentStatus || "BOOKED",
            location: formData.origin,
            notes: `Consignment booked at ${formData.origin} (${finalBiltyNumber}).`,
            timestamp,
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 1. Immediately persist to localStorage (spd_bilties, spd_local_bilties, spd_local_tracking)
      saveStoredBilty(newBiltyRecord);

      // 2. Try sending to backend API wrapped in try/catch (do NOT rollback or throw on serverless failure)
      try {
        await fetch("/api/admin/bilty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newBiltyRecord,
            biltyNumber: finalBiltyNumber,
            trackingId: finalTrackingId,
          }),
        });
      } catch (apiErr) {
        console.warn("Serverless API fallback active — bilty saved in localStorage:", apiErr);
      }

      setSuccessMessage(`Record created successfully! Bilty #${finalBiltyNumber} booked.`);
      setTimeout(() => {
        router.push(`/admin/bilty?highlight=${uniqueId}`);
      }, 900);
    } catch (err: any) {
      console.error("[NewBilty] Error:", err);
      setFormError(err.message || "Failed to create Bilty");
    } finally {
      setSubmitting(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name || c.companyName} (${c.phone || "No phone"})`,
    subLabel: `${c.city || "Pakistan"} • ${c.companyName || "Individual"}`,
    meta: c,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.vehicleNumber || v.registrationNumber} (${v.type || v.make || "Truck"})`,
    subLabel: `Capacity: ${v.capacity || "N/A"} Tons • Status: ${v.status || "AVAILABLE"}`,
    meta: v,
  }));

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.phone || d.contact || "No phone"})`,
    subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status || "AVAILABLE"}`,
    meta: d,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/bilty">
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
                Consignment Management
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-spd-red">Create Consignment</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-spd-red" />
              New Bilty Consignment
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/bilty">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="new-bilty-form"
            disabled={submitting}
            className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Book Consignment</span>
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
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form id="new-bilty-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Section 1: Route & Booking Stations */}
        <FormSectionCard
          title="From / To (Booking & Delivery Stations)"
          badge="Corridor"
          description="Booking station, destination station, and consignment vouchers"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Booking Date *
            </Label>
            <Input
              type="date"
              required
              value={formData.date}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Station *
            </Label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="LAHORE">Lahore</option>
              <option value="KARACHI">Karachi</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              From (Booking Station) *
            </Label>
            <select
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              To (Delivery Station) *
            </Label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Custom Bilty # (Optional, leave blank to auto-generate)
            </Label>
            <Input
              value={formData.biltyNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, biltyNumber: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Tracking ID (Optional, leave blank to auto-generate)
            </Label>
            <Input
              value={formData.trackingId}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, trackingId: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider"
            />
          </div>
        </FormSectionCard>

        {/* Section 2: Sender & Receiver Parties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sender / Consignor */}
          <FormSectionCard
            title="Sender / Consignor"
            badge="Origin"
            description="Select registered customer or enter consignor contact"
          >
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Select Registered Customer (Auto-fills Consignor)
              </Label>
              <SearchableSelect
                options={customerOptions}
                value={formData.customerId}
                onChange={handleCustomerSelect}
                placeholder=""
                emptyMessage="No registered customers found"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender / Consignor Name *
              </Label>
              <Input
                required
                value={formData.senderName}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="rounded-xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender / Consignor Phone *
              </Label>
              <Input
                required
                value={formData.senderPhone}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender / Consignor Address
              </Label>
              <Input
                value={formData.senderAddress}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </FormSectionCard>

          {/* Receiver / Consignee */}
          <FormSectionCard
            title="Receiver / Consignee"
            badge="Destination"
            description="Consignee contact and delivery location details"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver / Consignee Name *
              </Label>
              <Input
                required
                value={formData.receiverName}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                className="rounded-xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver / Consignee Phone *
              </Label>
              <Input
                required
                value={formData.receiverPhone}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver / Consignee Delivery Address *
              </Label>
              <Input
                value={formData.receiverAddress}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </FormSectionCard>
        </div>

        {/* Section 3: Cargo Packages & Specifications */}
        <FormSectionCard
          title="Cargo Description, Packages & Weight"
          badge="Cargo"
          description="Description of merchandise, package counts, weight, and volume"
        >
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Goods Description *
            </Label>
            <Input
              required
              value={formData.packageDetails}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, packageDetails: e.target.value })}
              className="rounded-xl h-10 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Quantity / Cartons / Packages *
            </Label>
            <Input
              type="number"
              min="1"
              required
              value={formData.quantity}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="rounded-xl h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Gross Weight (Kg)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.weight}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Volume / CPM (Cubic Meters)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.cpm}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, cpm: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Shipment Status
            </Label>
            <select
              value={formData.shipmentStatus}
              onChange={(e) => setFormData({ ...formData, shipmentStatus: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="BOOKED">Booked (At Station)</option>
              <option value="IN_WAREHOUSE">In Warehouse Storage</option>
              <option value="LOADED">Loaded on Vehicle</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="IN_TRANSIT">In Transit</option>
            </select>
          </div>
        </FormSectionCard>

        {/* Section 4: Vehicle & Driver Assignment (Optional) */}
        <FormSectionCard
          title="Vehicle & Driver Assignment (Optional)"
          badge="Fleet"
          description="Can be assigned immediately or grouped later in Challan Manifest"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Vehicle
            </Label>
            <SearchableSelect
              options={vehicleOptions}
              value={formData.vehicleId}
              onChange={handleVehicleSelect}
              placeholder=""
              emptyMessage="No vehicles available"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Driver
            </Label>
            <SearchableSelect
              options={driverOptions}
              value={formData.driverId}
              onChange={handleDriverSelect}
              placeholder=""
              emptyMessage="No drivers available"
            />
          </div>
        </FormSectionCard>

        {/* Section 5: Financial Accounting & Live Totals */}
        <FormSectionCard
          title="Freight Charges & Balance Calculation"
          badge="Financials"
          description="Real-time freight balance with auto-sum total and payment tracking"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Base Freight Amount (PKR) *
            </Label>
            <Input
              type="number"
              step="any"
              required
              value={formData.freight}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, freight: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Labour & Additional Charges (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.additionalCharges}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Discount (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.discount}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Advance Paid (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.paidAmount}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          {/* Live Financial Summary Banner */}
          <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Freight Amount
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Advance Paid
              </p>
              <p className="text-xl font-black text-slate-200">
                {formatCurrency(paidNum)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Balance Due
              </p>
              <p
                className={`text-2xl font-black ${
                  remainingBalance <= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {formatCurrency(remainingBalance)}
              </p>
            </div>
            <div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  remainingBalance <= 0
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : paidNum > 0
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {remainingBalance <= 0 ? "Fully Paid" : paidNum > 0 ? "Partially Paid" : "Unpaid"}
              </span>
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Special Handling Instructions & Delivery Notes
            </Label>
            <Input
              value={formData.notes}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/admin/bilty">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Book Consignment</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
