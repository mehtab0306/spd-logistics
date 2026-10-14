"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Package,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Calculator,
  EyeOff,
  UserPlus,
  Receipt,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { formatCurrency } from "@/lib/utils";
import {
  getStoredCustomers,
  getDeletedCustomerIds,
  saveStoredCustomer,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  saveStoredBilty,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { TripleImageAttachment } from "@/components/shared/triple-image-attachment";
import { HybridCombobox } from "@/components/ui/hybrid-combobox";

export interface BiltyCargoItem {
  detail: string;
  quantity: string | number;
  weight: string | number;
  volume: string | number;
  rate: string | number;
  freightAsPer: "Per KG" | "Per CBM" | "Per Qty" | "Fixed Freight";
  freight: number;
}

export default function NewBiltyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedBilty, setSavedBilty] = useState<any>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Inline Quick Add Customer Modal State
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [quickCustomerTarget, setQuickCustomerTarget] = useState<"sender" | "receiver">("sender");
  const [quickCustomerData, setQuickCustomerData] = useState({
    name: "",
    phone: "",
    city: "Lahore",
    address: "",
    ntn: "",
    strn: "",
  });
  const [quickCustomerSubmitting, setQuickCustomerSubmitting] = useState(false);

  // Dynamic Cargo Items Rows
  const [items, setItems] = useState<BiltyCargoItem[]>([
    {
      detail: "General Commercial Merchandise",
      quantity: "1",
      weight: "100",
      volume: "",
      rate: "",
      freightAsPer: "Fixed Freight",
      freight: 0,
    },
  ]);

  // Operational Additional Charges Breakdown (Matching Excel & Transport Operations)
  const [additionalBreakdown, setAdditionalBreakdown] = useState({
    labour: "",
    lifterCrane: "",
    pickupLocal: "",
    deliveryLocal: "",
    godownStorage: "",
    other: "",
    otherRemark: "",
  });

  // Tax Controls (Income Tax 6% & Sales Tax 15%)
  const [taxSettings, setTaxSettings] = useState({
    incomeTaxEnabled: false,
    incomeTaxRate: "6",
    salesTaxEnabled: true,
    salesTaxRate: "15",
  });

  const [formData, setFormData] = useState({
    // Sheet 1 Header Controls
    billTo: "Sender" as "Sender" | "Receiver",
    amountType: "To Pay" as "Paid" | "To Pay" | "To Be Billed",
    dispatchMode: "Normal" as "Normal" | "Urgent",
    biltyNumber: "",
    trackingId: "",
    date: new Date().toISOString().slice(0, 10),
    warehouse: "LAHORE",
    origin: "Lahore",
    destination: "Karachi",

    // Parties
    customerId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    senderNtn: "",

    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverNtn: "",
    deliveryAddress: "",

    // Commercial Identifiers
    poNumber: "",
    blNumber: "",
    lcNumber: "",
    containerNumber: "",
    gdNumber: "",

    // Fleet
    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",

    // Financials
    manualBaseFreight: "",
    discount: "",
    paidAmount: "",
    hideAmount: false,

    // Status & Notes
    shipmentStatus: "BOOKED",
    notes: "",
    cargoPhoto: "",
    biltyPhoto: "",
    weightSlipPhoto: "",
  });

  // Helper to generate sequential Bilty Number
  const generateBiltyNumberCandidate = (hubCity: string = formData.origin) => {
    const hub = hubCity.toUpperCase().includes("KARACHI") || hubCity === "KHI" ? "KHI" : "LHR";
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `SPD-${hub}-${year}-${randomSeq}`;
  };

  useEffect(() => {
    fetchPrerequisites();
    // Auto-generate initial bilty number if empty
    setFormData((prev) => {
      if (!prev.biltyNumber) {
        return {
          ...prev,
          biltyNumber: generateBiltyNumberCandidate(prev.origin || "Lahore"),
        };
      }
      return prev;
    });
  }, []);

  const handleRegenerateBiltyNumber = () => {
    const newNo = generateBiltyNumberCandidate(formData.origin);
    setFormData((prev) => ({ ...prev, biltyNumber: newNo }));
  };

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

  // Quick Customer Creation Handler
  const handleQuickCustomerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerData.name.trim()) return;

    setQuickCustomerSubmitting(true);
    try {
      const newCust = {
        id: `cust-${Date.now()}`,
        name: quickCustomerData.name.trim(),
        companyName: quickCustomerData.name.trim(),
        phone: quickCustomerData.phone.trim() || "0300-0000000",
        city: quickCustomerData.city || "Pakistan",
        address: quickCustomerData.address.trim() || `${quickCustomerData.city}, Pakistan`,
        ntn: quickCustomerData.ntn.trim() || null,
        strn: quickCustomerData.strn.trim() || null,
        balance: 0,
        createdAt: new Date().toISOString(),
      };

      saveStoredCustomer(newCust);
      setCustomers((prev) => [newCust, ...prev]);

      if (quickCustomerTarget === "sender") {
        setFormData((prev) => ({
          ...prev,
          customerId: newCust.id,
          senderName: newCust.name,
          senderPhone: newCust.phone,
          senderAddress: newCust.address,
          senderNtn: newCust.ntn || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          receiverName: newCust.name,
          receiverPhone: newCust.phone,
          receiverAddress: newCust.address,
          receiverNtn: newCust.ntn || "",
        }));
      }

      setQuickCustomerModalOpen(false);
      setQuickCustomerData({
        name: "",
        phone: "",
        city: "Lahore",
        address: "",
        ntn: "",
        strn: "",
      });
    } catch (err) {
      console.error("Failed to save quick customer:", err);
    } finally {
      setQuickCustomerSubmitting(false);
    }
  };

  // Dynamic Item Row Management & Auto-Calculation
  const handleItemChange = (index: number, field: keyof BiltyCargoItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const qty = parseFloat(String(item.quantity)) || 0;
      const wt = parseFloat(String(item.weight)) || 0;
      const vol = parseFloat(String(item.volume)) || 0;
      const rate = parseFloat(String(item.rate)) || 0;

      let computedFreight = 0;
      if (item.freightAsPer === "Per KG") {
        computedFreight = wt * rate;
      } else if (item.freightAsPer === "Per CBM") {
        computedFreight = vol * rate;
      } else if (item.freightAsPer === "Per Qty" || (item.freightAsPer as any) === "Per Quantity") {
        computedFreight = qty * rate;
      } else {
        // Fixed Freight
        computedFreight = rate > 0 ? rate : parseFloat(String(item.freight)) || 0;
      }

      item.freight = Math.round(computedFreight);
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        detail: "",
        quantity: 1,
        weight: "",
        volume: "",
        rate: "",
        freightAsPer: "Fixed Freight",
        freight: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const calculatedItemsFreightSum = items.reduce(
    (sum, item) => sum + (parseFloat(String(item.freight)) || 0),
    0
  );

  const baseFreightNum =
    formData.manualBaseFreight !== ""
      ? parseFloat(formData.manualBaseFreight) || 0
      : calculatedItemsFreightSum;

  const labourNum = parseFloat(additionalBreakdown.labour) || 0;
  const lifterNum = parseFloat(additionalBreakdown.lifterCrane) || 0;
  const pickupNum = parseFloat(additionalBreakdown.pickupLocal) || 0;
  const deliveryNum = parseFloat(additionalBreakdown.deliveryLocal) || 0;
  const godownNum = parseFloat(additionalBreakdown.godownStorage) || 0;
  const otherNum = parseFloat(additionalBreakdown.other) || 0;

  const totalAdditionalCharges =
    labourNum + lifterNum + pickupNum + deliveryNum + godownNum + otherNum;
  const discountNum = parseFloat(formData.discount) || 0;
  const paidNum = parseFloat(formData.paidAmount) || 0;

  const subTotal = Math.max(0, baseFreightNum + totalAdditionalCharges - discountNum);

  const incomeTaxRateNum = parseFloat(taxSettings.incomeTaxRate) || 0;
  const incomeTaxAmount = taxSettings.incomeTaxEnabled
    ? Math.round(subTotal * (incomeTaxRateNum / 100))
    : 0;

  const salesTaxRateNum = parseFloat(taxSettings.salesTaxRate) || 0;
  const salesTaxAmount = taxSettings.salesTaxEnabled
    ? Math.round(subTotal * (salesTaxRateNum / 100))
    : 0;

  const grandTotal = subTotal + incomeTaxAmount + salesTaxAmount;
  const remainingBalance = grandTotal - paidNum;

  // Aggregate item quantities & weights for top-level schema compatibility
  const totalQuantity = items.reduce((sum, i) => sum + (parseInt(String(i.quantity)) || 1), 0);
  const totalWeight = items.reduce((sum, i) => sum + (parseFloat(String(i.weight)) || 0), 0);
  const primaryPackageDetail =
    items.map((i) => i.detail).filter(Boolean).join(" • ") || "General Commercial Merchandise";

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
          senderNtn: cust.ntn || prev.senderNtn,
        };
      }
      return { ...prev, customerId };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!formData.senderName.trim()) {
      setFormError("Sender name or customer selection is required.");
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
      const timestamp = new Date().toISOString();
      const year = new Date().getFullYear();
      const hubCode = formData.origin.toUpperCase().includes("KARACHI") ? "KHI" : "LHR";

      const finalBiltyNumber =
        formData.biltyNumber.trim().toUpperCase() ||
        `SPD-${hubCode}-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const finalTrackingId =
        formData.trackingId.trim().toUpperCase() ||
        `SPD-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Use clean string biltyNumber as primary ID to ensure route `/admin/bilty/[id]` always resolves
      const uniqueId = finalBiltyNumber;

      const paymentStatus =
        formData.amountType === "Paid" || (remainingBalance <= 0 && grandTotal > 0)
          ? "PAID"
          : formData.amountType === "To Be Billed"
          ? "TO_BE_BILLED"
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
        warehouse: formData.warehouse || (formData.origin.toUpperCase().includes("KARACHI") ? "KARACHI" : "LAHORE"),
        origin: formData.origin || "Lahore",
        destination: formData.destination || "Karachi",

        // Sheet 1 Specific Controls
        billTo: formData.billTo,
        amountType: formData.amountType,
        dispatchMode: formData.dispatchMode,
        hideAmount: formData.hideAmount,

        // Commercial Identifiers
        poNumber: formData.poNumber.trim() || null,
        blNumber: formData.blNumber.trim() || null,
        lcNumber: formData.lcNumber.trim() || null,
        containerNumber: formData.containerNumber.trim() || null,
        gdNumber: formData.gdNumber.trim() || null,

        // Parties
        customerId: formData.customerId || null,
        customer: selectedCust ? { id: selectedCust.id, name: selectedCust.name, companyName: selectedCust.companyName } : null,
        senderName: formData.senderName.trim(),
        senderPhone: formData.senderPhone.trim() || "0300-0000000",
        senderAddress: formData.senderAddress.trim() || `${formData.origin}, Pakistan`,
        senderNtn: formData.senderNtn || selectedCust?.ntn || null,

        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        receiverAddress: formData.receiverAddress.trim() || `${formData.destination}, Pakistan`,
        receiverNtn: formData.receiverNtn || null,
        deliveryAddress: formData.deliveryAddress.trim() || formData.receiverAddress.trim(),

        // Fleet Assignment
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

        // Dynamic Items
        items,
        packageDetails: primaryPackageDetail,
        quantity: totalQuantity,
        weight: totalWeight || 100,
        cpm: parseFloat(String(items[0]?.volume)) || null,

        // Financials & Breakdown
        additionalChargesBreakdown: {
          labour: labourNum,
          lifterCrane: lifterNum,
          lifter: lifterNum,
          pickupLocal: pickupNum,
          pickup: pickupNum,
          deliveryLocal: deliveryNum,
          delivery: deliveryNum,
          godownStorage: godownNum,
          godown: godownNum,
          other: otherNum,
          otherRemark: additionalBreakdown.otherRemark.trim() || "Other Operational Charges",
        },
        freight: baseFreightNum,
        additionalCharges: totalAdditionalCharges,
        discount: discountNum,
        subTotal,
        incomeTax: incomeTaxAmount,
        incomeTaxRate: incomeTaxRateNum,
        incomeTaxEnabled: taxSettings.incomeTaxEnabled,
        salesTax: salesTaxAmount,
        salesTaxRate: salesTaxRateNum,
        salesTaxEnabled: taxSettings.salesTaxEnabled,
        totalAmount: grandTotal,
        paidAmount: paidNum,
        remainingBalance,
        paymentStatus,
        shipmentStatus: formData.shipmentStatus || "BOOKED",

        challanId: null,
        notes: formData.notes.trim() || null,
        cargoPhoto: formData.cargoPhoto || null,
        biltyPhoto: formData.biltyPhoto || null,
        weightSlipPhoto: formData.weightSlipPhoto || null,
        photos: [formData.cargoPhoto, formData.biltyPhoto, formData.weightSlipPhoto].filter(Boolean),
        isLocal: true,
        trackingEvents: [
          {
            id: `evt-${Date.now()}`,
            status: formData.shipmentStatus || "BOOKED",
            location: formData.origin,
            notes: `Booking completed. Bilty #${finalBiltyNumber} registered (${formData.amountType}).`,
            timestamp,
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 1. Immediately persist to localStorage (both spd_bilties & spd_local_bilties)
      saveStoredBilty(newBiltyRecord);

      // 2. Cache in sessionStorage for instant 0ms retrieval on detail page
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("last_created_bilty", JSON.stringify(newBiltyRecord));
        } catch {}
      }

      // 3. Send to API in background
      try {
        await fetch("/api/admin/bilty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBiltyRecord),
        });
      } catch (apiErr) {
        console.warn("Serverless API fallback active — saved in local storage:", apiErr);
      }

      setSavedBilty(newBiltyRecord);
      setSuccessMessage(`Consignment booked successfully! Bilty #${finalBiltyNumber} generated.`);

      // Immediate redirect to 4-sheet dossier viewer
      setTimeout(() => {
        router.push(`/admin/bilty/${encodeURIComponent(finalBiltyNumber)}`);
      }, 500);
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
    subLabel: `${c.city || "Pakistan"} • NTN: ${c.ntn || "N/A"}`,
    meta: c,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header / Breadcrumbs */}
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
              <span className="text-xs font-bold text-red-700">Sheet 1: Booking Workflow</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-red-700" />
              New Bilty &amp; Booking Entry
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
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Book Consignment (4 Sheets)</span>
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
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          {savedBilty && (
            <Link href={`/admin/bilty/${encodeURIComponent(savedBilty.biltyNumber)}`}>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1 h-8 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50">
                <FileText className="w-3.5 h-3.5" />
                <span>Open 4-Sheet Dossier Now</span>
              </Button>
            </Link>
          )}
        </div>
      )}

      <form id="new-bilty-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* SECTION A: TOP CONTROLS & PARTIES */}
        <FormSectionCard
          title="Section A: Top Controls & Routing"
          badge="Sheet 1 Header"
          description="Bilty number, payment terms, dispatch priority, and corridor stations"
        >
          {/* Bilty No (Auto-generated & Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Bilty No *
              </Label>
              <button
                type="button"
                onClick={handleRegenerateBiltyNumber}
                className="text-[11px] font-bold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <Input
              required
              value={formData.biltyNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, biltyNumber: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider font-black text-red-700 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900"
            />
          </div>

          {/* Booking Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Date *
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

          {/* Loading Hub [From] */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Loading [From] Station *
            </Label>
            <HybridCombobox
              value={formData.origin}
              onChange={(val) => setFormData({ ...formData, origin: val })}
              options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
              inputClassName="h-10 rounded-xl font-semibold"
            />
          </div>

          {/* Destination Hub [To] */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Destination [To] Station *
            </Label>
            <HybridCombobox
              value={formData.destination}
              onChange={(val) => setFormData({ ...formData, destination: val })}
              options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
              inputClassName="h-10 rounded-xl font-semibold"
            />
          </div>

          {/* Dispatch Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Dispatch Mode *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dispatchMode: "Normal" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.dispatchMode === "Normal"
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dispatchMode: "Urgent" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.dispatchMode === "Urgent"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-50"
                }`}
              >
                ⚡ Urgent
              </button>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Payment Type *
            </Label>
            <select
              value={formData.amountType}
              onChange={(e) => setFormData({ ...formData, amountType: e.target.value as any })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Paid">Paid (Cash / Advance)</option>
              <option value="To Pay">To Pay (At Destination)</option>
              <option value="To Be Billed">To Be Billed (Credit Account)</option>
            </select>
          </div>

          {/* Bill To Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Bill To (Debtor Party) *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billTo: "Sender" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.billTo === "Sender"
                    ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Sender
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billTo: "Receiver" })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.billTo === "Receiver"
                    ? "bg-red-700 text-white border-red-700 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Receiver
              </button>
            </div>
          </div>

          {/* Custom Tracking ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Tracking ID (Optional)
            </Label>
            <Input
              value={formData.trackingId}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, trackingId: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider"
            />
          </div>
        </FormSectionCard>

        {/* PARTIES: Sender Party & Receiver Party with Quick Add Customer Modal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sender Party */}
          <FormSectionCard
            title="Sender Party (Consignor)"
            badge="Origin"
            description="Shipper contact, registered customer link, and commercial NTN"
          >
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuickCustomerTarget("sender");
                  setQuickCustomerModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold gap-1.5 h-10 text-red-700 border-red-200 hover:bg-red-50 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Customer</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender Name *
              </Label>
              <HybridCombobox
                required
                value={formData.senderName}
                placeholder=""
                onChange={(val) => setFormData({ ...formData, senderName: val })}
                onSelectOption={(opt) => {
                  const c = opt.meta;
                  if (c) {
                    setFormData((prev) => ({
                      ...prev,
                      customerId: c.id,
                      senderName: c.name || c.companyName || prev.senderName,
                      senderPhone: c.phone || prev.senderPhone,
                      senderAddress: c.address || (c.city ? `${c.city}, Pakistan` : prev.senderAddress),
                      senderNtn: c.ntn || prev.senderNtn,
                    }));
                  }
                }}
                options={customers.map((c) => ({
                  value: c.name || c.companyName || "",
                  label: `${c.name || c.companyName} (${c.phone || "No phone"})`,
                  subLabel: `${c.city || "Pakistan"} • NTN: ${c.ntn || "N/A"}`,
                  meta: c,
                }))}
                inputClassName="h-10 rounded-xl font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender Phone *
              </Label>
              <Input
                required
                value={formData.senderPhone}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender NTN / STRN
              </Label>
              <Input
                value={formData.senderNtn}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderNtn: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Sender Address
              </Label>
              <Input
                value={formData.senderAddress}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </FormSectionCard>

          {/* Receiver Party */}
          <FormSectionCard
            title="Receiver Party (Consignee)"
            badge="Destination"
            description="Consignee contact, delivery site, and factory warehouse address"
          >
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Receiver / Consignee Name *
                </Label>
                <HybridCombobox
                  required
                  value={formData.receiverName}
                  placeholder=""
                  onChange={(val) => setFormData({ ...formData, receiverName: val })}
                  onSelectOption={(opt) => {
                    const c = opt.meta;
                    if (c) {
                      setFormData((prev) => ({
                        ...prev,
                        receiverName: c.name || c.companyName || prev.receiverName,
                        receiverPhone: c.phone || prev.receiverPhone,
                        receiverAddress: c.address || (c.city ? `${c.city}, Pakistan` : prev.receiverAddress),
                        receiverNtn: c.ntn || prev.receiverNtn,
                      }));
                    }
                  }}
                  options={customers.map((c) => ({
                    value: c.name || c.companyName || "",
                    label: `${c.name || c.companyName} (${c.phone || "No phone"})`,
                    subLabel: `${c.city || "Pakistan"} • NTN: ${c.ntn || "N/A"}`,
                    meta: c,
                  }))}
                  inputClassName="h-10 rounded-xl font-semibold"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuickCustomerTarget("receiver");
                  setQuickCustomerModalOpen(true);
                }}
                className="rounded-xl text-xs font-bold gap-1.5 h-10 text-blue-800 border-blue-200 hover:bg-blue-50 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Customer</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver Phone *
              </Label>
              <Input
                required
                value={formData.receiverPhone}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver NTN / STRN
              </Label>
              <Input
                value={formData.receiverNtn}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverNtn: e.target.value })}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Receiver City Address
              </Label>
              <Input
                value={formData.receiverAddress}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Specific Factory / Warehouse Delivery Address
              </Label>
              <Input
                value={formData.deliveryAddress}
                placeholder=""
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>
          </FormSectionCard>
        </div>

        {/* SECTION B: COMMERCIAL & SHIPPING DETAILS */}
        <FormSectionCard
          title="Section B: Commercial & Shipping Details"
          badge="Commercial Identifiers"
          description="Purchase orders, bill of lading, container marks, LC and customs Goods Declaration"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Order / PO # (e.g., RF-12032)
            </Label>
            <Input
              value={formData.poNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              B/L No # (e.g., 1282HHJ2929)
            </Label>
            <Input
              value={formData.blNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, blNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Container # (e.g., 8303H303)
            </Label>
            <Input
              value={formData.containerNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              LC No #
            </Label>
            <Input
              value={formData.lcNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, lcNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              GD No # (Goods Declaration)
            </Label>
            <Input
              value={formData.gdNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, gdNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Remarks / Special Instructions
            </Label>
            <Input
              value={formData.notes}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* SECTION C: DYNAMIC ITEMS TABLE ("+ Add More Bilty Item") */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Section C: Dynamic Items Table
                </h3>
                <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate freight per KG, CBM, Quantity, or Fixed Freight
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
              className="rounded-xl text-xs font-bold gap-1.5 text-red-700 border-red-300 hover:bg-red-50 h-9"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add More Bilty Item</span>
            </Button>
          </div>

          {/* Dynamic Rows */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                    Row #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemRow(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs font-bold gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Row</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      1. Item Detail / Description *
                    </Label>
                    <Input
                      required
                      value={item.detail}
                      placeholder=""
                      onChange={(e) => handleItemChange(index, "detail", e.target.value)}
                      className="rounded-xl h-9 text-xs font-medium bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      2. Quantity
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      placeholder=""
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="rounded-xl h-9 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      3. Weight (KG)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={item.weight}
                      placeholder=""
                      onChange={(e) => handleItemChange(index, "weight", e.target.value)}
                      className="rounded-xl h-9 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      4. Vol (CBM)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={item.volume}
                      placeholder=""
                      onChange={(e) => handleItemChange(index, "volume", e.target.value)}
                      className="rounded-xl h-9 text-xs font-mono bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      6. Freight As Per
                    </Label>
                    <select
                      value={item.freightAsPer}
                      onChange={(e) => handleItemChange(index, "freightAsPer", e.target.value)}
                      className="w-full h-9 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Per KG">Per KG</option>
                      <option value="Per CBM">Per CBM</option>
                      <option value="Per Qty">Per Qty</option>
                      <option value="Fixed Freight">Fixed Freight</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      5. Rate (PKR)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={item.rate}
                      placeholder=""
                      onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      className="rounded-xl h-9 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center text-xs font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">7. Row Freight Total:</span>
                  <span className="font-mono text-red-700 dark:text-red-400 ml-2 text-sm font-black">
                    {formatCurrency(item.freight || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs gap-2">
            <span className="uppercase text-slate-600 dark:text-slate-400">
              Total Items: {items.length} | Packages: {totalQuantity} | Weight: {totalWeight} KG
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">SUM OF ROW FREIGHT:</span>
              <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(calculatedItemsFreightSum)}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION D: ITEMIZED ADDITIONAL CHARGES BREAKDOWN */}
        <FormSectionCard
          title="Section D: Itemized Additional Charges & Taxes"
          badge="Surcharges & Taxes"
          description="Labour, lifter/crane, local cartage, godown storage, other charges with customizable remark, and statutory withholding/sales taxes"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Labour Charges (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.labour}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, labour: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Lifter / Crane / Shifting Charges (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.lifterCrane}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, lifterCrane: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Pickup Local Charges (Origin)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.pickupLocal}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, pickupLocal: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Delivery Local Charges (Destination)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.deliveryLocal}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, deliveryLocal: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Godown / Storage Charges (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.godownStorage}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, godownStorage: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          {/* Other Charges Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Other Charges (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={additionalBreakdown.other}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, other: e.target.value })
              }
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          {/* Other Charges Customizable Remark */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Other Charges Remark / Specification
            </Label>
            <Input
              value={additionalBreakdown.otherRemark}
              placeholder=""
              onChange={(e) =>
                setAdditionalBreakdown({ ...additionalBreakdown, otherRemark: e.target.value })
              }
              className="rounded-xl h-10 text-xs"
            />
          </div>

          {/* Subtotal Calculation Display */}
          <div className="col-span-1 sm:col-span-2 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Subtotal Freight = SUM(Row Freight) + SUM(Additional Charges)
              </p>
              <p className="text-[11px] text-slate-500">
                Initial: {formatCurrency(baseFreightNum)} + Surcharges: {formatCurrency(totalAdditionalCharges)}
                {discountNum > 0 ? ` - Discount: ${formatCurrency(discountNum)}` : ""}
              </p>
            </div>
            <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(subTotal)}
            </p>
          </div>

          {/* Income Tax 6% Toggle & Input */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxSettings.incomeTaxEnabled}
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, incomeTaxEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-red-700 focus:ring-red-500"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Income Tax (WHT 6%)
                </span>
              </label>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(incomeTaxAmount)}
              </span>
            </div>
            {taxSettings.incomeTaxEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-[11px] font-semibold text-slate-500">Rate (%):</Label>
                <Input
                  type="number"
                  step="any"
                  value={taxSettings.incomeTaxRate}
                  placeholder=""
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, incomeTaxRate: e.target.value })
                  }
                  className="rounded-xl h-8 w-24 text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Sales Tax 15% Toggle & Input */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxSettings.salesTaxEnabled}
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, salesTaxEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-800 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Sales Tax (PRA / SRB 15%)
                </span>
              </label>
              <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(salesTaxAmount)}
              </span>
            </div>
            {taxSettings.salesTaxEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-[11px] font-semibold text-slate-500">Rate (%):</Label>
                <Input
                  type="number"
                  step="any"
                  value={taxSettings.salesTaxRate}
                  placeholder=""
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, salesTaxRate: e.target.value })
                  }
                  className="rounded-xl h-8 w-24 text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Contract Discount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Contract Discount (PKR)
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

          {/* Advance Paid */}
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
          <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 shadow-inner">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Subtotal
              </p>
              <p className="text-lg font-black text-white font-mono">
                {formatCurrency(subTotal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Taxes (WHT + GST)
              </p>
              <p className="text-lg font-black text-blue-300 font-mono">
                {formatCurrency(incomeTaxAmount + salesTaxAmount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Grand Total = Subtotal + Taxes
              </p>
              <p className="text-xl font-black text-emerald-400 font-mono">
                {formatCurrency(grandTotal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Remaining Balance
              </p>
              <p
                className={`text-xl font-black font-mono ${
                  remainingBalance <= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {formatCurrency(remainingBalance)}
              </p>
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION E: OPTIONS & ATTACHMENTS */}
        <FormSectionCard
          title="Section E: Options & Attachments"
          badge="Proofs & Options"
          description="Confidentiality masking on prints and up to 3 image attachment proofs"
        >
          {/* Hide Amount in Bilty Toggle */}
          <div className="col-span-1 sm:col-span-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.hideAmount}
                onChange={(e) => setFormData({ ...formData, hideAmount: e.target.checked })}
                className="w-4 h-4 rounded text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  &ldquo;Hide Amount in Bilty&rdquo; Toggle (ON / OFF)
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Masks freight figures and rates on driver and customer copies (shows &apos;CONFIDENTIAL — AS PER CONTRACT&apos;)
                </span>
              </div>
            </label>
          </div>

          {/* Photo Attachments (up to 3 images) */}
          <div className="col-span-1 sm:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-2">
              Photo Attachments (Cargo Photo, Consignment Copy, Weight Slip)
            </Label>
            <TripleImageAttachment
              attachments={{
                cargoPhoto: formData.cargoPhoto,
                biltyPhoto: formData.biltyPhoto,
                weightSlipPhoto: formData.weightSlipPhoto,
              }}
              onChange={(updated) =>
                setFormData({
                  ...formData,
                  cargoPhoto: updated.cargoPhoto || "",
                  biltyPhoto: updated.biltyPhoto || "",
                  weightSlipPhoto: updated.weightSlipPhoto || "",
                })
              }
            />
          </div>
        </FormSectionCard>

        {/* FLEET ASSIGNMENT (OPTIONAL) */}
        <FormSectionCard
          title="Fleet Assignment (Optional)"
          badge="Fleet"
          description="Truck vehicle number and driver assignment for linehaul transit"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Truck / Vehicle #
            </Label>
            <HybridCombobox
              value={formData.vehicleNumber}
              onChange={(val) => setFormData({ ...formData, vehicleNumber: val })}
              onSelectOption={(opt) => {
                const v = opt.meta;
                if (v) {
                  setFormData((prev) => ({
                    ...prev,
                    vehicleId: v.id,
                    vehicleNumber: v.vehicleNumber || v.registrationNumber || opt.value,
                    driverId: v.driverId || prev.driverId,
                    driverName: v.driver?.name || prev.driverName,
                  }));
                }
              }}
              options={vehicles.map((v) => ({
                value: v.vehicleNumber || v.registrationNumber || "",
                label: `${v.vehicleNumber || v.registrationNumber} (${v.type || v.make || "Truck"})`,
                subLabel: `Owner: ${v.ownerName || "SPD"} • Status: ${v.status || "AVAILABLE"}`,
                meta: v,
              }))}
              placeholder=""
              inputClassName="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Driver Name
            </Label>
            <HybridCombobox
              value={formData.driverName}
              onChange={(val) => setFormData({ ...formData, driverName: val })}
              onSelectOption={(opt) => {
                const d = opt.meta;
                if (d) {
                  setFormData((prev) => ({
                    ...prev,
                    driverId: d.id,
                    driverName: d.name || opt.value,
                  }));
                }
              }}
              options={drivers.map((d) => ({
                value: d.name || "",
                label: `${d.name} (${d.phone || d.contact || "No phone"})`,
                subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status || "AVAILABLE"}`,
                meta: d,
              }))}
              placeholder=""
              inputClassName="h-10 rounded-xl"
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
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-11 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Book Consignment &amp; View 4-Sheet Dossier</span>
          </Button>
        </div>
      </form>

      {/* INLINE QUICK ADD CUSTOMER MODAL */}
      <Dialog open={quickCustomerModalOpen} onOpenChange={setQuickCustomerModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-700" />
              Quick Add Customer ({quickCustomerTarget === "sender" ? "Shipper" : "Consignee"})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new client profile and auto-select in this booking entry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCustomerSave} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Party / Company Name *</Label>
              <Input
                required
                value={quickCustomerData.name}
                placeholder=""
                onChange={(e) => setQuickCustomerData({ ...quickCustomerData, name: e.target.value })}
                className="rounded-xl h-9 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Mobile / Phone Number *</Label>
              <Input
                required
                value={quickCustomerData.phone}
                placeholder=""
                onChange={(e) => setQuickCustomerData({ ...quickCustomerData, phone: e.target.value })}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">City *</Label>
                <HybridCombobox
                  value={quickCustomerData.city}
                  onChange={(val) => setQuickCustomerData({ ...quickCustomerData, city: val })}
                  options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
                  placeholder=""
                  inputClassName="h-9 rounded-xl font-semibold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">NTN (Optional)</Label>
                <Input
                  value={quickCustomerData.ntn}
                  placeholder=""
                  onChange={(e) => setQuickCustomerData({ ...quickCustomerData, ntn: e.target.value })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Physical Address</Label>
              <Input
                value={quickCustomerData.address}
                placeholder=""
                onChange={(e) => setQuickCustomerData({ ...quickCustomerData, address: e.target.value })}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickCustomerModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={quickCustomerSubmitting}
                size="sm"
                className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl"
              >
                {quickCustomerSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save &amp; Select Party
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
