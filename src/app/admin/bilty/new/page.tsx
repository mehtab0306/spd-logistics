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

const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Sukkur",
  "Bahawalpur",
  "Sargodha",
  "Rahim Yar Khan",
  "Sheikhupura",
  "Jhang",
  "Gujrat",
  "Kasur",
  "Mardan",
  "Abbottabad",
  "Hub",
  "Gwadar",
  "Gilgit",
];

export default function NewBiltyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
        fetch("/api/admin/customers"),
        fetch("/api/admin/drivers"),
        fetch("/api/admin/vehicles"),
      ]);

      const parseJsonSafe = async (res: Response) => {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          return res.json();
        }
        return { data: [] };
      };

      const custData = await parseJsonSafe(custRes);
      const drvData = await parseJsonSafe(drvRes);
      const vehData = await parseJsonSafe(vehRes);

      const custArr = Array.isArray(custData.data) ? custData.data : Array.isArray(custData.customers) ? custData.customers : [];
      const drvArr = Array.isArray(drvData.data) ? drvData.data : Array.isArray(drvData.drivers) ? drvData.drivers : [];
      const vehArr = Array.isArray(vehData.data) ? vehData.data : Array.isArray(vehData.vehicles) ? vehData.vehicles : [];

      if (custArr.length > 0) setCustomers(custArr);
      if (drvArr.length > 0) setDrivers(drvArr);
      if (vehArr.length > 0) setVehicles(vehArr);
    } catch (err) {
      console.error("Error loading bilty prerequisites:", err);
    }
  };

  const handleCustomerSelect = (customerId: string, meta?: any) => {
    setFormData((prev) => {
      const cust = meta || customers.find((c) => c.id === customerId);
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
      const veh = meta || vehicles.find((v) => v.id === vehicleId);
      if (veh) {
        let matchedDriverId = prev.driverId;
        let matchedDriverName = prev.driverName;
        if (veh.driverId) {
          matchedDriverId = veh.driverId;
          const drv = drivers.find((d) => d.id === veh.driverId);
          if (drv) matchedDriverName = drv.name;
        }
        return {
          ...prev,
          vehicleId,
          vehicleNumber: veh.vehicleNumber,
          driverId: matchedDriverId,
          driverName: matchedDriverName,
        };
      }
      return { ...prev, vehicleId, vehicleNumber: "" };
    });
  };

  const handleDriverSelect = (driverId: string, meta?: any) => {
    setFormData((prev) => {
      const drv = meta || drivers.find((d) => d.id === driverId);
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

    if (!formData.senderName.trim()) {
      setFormError("Sender name or registered customer selection is required.");
      return;
    }
    if (!formData.receiverName.trim()) {
      setFormError("Receiver / Consignee name is required.");
      return;
    }
    if (!formData.receiverPhone.trim()) {
      setFormError("Receiver mobile phone number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        cpm: formData.cpm ? parseFloat(formData.cpm) : null,
        freight: freightNum,
        additionalCharges: addlNum,
        discount: discountNum,
        paidAmount: paidNum,
      };

      const res = await fetch("/api/admin/bilty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      let result: any = null;

      if (contentType.includes("application/json")) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.ok
            ? "Server returned unexpected response format"
            : `Server returned HTTP ${res.status}: ${text.slice(0, 100)}`
        );
      }

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create Bilty consignment");
      }

      router.push("/admin/bilty");
    } catch (err: any) {
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
    label: `${v.vehicleNumber} (${v.type || "Truck"})`,
    subLabel: `Capacity: ${v.capacity || "N/A"} Tons • Status: ${v.status}`,
    meta: v,
  }));

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.phone || d.contact || "No phone"})`,
    subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status}`,
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

      <form id="new-bilty-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Route & Warehouse Identification */}
        <FormSectionCard
          title="Consignment Route & Origin Warehouse"
          badge="Dispatch"
          description="Operational corridor, booking terminal, and sequential identifier"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Booking Date *
            </Label>
            <Input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Warehouse Terminal *
            </Label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="LAHORE">Lahore Main Terminal</option>
              <option value="KARACHI">Karachi Port Terminal</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Origin City *
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
              Destination City *
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
              onChange={(e) => setFormData({ ...formData, trackingId: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider"
            />
          </div>
        </FormSectionCard>

        {/* Section 2: Sender & Receiver Parties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sender Party */}
          <FormSectionCard
            title="Sender / Shipper Information"
            badge="Origin"
            description="Select registered customer or enter shipper contact"
          >
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Select Registered Customer (Auto-fills Shipper)
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
                Sender Full Name *
              </Label>
              <Input
                required
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="rounded-xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender Phone *
              </Label>
              <Input
                required
                value={formData.senderPhone}
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender Address
              </Label>
              <Input
                value={formData.senderAddress}
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </FormSectionCard>

          {/* Receiver Party */}
          <FormSectionCard
            title="Receiver / Consignee Information"
            badge="Destination"
            description="Delivery contact and delivery location details"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver Full Name *
              </Label>
              <Input
                required
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                className="rounded-xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver Phone *
              </Label>
              <Input
                required
                value={formData.receiverPhone}
                onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver Delivery Address *
              </Label>
              <Input
                value={formData.receiverAddress}
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
              <option value="BOOKED">Booked (At Warehouse)</option>
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
