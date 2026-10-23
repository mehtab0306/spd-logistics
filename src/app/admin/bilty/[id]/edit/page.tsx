"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  UserPlus,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { formatCurrency } from "@/lib/utils";
import {
  getStoredBilties,
  saveStoredBilty,
  getStoredCustomers,
  getDeletedCustomerIds,
  saveStoredCustomer,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { TripleImageAttachment } from "@/components/shared/triple-image-attachment";
import { HybridCombobox } from "@/components/ui/hybrid-combobox";
import { toast } from "sonner";

export interface BiltyCargoItem {
  detail: string;
  quantity: string | number;
  weight: string | number;
  volume: string | number;
  rate: string | number;
  freightAsPer: "Per KG" | "Per CBM" | "Per Quantity" | "Fixed Freight";
  freight: number;
}

export default function EditBiltyPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || "";
  const biltyId = decodeURIComponent(rawId).trim();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // Dynamic Items Rows
  const [items, setItems] = useState<BiltyCargoItem[]>([
    {
      detail: "General Commercial Cargo",
      quantity: "1",
      weight: "100",
      volume: "",
      rate: "",
      freightAsPer: "Fixed Freight",
      freight: 0,
    },
  ]);

  // Operational Additional Charges Breakdown
  const [additionalBreakdown, setAdditionalBreakdown] = useState({
    labour: "",
    lifterCrane: "",
    pickupLocal: "",
    deliveryLocal: "",
    godownStorage: "",
    other: "",
  });

  const [formData, setFormData] = useState({
    id: "",
    billTo: "Sender" as "Sender" | "Receiver",
    amountType: "To Pay" as "Paid" | "To Pay" | "To Be Billed",
    dispatchMode: "Normal" as "Normal" | "Urgent",
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
    senderNtn: "",

    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverNtn: "",
    deliveryAddress: "",

    poNumber: "",
    blNumber: "",
    lcNumber: "",
    containerNumber: "",
    gdNumber: "",

    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",

    manualBaseFreight: "",
    discount: "",
    paidAmount: "",
    hideAmount: false,

    shipmentStatus: "BOOKED",
    notes: "",
    cargoPhoto: "",
    biltyPhoto: "",
    weightSlipPhoto: "",
  });

  useEffect(() => {
    if (biltyId) {
      Promise.all([fetchBilty(), fetchPrerequisites()]).finally(() => setLoading(false));
    }
  }, [biltyId]);

  const fetchPrerequisites = async () => {
    try {
      const [custRes, drvRes, vehRes] = await Promise.all([
        fetch("/api/admin/customers").catch(() => null),
        fetch("/api/admin/drivers").catch(() => null),
        fetch("/api/admin/vehicles").catch(() => null),
      ]);

      const custData = custRes ? await custRes.json().catch(() => ({})) : {};
      const drvData = drvRes ? await drvRes.json().catch(() => ({})) : {};
      const vehData = vehRes ? await vehRes.json().catch(() => ({})) : {};

      const custArr = Array.isArray(custData.data) ? custData.data : Array.isArray(custData.customers) ? custData.customers : [];
      const drvArr = Array.isArray(drvData.data) ? drvData.data : Array.isArray(drvData.drivers) ? drvData.drivers : [];
      const vehArr = Array.isArray(vehData.data) ? vehData.data : Array.isArray(vehData.vehicles) ? vehData.vehicles : [];

      setCustomers(mergeLocalWithApi(getStoredCustomers(), custArr, getDeletedCustomerIds()));
      setDrivers(mergeLocalWithApi(getStoredDrivers(), drvArr, getDeletedDriverIds()));
      setVehicles(mergeLocalWithApi(getStoredVehicles(), vehArr, getDeletedVehicleIds(), "registrationNumber"));
    } catch (err) {
      console.error("Error loading prerequisites:", err);
      setCustomers(getStoredCustomers());
      setDrivers(getStoredDrivers());
      setVehicles(getStoredVehicles());
    }
  };

  const fetchBilty = async () => {
    try {
      const target = biltyId.toUpperCase();
      let found: any = getStoredBilties().find(
        (b: any) =>
          b &&
          (String(b.id || "").toUpperCase() === target ||
            String(b.biltyNumber || "").toUpperCase() === target ||
            String(b.trackingId || "").toUpperCase() === target)
      );
      if (!found) {
        const res = await fetch(`/api/admin/bilty/${encodeURIComponent(biltyId)}`);
        if (res.ok) {
          const data = await res.json();
          found = data.data || data.consignment || data;
        }
      }

      if (found) {
        setFormData({
          id: found.id,
          billTo: found.billTo || "Sender",
          amountType: found.amountType || (found.paymentStatus === "PAID" ? "Paid" : "To Pay"),
          dispatchMode: found.dispatchMode || "Normal",
          biltyNumber: found.biltyNumber || "",
          trackingId: found.trackingId || "",
          date: found.date ? found.date.split("T")[0] : new Date().toISOString().slice(0, 10),
          warehouse: found.warehouse || "LAHORE",
          origin: found.origin || "Lahore",
          destination: found.destination || "Karachi",

          customerId: found.customerId || "",
          senderName: found.senderName || "",
          senderPhone: found.senderPhone || "",
          senderAddress: found.senderAddress || "",
          senderNtn: found.senderNtn || found.customer?.ntn || "",

          receiverName: found.receiverName || "",
          receiverPhone: found.receiverPhone || "",
          receiverAddress: found.receiverAddress || "",
          receiverNtn: found.receiverNtn || "",
          deliveryAddress: found.deliveryAddress || found.receiverAddress || "",

          poNumber: found.poNumber || "",
          blNumber: found.blNumber || "",
          lcNumber: found.lcNumber || "",
          containerNumber: found.containerNumber || "",
          gdNumber: found.gdNumber || "",

          vehicleId: found.vehicleId || "",
          vehicleNumber: found.vehicleNumber || (found.vehicle ? found.vehicle.vehicleNumber || found.vehicle.registrationNumber : ""),
          driverId: found.driverId || "",
          driverName: found.driverName || (found.driver ? found.driver.name : ""),

          manualBaseFreight: (found.freightAmount !== undefined && found.freightAmount !== null) ? String(found.freightAmount) : (found.freight !== undefined && found.freight !== null) ? String(found.freight) : "",
          discount: found.discount ? String(found.discount) : "",
          paidAmount: found.paidAmount ? String(found.paidAmount) : "",
          hideAmount: Boolean(found.hideAmount),

          shipmentStatus: found.shipmentStatus || "BOOKED",
          notes: found.notes || "",
          cargoPhoto: found.cargoPhoto || (found.photos?.[0] || ""),
          biltyPhoto: found.biltyPhoto || (found.photos?.[1] || ""),
          weightSlipPhoto: found.weightSlipPhoto || (found.photos?.[2] || ""),
        });

        if (Array.isArray(found.items) && found.items.length > 0) {
          setItems(found.items);
        } else if (found.itemDescription || found.packageDetails) {
          setItems([
            {
              detail: found.itemDescription || found.packageDetails,
              quantity: found.packagesCount || found.quantity || 1,
              weight: found.weight || 0,
              volume: found.cpm || "",
              rate: found.freightAmount || found.freight || 0,
              freightAsPer: "Fixed Freight",
              freight: parseFloat(found.freightAmount || found.freight) || 0,
            },
          ]);
        }

        if (found.additionalChargesBreakdown) {
          setAdditionalBreakdown({
            labour: found.additionalChargesBreakdown.labour ? String(found.additionalChargesBreakdown.labour) : found.labourCharges ? String(found.labourCharges) : "",
            lifterCrane: found.additionalChargesBreakdown.lifterCrane ? String(found.additionalChargesBreakdown.lifterCrane) : "",
            pickupLocal: found.additionalChargesBreakdown.pickupLocal ? String(found.additionalChargesBreakdown.pickupLocal) : "",
            deliveryLocal: found.additionalChargesBreakdown.deliveryLocal ? String(found.additionalChargesBreakdown.deliveryLocal) : "",
            godownStorage: found.additionalChargesBreakdown.godownStorage ? String(found.additionalChargesBreakdown.godownStorage) : "",
            other: found.additionalChargesBreakdown.other ? String(found.additionalChargesBreakdown.other) : found.otherCharges ? String(found.otherCharges) : "",
          });
        } else if (found.labourCharges || found.otherCharges) {
          setAdditionalBreakdown((prev) => ({
            ...prev,
            labour: found.labourCharges ? String(found.labourCharges) : "",
            other: found.otherCharges ? String(found.otherCharges) : "",
          }));
        } else if (found.additionalCharges) {
          setAdditionalBreakdown((prev) => ({
            ...prev,
            labour: String(found.additionalCharges),
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching bilty:", err);
      setFormError("Failed to load consignment details.");
    }
  };

  // Quick Customer Creation Handler
  const handleQuickCustomerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quickCustomerSubmitting) return;
    if (!quickCustomerData.name.trim()) return;

    // Check if customer with same phone or name already exists
    const normPhone = quickCustomerData.phone.trim().replace(/[^0-9]/g, "");
    const normName = quickCustomerData.name.trim().toLowerCase();
    const existing = customers.find((c) => {
      if (!c || c.status === "DELETED") return false;
      const cPhone = (c.phone || "").replace(/[^0-9]/g, "");
      const cName = (c.name || "").trim().toLowerCase();
      const phoneMatch = normPhone.length >= 7 && cPhone.length >= 7 && normPhone === cPhone;
      const nameMatch = normName.length > 1 && normName === cName;
      return phoneMatch || nameMatch;
    });

    if (existing) {
      if (quickCustomerTarget === "sender") {
        setFormData((prev) => ({
          ...prev,
          customerId: existing.id,
          senderName: existing.name,
          senderPhone: existing.phone || prev.senderPhone,
          senderAddress: existing.address || prev.senderAddress,
          senderNtn: existing.ntn || prev.senderNtn || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          receiverName: existing.name,
          receiverPhone: existing.phone || prev.receiverPhone,
          receiverAddress: existing.address || prev.receiverAddress,
          receiverNtn: existing.ntn || prev.receiverNtn || "",
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
      return;
    }

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
      setTimeout(() => {
        setQuickCustomerSubmitting(false);
      }, 800);
    }
  };

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
      } else if (item.freightAsPer === "Per Quantity") {
        computedFreight = qty * rate;
      } else {
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
  const calculatedItemsFreightSum = items.reduce((sum, item) => sum + (parseFloat(String(item.freight)) || 0), 0);
  const baseFreightNum =
    formData.manualBaseFreight !== ""
      ? parseFloat(formData.manualBaseFreight) || 0
      : calculatedItemsFreightSum > 0
      ? calculatedItemsFreightSum
      : 0;

  const labourNum = parseFloat(additionalBreakdown.labour) || 0;
  const lifterNum = parseFloat(additionalBreakdown.lifterCrane) || 0;
  const pickupNum = parseFloat(additionalBreakdown.pickupLocal) || 0;
  const deliveryNum = parseFloat(additionalBreakdown.deliveryLocal) || 0;
  const godownNum = parseFloat(additionalBreakdown.godownStorage) || 0;
  const otherNum = parseFloat(additionalBreakdown.other) || 0;

  const totalAdditionalCharges = labourNum + lifterNum + pickupNum + deliveryNum + godownNum + otherNum;
  const discountNum = parseFloat(formData.discount) || 0;
  const paidNum = parseFloat(formData.paidAmount) || 0;

  const subTotal = Math.max(0, baseFreightNum + totalAdditionalCharges - discountNum);
  const salesTax15Pct = Math.round(subTotal * 0.15);
  const totalAmount = subTotal + salesTax15Pct;
  const remainingBalance = totalAmount - paidNum;

  const totalQuantity = items.reduce((sum, i) => sum + (parseInt(String(i.quantity)) || 1), 0);
  const totalWeight = items.reduce((sum, i) => sum + (parseFloat(String(i.weight)) || 0), 0);
  const primaryPackageDetail = items.map((i) => i.detail).filter(Boolean).join(" • ") || "General Commercial Merchandise";

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
    if (submitting) return;
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

    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const selectedCust = customers.find((c) => String(c.id) === String(formData.customerId));
      const selectedDrv = drivers.find((d) => String(d.id) === String(formData.driverId));
      const selectedVeh = vehicles.find((v) => String(v.id) === String(formData.vehicleId));

      const bookingDate = formData.date ? formData.date.slice(0, 10) : new Date().toISOString().split("T")[0];
      const primaryItem = items && items[0];
      const itemDesc = primaryPackageDetail?.trim() || primaryItem?.detail?.trim() || "General Commercial Merchandise";
      const pkgType = primaryItem?.freightAsPer ? `${primaryItem.freightAsPer} Packages` : "Bags / Cartons";
      const packagesCount = Number(totalQuantity) || Number(primaryItem?.quantity) || 1;
      const grossWeight = Number(totalWeight) || (primaryItem?.weight ? Number(primaryItem.weight) : 0) || 0;
      const freightAmt = Number(baseFreightNum) || Number(formData.manualBaseFreight) || 0;
      const labourAmt = Number(labourNum) || Number(additionalBreakdown.labour) || 0;
      const otherAmt =
        (Number(otherNum) || Number(additionalBreakdown.other) || 0) +
        (Number(lifterNum) || 0) +
        (Number(pickupNum) || 0) +
        (Number(deliveryNum) || 0) +
        (Number(godownNum) || 0);

      const paymentMode =
        formData.amountType === "Paid" ? "PAID" : formData.amountType === "To Be Billed" ? "BILLED" : "TO-PAY";

      const paymentStatus =
        formData.amountType === "Paid" || (remainingBalance <= 0 && totalAmount > 0)
          ? "PAID"
          : formData.amountType === "To Be Billed"
          ? "TO_BE_BILLED"
          : paidNum > 0
          ? "PARTIAL"
          : "UNPAID";

      const updatedRecord = {
        id: formData.id || biltyId,
        biltyNumber: formData.biltyNumber,
        trackingId: formData.trackingId,
        date: formData.date ? new Date(formData.date).toISOString() : timestamp,
        bookingDate,
        warehouse: formData.warehouse,
        origin: formData.origin,
        destination: formData.destination,

        billTo: formData.billTo,
        amountType: formData.amountType,
        dispatchMode: formData.dispatchMode,
        hideAmount: formData.hideAmount,

        poNumber: formData.poNumber.trim() || null,
        blNumber: formData.blNumber.trim() || null,
        lcNumber: formData.lcNumber.trim() || null,
        containerNumber: formData.containerNumber.trim() || null,
        gdNumber: formData.gdNumber.trim() || null,

        customerId: formData.customerId || null,
        customer: selectedCust ? { id: selectedCust.id, name: selectedCust.name, companyName: selectedCust.companyName } : null,
        senderName: formData.senderName.trim(),
        senderPhone: formData.senderPhone.trim(),
        senderAddress: formData.senderAddress.trim(),
        senderNtn: formData.senderNtn || selectedCust?.ntn || null,

        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        receiverAddress: formData.receiverAddress.trim(),
        receiverNtn: formData.receiverNtn || null,
        deliveryAddress: formData.deliveryAddress.trim() || formData.receiverAddress.trim(),

        vehicleId: formData.vehicleId || null,
        vehicleNumber: formData.vehicleNumber || null,
        driverId: formData.driverId || null,
        driverName: formData.driverName || null,

        items,
        packageDetails: itemDesc,
        itemDescription: itemDesc,
        packagingType: pkgType,
        packagesCount,
        quantity: packagesCount,
        weight: grossWeight || 100,
        cpm: parseFloat(String(items[0]?.volume)) || null,

        freightAmount: freightAmt,
        freight: freightAmt,
        labourCharges: labourAmt,
        otherCharges: otherAmt,
        additionalChargesBreakdown: {
          labour: labourNum,
          lifterCrane: lifterNum,
          pickupLocal: pickupNum,
          deliveryLocal: deliveryNum,
          godownStorage: godownNum,
          other: otherNum,
        },
        additionalCharges: totalAdditionalCharges,
        discount: discountNum,
        subTotal,
        salesTax: salesTax15Pct,
        totalFreight: totalAmount,
        totalAmount,
        paidAmount: paidNum,
        remainingBalance,
        paymentMode,
        paymentStatus,
        status: "Booked",
        shipmentStatus: formData.shipmentStatus,

        notes: formData.notes.trim() || null,
        cargoPhoto: formData.cargoPhoto || null,
        biltyPhoto: formData.biltyPhoto || null,
        weightSlipPhoto: formData.weightSlipPhoto || null,
        photos: [formData.cargoPhoto, formData.biltyPhoto, formData.weightSlipPhoto].filter(Boolean),
        updatedAt: timestamp,
      };

      // Save locally
      saveStoredBilty(updatedRecord);

      // Background API update
      try {
        await fetch(`/api/admin/bilty/${biltyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRecord),
        });
      } catch (apiErr) {
        console.warn("Background API update:", apiErr);
      }

      const successMsg = `Bilty [${updatedRecord.biltyNumber || biltyId}] saved successfully with all cargo particulars.`;
      setSuccessMessage(successMsg);
      toast.success(successMsg);
      setTimeout(() => {
        router.push(`/admin/bilty/${biltyId}`);
      }, 700);
    } catch (err: any) {
      console.error("[EditBilty] Error:", err);
      setFormError(err.message || "Failed to update Bilty");
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
        <p className="text-xs font-semibold text-slate-500">Loading Bilty Details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/admin/bilty/${biltyId}`}>
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
              <span className="text-xs font-bold text-red-700">Edit Bilty #{formData.biltyNumber}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-red-700" />
              Edit Booking Entry (Sheet 1)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/bilty/${biltyId}`}>
            <Button variant="ghost" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-bilty-form"
            disabled={submitting}
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Booking & Dossier</span>
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

      <form id="edit-bilty-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Booking Controls */}
        <FormSectionCard
          title="Sheet 1: Booking Controls & Corridor"
          badge="Header Controls"
          description="Primary billing party, payment terms, dispatch priority, and station routing"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Bill To (Debtor) *
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
                Sender (Shipper)
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
                Receiver (Consignee)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Amount Type / Payment Mode *
            </Label>
            <select
              value={formData.amountType}
              onChange={(e) => setFormData({ ...formData, amountType: e.target.value as any })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="To Pay">To Pay (Payable at Destination)</option>
              <option value="Paid">Paid (Cash / Advance Received)</option>
              <option value="To Be Billed">To Be Billed (Monthly Corporate Credit)</option>
            </select>
          </div>

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
                Normal Speed
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
                ⚡ Urgent Express
              </button>
            </div>
          </div>

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
              From (Loading Hub) *
            </Label>
            <HybridCombobox
              value={formData.origin}
              onChange={(val) => setFormData({ ...formData, origin: val })}
              options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
              inputClassName="h-10 rounded-xl font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              To (Destination Hub) *
            </Label>
            <HybridCombobox
              value={formData.destination}
              onChange={(val) => setFormData({ ...formData, destination: val })}
              options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
              inputClassName="h-10 rounded-xl font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Bilty #
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
              Tracking ID
            </Label>
            <Input
              value={formData.trackingId}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, trackingId: e.target.value.toUpperCase() })}
              className="rounded-xl h-10 text-xs uppercase font-mono tracking-wider"
            />
          </div>
        </FormSectionCard>

        {/* Parties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormSectionCard
            title="Consignor / Sender Details"
            badge="Origin Party"
            description="Shipper contact, registered customer link, and commercial NTN"
          >
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Select Registered Customer
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

          <FormSectionCard
            title="Consignee / Receiver Details"
            badge="Destination Party"
            description="Receiver contact, delivery site, and specific factory address"
          >
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Receiver Name *
                </Label>
                <Input
                  required
                  value={formData.receiverName}
                  placeholder=""
                  onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  className="rounded-xl h-10 text-xs font-semibold"
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
                Receiver Address
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
                Specific Factory / Site Drop Address
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

        {/* Commercial Identifiers */}
        <FormSectionCard
          title="Commercial & Customs Identifiers"
          badge="Identifiers"
          description="Purchase orders, bill of lading, letters of credit, and container marks"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Order / PO #
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
              B/L #
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
              LC #
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
              Container #
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
              GD #
            </Label>
            <Input
              value={formData.gdNumber}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, gdNumber: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>
        </FormSectionCard>

        {/* Dynamic Items Rows */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cargo Items & Dynamic Freight Calculation
                </h3>
                <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  {items.length} Items
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate freight as per KG, CBM, Quantity, or Fixed Freight
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

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">
                    Item #{index + 1}
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
                      <span>Remove</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      Item Description *
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
                      Qty
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
                      Weight (Kg)
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
                      CBM
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
                      Freight As Per
                    </Label>
                    <select
                      value={item.freightAsPer}
                      onChange={(e) => handleItemChange(index, "freightAsPer", e.target.value)}
                      className="w-full h-9 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Per KG">Per KG</option>
                      <option value="Per CBM">Per CBM</option>
                      <option value="Per Quantity">Per Qty</option>
                      <option value="Fixed Freight">Fixed</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {item.freightAsPer === "Fixed Freight" ? "Freight (PKR)" : "Rate (PKR)"}
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

                <div className="flex justify-end text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                  <span>Computed Row Freight: </span>
                  <span className="font-mono text-red-700 dark:text-red-400 ml-1.5">
                    {formatCurrency(item.freight || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">
            <span className="uppercase text-slate-600 dark:text-slate-400">Sum of Items Initial Freight:</span>
            <span className="font-mono text-sm text-black dark:text-white">
              {formatCurrency(calculatedItemsFreightSum)}
            </span>
          </div>
        </div>

        {/* Additional Charges Breakdown */}
        <FormSectionCard
          title="Operational Additional Charges Breakdown"
          badge="Surcharges"
          description="Detailed breakdown matching transport operations (Labour, Crane, Local Cartage, Godown)"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Labour & Handling Charges
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
              Lifter / Crane / Shifting
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
              Pickup Local Cartage (Origin)
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
              Delivery Local Cartage (Destination)
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
              Godown / Storage Charges
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

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Other Operational Charges
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
        </FormSectionCard>

        {/* Fleet Assignment */}
        <FormSectionCard
          title="Fleet Vehicle & Driver Assignment (Optional)"
          badge="Linehaul"
          description="Assigned linehaul fleet and driver"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Assigned Truck / Vehicle #
            </Label>
            <HybridCombobox
              value={formData.vehicleNumber}
              onChange={(val) => setFormData({ ...formData, vehicleNumber: val })}
              options={vehicles.map((v) => ({
                value: v.vehicleNumber || v.registrationNumber || "",
                label: `${v.vehicleNumber || v.registrationNumber} (${v.type || v.make || "Truck"})`,
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
              options={drivers.map((d) => ({
                value: d.name || "",
                label: `${d.name} (${d.phone || d.contact || "No phone"})`,
                meta: d,
              }))}
              placeholder=""
              inputClassName="h-10 rounded-xl"
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
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </FormSectionCard>

        {/* Attachments */}
        <FormSectionCard
          title="Attachments & Document Proofs"
          badge="Proofs"
          description="Cargo photos, physical consignment copy scan, or weight slips"
        >
          <div className="col-span-1 sm:col-span-2">
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

        {/* Financial Accounting */}
        <FormSectionCard
          title="Financial Accounting & Net Calculation"
          badge="Financials"
          description="Automatic tax calculations, advance payment tracking, and print confidentiality options"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Base Initial Freight (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              value={formData.manualBaseFreight !== "" ? formData.manualBaseFreight : baseFreightNum || ""}
              placeholder=""
              onChange={(e) => setFormData({ ...formData, manualBaseFreight: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono font-bold"
            />
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Freight Confidentiality
            </Label>
            <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hideAmount}
                onChange={(e) => setFormData({ ...formData, hideAmount: e.target.checked })}
                className="w-4 h-4 rounded text-red-700 focus:ring-red-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Hide Amount in Bilty Prints
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Shows &apos;CONFIDENTIAL / AS PER CONTRACT&apos; on Driver &amp; Customer copies
                </span>
              </div>
            </label>
          </div>

          <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-slate-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Subtotal (Excl. Tax)
              </p>
              <p className="text-lg font-black text-white font-mono">
                {formatCurrency(subTotal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sales Tax (15%)
              </p>
              <p className="text-lg font-black text-blue-300 font-mono">
                {formatCurrency(salesTax15Pct)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Grand Total Amount
              </p>
              <p className="text-xl font-black text-emerald-400 font-mono">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Balance Due
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
          <Link href={`/admin/bilty/${biltyId}`}>
            <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Booking & Dossier</span>
          </Button>
        </div>
      </form>

      {/* Inline Quick Add Customer Modal */}
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
                Save & Select Party
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
