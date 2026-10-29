"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  Truck,
  UserCog,
  MapPin,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Printer,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Handshake,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { LogisticsLoader } from "@/components/shared/logistics-loader";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PrintableChallan } from "@/components/challan/printable-challan";
import {
  getStoredBilties,
  saveStoredBilty,
  getDeletedBiltyIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredBrokers,
  saveStoredChallan,
  getStoredChallans,
  mergeLocalWithApi,
  setCookieCache,
} from "@/lib/local-persistence";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { exportToExcel } from "@/lib/export-excel";
import { HybridCombobox } from "@/components/ui/hybrid-combobox";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ChallanPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [availableBilties, setAvailableBilties] = useState<any[]>([]);
  const [selectedBiltyIds, setSelectedBiltyIds] = useState<string[]>([]);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);

  // Search & Filter for left column
  const [biltySearch, setBiltySearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("KARACHI");

  // Printable Challan modal
  const [printedChallan, setPrintedChallan] = useState<any>(null);

  // Form State
  const [challanData, setChallanData] = useState({
    challanNumber: "",
    date: new Date().toISOString().slice(0, 10),
    warehouse: "KARACHI",
    origin: "Karachi",
    destination: "Lahore",

    hiringMode: "COMPANY_FLEET" as "COMPANY_FLEET" | "MARKET_BROKER",
    brokerId: "",
    brokerName: "",
    brokerPhone: "",
    brokerFreight: "",
    brokerAdvance: "",

    vehicleId: "",
    truckNumber: "",
    driverId: "",
    driverName: "",
    driverPhone: "",

    truckFreight: "",
    advancePaidToDriver: "",
    notes: "",
  });

  // Load available warehouse bilties directly on client mount
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("spd_bilties") ||
        localStorage.getItem("spd_local_bilties") ||
        sessionStorage.getItem("spd_bilties");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const unassigned = parsed.filter(
            (b: any) =>
              b &&
              !b.challanId &&
              b.shipmentStatus !== "DELIVERED" &&
              b.shipmentStatus !== "DELETED" &&
              !String(b.id || "").startsWith("cust-")
          );
          if (unassigned.length > 0) {
            setAvailableBilties(unassigned);
          }
        }
      }
    } catch (err) {
      console.error("Error loading warehouse bilties on mount:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const [biltyRes, vehRes, drvRes, brkRes] = await Promise.all([
        fetch("/api/admin/bilty", { signal: controller.signal }).catch(() => null),
        fetch("/api/admin/vehicles", { signal: controller.signal }).catch(() => null),
        fetch("/api/admin/drivers", { signal: controller.signal }).catch(() => null),
        fetch("/api/admin/brokers", { signal: controller.signal }).catch(() => null),
      ]);
      clearTimeout(timeoutId);

      let supabaseBilties: any[] = [];
      let supabaseDrivers: any[] = [];
      if (isSupabaseConfigured) {
        try {
          const { data: sbBilties } = await supabase.from("bilties").select("*").order("created_at", { ascending: false });
          if (Array.isArray(sbBilties)) {
            supabaseBilties = sbBilties.map((r: any) => ({
              id: r.id || r.bilty_number,
              biltyNumber: r.bilty_number || r.id,
              trackingId: r.bilty_number || r.id,
              senderName: r.sender_name || "Walk-in Shipper",
              receiverName: r.receiver_name || "Consignee",
              origin: r.origin_station || r.origin || "Karachi",
              destination: r.destination_station || r.destination || "Lahore",
              packagesCount: Number(r.packages_count) || 1,
              weight: Number(r.weight) || 0,
              totalFreight: Number(r.freight_amount ?? r.total_freight ?? 0),
              totalAmount: Number(r.freight_amount ?? r.total_freight ?? 0),
              advancePaid: Number(r.advance_paid ?? 0),
              remainingBalance: Number(r.remaining_balance ?? 0),
              paymentMode: r.payment_mode || "TO-PAY",
              shipmentStatus: (r.status || "BOOKED").toUpperCase(),
              status: r.status || "Booked",
              challanId: r.challan_id,
              ...r,
            }));
          }
        } catch (e) {
          console.warn("Supabase bilties fetch error in challan:", e);
        }
        try {
          const { data: sbDrivers } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
          if (Array.isArray(sbDrivers)) {
            supabaseDrivers = sbDrivers.map((d: any) => ({
              id: d.id,
              name: d.name,
              phone: d.phone,
              contact: d.phone,
              cnic: d.cnic,
              licenseNumber: d.license_number,
              vehicleNumber: d.vehicle_number,
              status: d.status || "AVAILABLE",
              ...d,
            }));
          }
        } catch (e) {
          console.warn("Supabase drivers fetch error in challan:", e);
        }
      }

      const biltyData = biltyRes ? await biltyRes.json().catch(() => ({})) : {};
      const vehData = vehRes ? await vehRes.json().catch(() => ({})) : {};
      const drvData = drvRes ? await drvRes.json().catch(() => ({})) : {};
      const brkData = brkRes ? await brkRes.json().catch(() => ({})) : {};

      const apiBilties = Array.isArray(biltyData.data)
        ? biltyData.data
        : Array.isArray(biltyData.consignments)
        ? biltyData.consignments
        : [];
      const apiVehicles = Array.isArray(vehData.data)
        ? vehData.data
        : Array.isArray(vehData.vehicles)
        ? vehData.vehicles
        : [];
      const apiDrivers = Array.isArray(drvData.data)
        ? drvData.data
        : Array.isArray(drvData.drivers)
        ? drvData.drivers
        : [];
      const apiBrokers = Array.isArray(brkData.data) ? brkData.data : [];

      const localBilties = getStoredBilties();
      const combinedActiveBilties = supabaseBilties.length > 0
        ? mergeLocalWithApi(supabaseBilties, localBilties, [], "biltyNumber")
        : localBilties;
      const allBilties = supabaseBilties.length > 0
        ? combinedActiveBilties
        : mergeLocalWithApi(combinedActiveBilties, apiBilties, getDeletedBiltyIds(), "biltyNumber");

      const dedupedBilties: any[] = [];
      const seenBiltyIds = new Set<string>();
      const seenBiltyNumbers = new Set<string>();
      for (const item of allBilties) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        const bNum = String(item.biltyNumber || "").trim().toUpperCase();
        if (seenBiltyIds.has(id)) continue;
        if (bNum && seenBiltyNumbers.has(bNum)) continue;
        seenBiltyIds.add(id);
        if (bNum) seenBiltyNumbers.add(bNum);
        dedupedBilties.push(item);
      }

      const unassigned = dedupedBilties.filter(
        (b: any) =>
          !b.challanId &&
          b.shipmentStatus !== "DELIVERED" &&
          b.shipmentStatus !== "DELETED"
      );
      setAvailableBilties(unassigned);

      const localDrivers = getStoredDrivers();
      const combinedActiveDrivers = supabaseDrivers.length > 0
        ? mergeLocalWithApi(supabaseDrivers, localDrivers, [])
        : localDrivers;
      const allDrivers = supabaseDrivers.length > 0
        ? combinedActiveDrivers
        : mergeLocalWithApi(combinedActiveDrivers, apiDrivers, getDeletedDriverIds());

      const dedupedDrivers: any[] = [];
      const seenDrvIds = new Set<string>();
      const seenDrvPhones = new Set<string>();
      const seenDrvNames = new Set<string>();
      for (const item of allDrivers) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        if (seenDrvIds.has(id)) continue;
        const normPhone = item.phone ? String(item.phone).replace(/[^0-9]/g, "") : "";
        const normName = item.name ? String(item.name).trim().toLowerCase() : "";
        if (normPhone.length >= 7 && seenDrvPhones.has(normPhone)) continue;
        if (normName.length > 1 && seenDrvNames.has(normName)) continue;
        seenDrvIds.add(id);
        if (normPhone.length >= 7) seenDrvPhones.add(normPhone);
        if (normName.length > 1) seenDrvNames.add(normName);
        dedupedDrivers.push(item);
      }

      setVehicles(mergeLocalWithApi(getStoredVehicles(), apiVehicles, getDeletedVehicleIds(), "registrationNumber"));
      setDrivers(dedupedDrivers);
      setBrokers(mergeLocalWithApi(getStoredBrokers(), apiBrokers, []));

      // Auto-suggest sequential Challan number
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setChallanData((prev) => ({
        ...prev,
        challanNumber: `CHL-${year}-${randomSuffix}`,
      }));
    } catch (err) {
      console.error("Error loading challan setup data:", err);
      const localUnassigned = getStoredBilties().filter(
        (b: any) => !b.challanId && b.shipmentStatus !== "DELIVERED" && b.shipmentStatus !== "DELETED"
      );
      setAvailableBilties(localUnassigned);
      setVehicles(getStoredVehicles());
      setDrivers(getStoredDrivers());
      setBrokers(getStoredBrokers());
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const handleVehicleSelect = (vehicleId: string, meta?: any) => {
    setChallanData((prev) => {
      const veh = meta || vehicles.find((v) => String(v.id) === String(vehicleId));
      if (veh) {
        let matchedDriverId = prev.driverId;
        let matchedDriverName = prev.driverName;
        let matchedDriverPhone = prev.driverPhone;

        const assignedDrvId = veh.driverId || veh.assignedDriverId;
        if (assignedDrvId) {
          matchedDriverId = assignedDrvId;
          const drv = drivers.find((d) => String(d.id) === String(assignedDrvId));
          if (drv) {
            matchedDriverName = drv.name;
            matchedDriverPhone = drv.phone || drv.contact || "";
          }
        }
        return {
          ...prev,
          vehicleId,
          truckNumber: veh.vehicleNumber || veh.registrationNumber || "",
          driverId: matchedDriverId,
          driverName: matchedDriverName,
          driverPhone: matchedDriverPhone,
        };
      }
      return { ...prev, vehicleId, truckNumber: "" };
    });
  };

  const handleDriverSelect = (driverId: string, meta?: any) => {
    setChallanData((prev) => {
      const drv = meta || drivers.find((d) => String(d.id) === String(driverId));
      return {
        ...prev,
        driverId,
        driverName: drv ? drv.name : prev.driverName,
        driverPhone: drv ? drv.phone || drv.contact || "" : prev.driverPhone,
      };
    });
  };

  // Filtered Bilties
  const filteredBilties = availableBilties.filter((b) => {
    if (warehouseFilter && b.warehouse && b.warehouse !== warehouseFilter) {
      return false;
    }
    if (biltySearch.trim()) {
      const s = biltySearch.toLowerCase();
      const matchNo = b.biltyNumber?.toLowerCase().includes(s);
      const matchSender = b.senderName?.toLowerCase().includes(s);
      const matchReceiver = b.receiverName?.toLowerCase().includes(s);
      const matchCity = b.destination?.toLowerCase().includes(s);
      if (!matchNo && !matchSender && !matchReceiver && !matchCity) return false;
    }
    return true;
  });

  const toggleSelectBilty = (id: string) => {
    setSelectedBiltyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredBilties.map((b) => b.id);
    const allSelected = visibleIds.every((id) => selectedBiltyIds.includes(id));
    if (allSelected) {
      setSelectedBiltyIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedBiltyIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Calculations for Selected Bilties
  const selectedBiltiesList = availableBilties.filter((b) =>
    selectedBiltyIds.includes(b.id)
  );
  const totalSelectedWeight = selectedBiltiesList.reduce(
    (sum, b) => sum + (Number(b.weight) || 0),
    0
  );
  const totalGrossFreight = selectedBiltiesList.reduce(
    (sum, b) => sum + (Number(b.totalAmount) || Number(b.freight) || 0),
    0
  );
  const totalPackages = selectedBiltiesList.reduce(
    (sum, b) => sum + (Number(b.quantity) || 1),
    0
  );

  // Financial & Profit Calculations
  const isBroker = challanData.hiringMode === "MARKET_BROKER";
  const truckFreightCost = isBroker
    ? parseFloat(challanData.brokerFreight) || 0
    : parseFloat(challanData.truckFreight) || 0;
  const driverAdvancePaid = isBroker
    ? parseFloat(challanData.brokerAdvance) || 0
    : parseFloat(challanData.advancePaidToDriver) || 0;
  const driverBalanceDue = Math.max(0, truckFreightCost - driverAdvancePaid);

  const netTripProfit = totalGrossFreight - truckFreightCost;
  const profitMargin =
    totalGrossFreight > 0 ? (netTripProfit / totalGrossFreight) * 100 : 0;

  const handleBrokerSelect = (brokerId: string, meta?: any) => {
    const brk = meta || brokers.find((b) => b.id === brokerId);
    if (brk) {
      setChallanData((prev) => ({
        ...prev,
        brokerId,
        brokerName: brk.name,
        brokerPhone: brk.phone || "",
      }));
    }
  };

  const handleExportWarehouseBilties = () => {
    if (!filteredBilties.length) return;
    const data = filteredBilties.map((b) => ({
      "Bilty #": b.biltyNumber || "",
      "Tracking ID": b.trackingId || "",
      "Date": b.date ? new Date(b.date).toLocaleDateString("en-GB") : "",
      "Origin": b.origin || "",
      "Destination": b.destination || "",
      "Warehouse": b.warehouse || "Karachi",
      "Goods / Item": b.packageDetails || b.description || "General Cargo",
      "Sender": b.senderName || "",
      "Receiver": b.receiverName || "",
      "Packages": b.quantity || 1,
      "Weight (kg)": b.weight || 0,
      "Weight & CBM": b.weight ? `${b.weight} kg | ${b.cbm || b.volume || (Math.round((Number(b.weight) / 330) * 10) / 10).toFixed(1)} CBM` : "—",
      "Freight (PKR)": b.freight || 0,
      "Total (PKR)": b.totalAmount || b.freight || 0,
      "Payment Status": b.remainingBalance <= 0 ? "PAID" : "TO-PAY",
    }));
    exportToExcel(data, `Warehouse_Bilties_${warehouseFilter || "ALL"}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setSuccessMsg("");

    if (selectedBiltyIds.length === 0) {
      setFormError("Please select at least one Bilty from the warehouse list.");
      return;
    }
    if (!challanData.truckNumber.trim()) {
      setFormError("Truck / Vehicle is required.");
      return;
    }
    if (!challanData.driverName.trim()) {
      setFormError("Driver is required.");
      return;
    }
    if (isBroker && !challanData.brokerId && !challanData.brokerName) {
      setFormError("Please select a Broker for the market vehicle.");
      return;
    }

    setSubmitting(true);
    try {
      const uniqueId = Date.now().toString();
      const timestamp = new Date().toISOString();
      const year = new Date().getFullYear();
      const finalChallanNo =
        challanData.challanNumber.trim() || `CHL-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const updatedConsignments = selectedBiltiesList.map((b) => ({
        ...b,
        challanId: uniqueId,
        shipmentStatus: "IN_TRANSIT",
        vehicleId: challanData.vehicleId || b.vehicleId,
        vehicleNumber: challanData.truckNumber,
        driverId: challanData.driverId || b.driverId,
        driverName: challanData.driverName,
      }));

      const newChallanRecord = {
        id: uniqueId,
        challanNumber: finalChallanNo,
        date: challanData.date ? new Date(challanData.date).toISOString() : timestamp,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        warehouse: challanData.warehouse || "KARACHI",
        origin: challanData.origin || "Karachi",
        destination: challanData.destination || "Lahore",
        hiringMode: challanData.hiringMode,
        brokerId: isBroker ? challanData.brokerId || null : null,
        brokerName: isBroker ? challanData.brokerName || null : null,
        brokerPhone: isBroker ? challanData.brokerPhone || null : null,
        brokerFreight: isBroker ? truckFreightCost : 0,
        brokerAdvance: isBroker ? driverAdvancePaid : 0,
        brokerBalance: isBroker ? driverBalanceDue : 0,
        vehicleId: challanData.vehicleId || null,
        truckNumber: challanData.truckNumber.trim(),
        driverId: challanData.driverId || null,
        driverName: challanData.driverName.trim(),
        driverPhone: challanData.driverPhone.trim() || null,
        totalAmount: totalGrossFreight,
        truckFreight: truckFreightCost,
        advancePaidToDriver: driverAdvancePaid,
        vehicleExpense: truckFreightCost,
        estimatedProfit: netTripProfit,
        status: "IN_TRANSIT",
        notes: challanData.notes.trim() || null,
        consignments: updatedConsignments,
        isLocal: true,
        createdAt: timestamp,
      };

      // 1. Enforce Cloud Database Persistence
      let savedSuccessfully = false;
      let lastErrorMessage = "";

      if (isSupabaseConfigured) {
        const { error: sbErr } = await supabase.from("challans").upsert([
          {
            id: String(newChallanRecord.id),
            challan_number: finalChallanNo,
            vehicle_number: newChallanRecord.truckNumber || null,
            driver_name: newChallanRecord.driverName || null,
            driver_phone: newChallanRecord.driverPhone || null,
            origin: newChallanRecord.origin || null,
            destination: newChallanRecord.destination || null,
            total_truck_hire: Number(truckFreightCost) || 0,
            advance_paid: Number(driverAdvancePaid) || 0,
            balance_payable: Number(driverBalanceDue) || 0,
            status: "In Transit",
          },
        ]);

        if (sbErr) {
          lastErrorMessage = `Supabase write failed: ${sbErr.message}`;
        } else {
          savedSuccessfully = true;

          // Update linked bilties status in Supabase
          if (selectedBiltyIds.length > 0) {
            await supabase
              .from("bilties")
              .update({
                status: "In Transit",
                vehicle_number: newChallanRecord.truckNumber || null,
                driver_name: newChallanRecord.driverName || null,
              })
              .in("id", selectedBiltyIds);
          }

          // Synchronize locally only after affirmative database write
          const allSavedChallans = saveStoredChallan(newChallanRecord);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("spd_challans", JSON.stringify(allSavedChallans));
            setCookieCache("spd_challans_cache", JSON.stringify(allSavedChallans));
          }
          for (const updatedBilty of updatedConsignments) {
            saveStoredBilty(updatedBilty);
          }
        }

        // Notify API in background for notifications
        fetch("/api/admin/challan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...challanData,
            challanNumber: finalChallanNo,
            truckFreight: truckFreightCost,
            advancePaidToDriver: driverAdvancePaid,
            brokerFreight: isBroker ? truckFreightCost : 0,
            brokerAdvance: isBroker ? driverAdvancePaid : 0,
            selectedBiltyIds,
          }),
        }).catch(() => {});
      } else {
        // Supabase not configured — try server API
        try {
          const apiRes = await fetch("/api/admin/challan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...challanData,
              challanNumber: finalChallanNo,
              truckFreight: truckFreightCost,
              advancePaidToDriver: driverAdvancePaid,
              brokerFreight: isBroker ? truckFreightCost : 0,
              brokerAdvance: isBroker ? driverAdvancePaid : 0,
              selectedBiltyIds,
            }),
          });
          const apiJson = await apiRes.json().catch(() => null);
          if (apiRes.ok && apiJson?.success) {
            savedSuccessfully = true;
            const allSavedChallans = saveStoredChallan(newChallanRecord);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("spd_challans", JSON.stringify(allSavedChallans));
              setCookieCache("spd_challans_cache", JSON.stringify(allSavedChallans));
            }
            for (const updatedBilty of updatedConsignments) {
              saveStoredBilty(updatedBilty);
            }
          } else {
            lastErrorMessage = apiJson?.error || "Database setup incomplete. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be added in Vercel Settings -> Environment Variables.";
          }
        } catch (apiErr: any) {
          lastErrorMessage = apiErr?.message || "Cloud database is disconnected. Please configure Supabase keys in Vercel.";
        }
      }

      if (!savedSuccessfully) {
        throw new Error(
          lastErrorMessage ||
          "Database Save Failed: Cloud database is not connected. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Settings."
        );
      }

      // Update local UI state
      setAvailableBilties((prev) => prev.filter((b) => !selectedBiltyIds.includes(b.id)));
      setSelectedBiltyIds([]);

      setSuccessMsg(`Record created successfully! Challan ${finalChallanNo} generated and dispatched.`);
      setPrintedChallan(newChallanRecord);
    } catch (err: any) {
      console.error("[ChallanPage] Error:", err);
      setFormError(err.message || "Failed to generate Challan");
    } finally {
      setSubmitting(false);
    }
  };

  const brokerOptions = brokers.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.city || "Transport Broker"})`,
    subLabel: `Contact: ${b.contactPerson || "Agent"} • Ph: ${b.phone || "N/A"} • Rate: ${b.commissionType === "PERCENTAGE" ? `${b.commissionRate}%` : `₨ ${b.commissionRate}`}`,
    meta: b,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.vehicleNumber || v.registrationNumber} (${v.type || v.make || "Truck"})`,
    subLabel: `Capacity: ${v.capacity || "N/A"} Tons • Status: ${v.status || "AVAILABLE"}`,
    meta: v,
  }));

  const driverOptions = useMemo(() => {
    const map = new Map<string, any>();
    drivers.forEach((d) => {
      if (!d || !d.id) return;
      const key = String(d.id);
      if (!map.has(key)) {
        map.set(key, {
          value: d.id,
          label: `${d.name} (${d.phone || d.contact || "No phone"})`,
          subLabel: `CNIC: ${d.cnic || "N/A"} • Status: ${d.status || "AVAILABLE"}`,
          meta: d,
        });
      }
    });
    return Array.from(map.values());
  }, [drivers]);

  const driverNameOptions = useMemo(() => {
    const map = new Map<string, any>();
    drivers.forEach((d) => {
      const name = (d.name || "").trim();
      const normKey = name.toLowerCase();
      if (name && !map.has(normKey)) {
        map.set(normKey, {
          value: name,
          label: name,
          sublabel: d.phone || d.contact || "Driver",
        });
      }
    });
    return Array.from(map.values());
  }, [drivers]);

  return (
    <div className="space-y-6 pb-24">
      {/* Printable Challan Modal */}
      {printedChallan && (
        <PrintableChallan
          challan={printedChallan}
          onClose={() => {
            setPrintedChallan(null);
            router.push("/admin/challan-in-transit");
          }}
        />
      )}

      {/* Form Content - Strictly Hidden in Print to Prevent Any Parameter Leaks */}
      <div className="space-y-6 challan-form-section print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trip Setup
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-spd-blue">Dispatch Manifest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-spd-blue" />
            Challan & Trip Manifest
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Group warehouse bilties onto long-haul trucks, assign drivers, calculate live trip profitability, and issue dispatch challans.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportWarehouseBilties}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold gap-2 h-10 px-3.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Warehouse Bilties</span>
          </Button>

          <Link href="/admin/challan-in-transit">
            <Button variant="outline" className="rounded-xl text-xs font-bold gap-2 h-10 px-3.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Challan in Transit</span>
            </Button>
          </Link>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2-COLUMN MAIN DESKTOP LAYOUT (Matching Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: SELECT WAREHOUSE BILTIES (7 Columns on Large)     */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            {/* Header / Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-spd-red" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Available Warehouse Bilties
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {filteredBilties.length} Available
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search bilty #, shipper, receiver, city..."
                    value={biltySearch}
                    onChange={(e) => setBiltySearch(e.target.value)}
                    className="pl-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-xs w-full"
                  />
                </div>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 w-full sm:w-auto"
                >
                  <option value="KARACHI">Karachi</option>
                  <option value="LAHORE">Lahore</option>
                  <option value="">All Stations</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-9 text-xs rounded-xl font-bold whitespace-nowrap w-full sm:w-auto"
                >
                  {filteredBilties.length > 0 &&
                  filteredBilties.every((b) => selectedBiltyIds.includes(b.id))
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>

            {/* Bilties Selection Table */}
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredBilties.length > 0 &&
                          filteredBilties.every((b) => selectedBiltyIds.includes(b.id))
                        }
                        onChange={toggleSelectAll}
                        className="rounded accent-spd-red w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Bilty #</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Goods / Item</th>
                    <th className="p-3">Shipper / Receiver</th>
                    <th className="p-3 text-right">Weight & CBM</th>
                    <th className="p-3 text-right">Freight</th>
                    <th className="p-3 text-center">Pay Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <LogisticsLoader size="sm" subtitle="Loading Warehouse Consignments..." />
                      </td>
                    </tr>
                  ) : filteredBilties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No consignments waiting in warehouse. Click &apos;New Consignment Bilty&apos; to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredBilties.map((b) => {
                      const isSelected = selectedBiltyIds.includes(b.id);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => toggleSelectBilty(b.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-red-50/70 dark:bg-red-950/30"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                             <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectBilty(b.id)}
                              className="rounded accent-spd-red w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-bold font-mono text-red-600 block">
                              {b.biltyNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {b.trackingId}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold block text-slate-800 dark:text-slate-200">
                              {b.origin} → {b.destination}
                            </span>
                            <span className="text-[10px] text-slate-400">{b.warehouse || "Karachi"}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold block text-slate-800 dark:text-slate-200">
                              {b.packageDetails || b.description || "General Cargo"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {b.quantity ? `${b.quantity} Pkg${b.quantity > 1 ? "s" : ""}` : "1 Pkg"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold block text-slate-800 dark:text-slate-200">
                              {b.senderName}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              To: {b.receiverName}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold whitespace-nowrap">
                            <span className="block text-slate-900 dark:text-white">
                              {b.weight
                                ? `${b.weight} kg | ${b.cbm || b.volume || (Math.round((Number(b.weight) / 330) * 10) / 10).toFixed(1)} CBM`
                                : "—"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrency(b.freight || 0)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                b.remainingBalance <= 0
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {b.remainingBalance <= 0 ? "PAID" : "TO-PAY"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Sticky Counter Summary Card (Matching Reference Bottom Bar) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Bilties Selected
                </span>
                <span className="text-xl font-black text-white">
                  {selectedBiltyIds.length} Consignments
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Payload Weight
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {totalSelectedWeight.toLocaleString()} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Bilty Freight
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatCurrency(totalGrossFreight)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: CHALLAN SETUP & REAL-TIME PROFIT CALCULATOR     */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Challan Trip Parameters */}
            <FormSectionCard
              title="Trip Dispatch Parameters"
              badge="Setup"
              description="Corridor route, origin warehouse, and sequential Challan ID"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Challan # *
                </Label>
                <Input
                  required
                  placeholder=""
                  value={challanData.challanNumber}
                  onChange={(e) =>
                    setChallanData({ ...challanData, challanNumber: e.target.value.toUpperCase() })
                  }
                  className="rounded-xl h-10 text-xs font-mono uppercase font-black"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Dispatch Date *
                </Label>
                <Input
                  type="date"
                  required
                  value={challanData.date}
                  onChange={(e) => setChallanData({ ...challanData, date: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  From (Booking Station) *
                </Label>
                <HybridCombobox
                  value={challanData.origin}
                  onChange={(val) => setChallanData({ ...challanData, origin: val })}
                  options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  To (Delivery Station) *
                </Label>
                <HybridCombobox
                  value={challanData.destination}
                  onChange={(val) => setChallanData({ ...challanData, destination: val })}
                  options={PAKISTAN_CITIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
            </FormSectionCard>

            {/* Vehicle & Driver / Broker Assignment */}
            <FormSectionCard
              title="Fleet & Personnel Assignment"
              badge="Fleet / Broker"
              description="Assign company fleet truck or hire market vehicle through commission broker"
            >
              {/* Hiring Mode Toggle */}
              <div className="col-span-1 sm:col-span-2 space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Vehicle Source / Hiring Mode *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChallanData((prev) => ({ ...prev, hiringMode: "COMPANY_FLEET" }))}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border",
                      challanData.hiringMode === "COMPANY_FLEET"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Company Fleet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChallanData((prev) => ({ ...prev, hiringMode: "MARKET_BROKER" }))}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border",
                      challanData.hiringMode === "MARKET_BROKER"
                        ? "bg-spd-blue text-white border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Market Vehicle (Broker)</span>
                  </button>
                </div>
              </div>

              {challanData.hiringMode === "MARKET_BROKER" ? (
                <>
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Select Commission Broker *
                    </Label>
                    <SearchableSelect
                      options={brokerOptions}
                      value={challanData.brokerId}
                      onChange={handleBrokerSelect}
                      placeholder=""
                      emptyMessage="No brokers registered"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Market Truck Registration # *
                    </Label>
                    <HybridCombobox
                      value={challanData.truckNumber}
                      onChange={(val) =>
                        setChallanData({ ...challanData, truckNumber: val.toUpperCase() })
                      }
                      options={vehicles.map((v) => ({
                        value: v.vehicleNumber,
                        label: v.vehicleNumber,
                        sublabel: v.ownerName || "Vehicle",
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Driver Name *
                    </Label>
                    <HybridCombobox
                      value={challanData.driverName}
                      onChange={(val) => {
                        const d = drivers.find((drv) => drv.name === val);
                        setChallanData({
                          ...challanData,
                          driverName: val,
                          driverPhone: d ? d.phone || d.contact || challanData.driverPhone : challanData.driverPhone,
                        });
                      }}
                      options={driverNameOptions}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Driver Phone
                    </Label>
                    <Input
                      placeholder=""
                      value={challanData.driverPhone}
                      onChange={(e) =>
                        setChallanData({ ...challanData, driverPhone: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Broker Contact Phone
                    </Label>
                    <Input
                      placeholder=""
                      value={challanData.brokerPhone}
                      onChange={(e) =>
                        setChallanData({ ...challanData, brokerPhone: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Broker Agreed Freight (PKR) *
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder=""
                      value={challanData.brokerFreight}
                      onChange={(e) =>
                        setChallanData({ ...challanData, brokerFreight: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Advance Paid to Broker (PKR)
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder=""
                      value={challanData.brokerAdvance}
                      onChange={(e) =>
                        setChallanData({ ...challanData, brokerAdvance: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-900 dark:text-blue-200">Balance Payable to Broker:</span>
                    <span className="font-mono text-sm font-black text-rose-600">
                      ₨ {Math.max(0, (parseFloat(challanData.brokerFreight) || 0) - (parseFloat(challanData.brokerAdvance) || 0)).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Select Fleet Truck / Vehicle *
                    </Label>
                    <SearchableSelect
                      options={vehicleOptions}
                      value={challanData.vehicleId}
                      onChange={handleVehicleSelect}
                      placeholder=""
                      emptyMessage="No available vehicles"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Assigned Driver *
                    </Label>
                    <SearchableSelect
                      options={driverOptions}
                      value={challanData.driverId}
                      onChange={handleDriverSelect}
                      placeholder=""
                      emptyMessage="No available drivers"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Driver Phone Number
                    </Label>
                    <Input
                      placeholder=""
                      value={challanData.driverPhone}
                      onChange={(e) =>
                        setChallanData({ ...challanData, driverPhone: e.target.value })
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                </>
              )}
            </FormSectionCard>

            {/* Trip Expenses & Profit Calculator (Matching Reference Formula) */}
            <FormSectionCard
              title="Trip Rate & Profit Calculation"
              badge="Profit"
              description="Real-time profit calculator: Net Profit = Total Freight - Truck Cost"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Truck Freight / Rate (PKR) *
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={challanData.truckFreight}
                  onChange={(e) =>
                    setChallanData({ ...challanData, truckFreight: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Advance Paid (PKR)
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={challanData.advancePaidToDriver}
                  onChange={(e) =>
                    setChallanData({ ...challanData, advancePaidToDriver: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              {/* REAL-TIME PROFIT DASHBOARD */}
              <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-slate-900 text-white space-y-3 mt-1">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Real-Time Profit Calculator
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      netTripProfit >= 0
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {profitMargin.toFixed(1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Customer Freight:</span>
                    <span className="font-mono text-slate-200">
                      {formatCurrency(totalGrossFreight)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isBroker ? "Broker Transport Rate:" : "Truck Transport Cost:"}</span>
                    <span className="font-mono text-red-300">
                      - {formatCurrency(truckFreightCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isBroker ? "Broker Advance Paid:" : "Driver Advance Paid:"}</span>
                    <span className="font-mono text-slate-200">
                      {formatCurrency(driverAdvancePaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isBroker ? "Broker Balance Payable:" : "Driver Balance Payable:"}</span>
                    <span className="font-mono text-amber-300">
                      {formatCurrency(driverBalanceDue)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Net Estimated Profit:
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      netTripProfit >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(netTripProfit)}
                  </span>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Dispatch Notes
                </Label>
                <Input
                  value={challanData.notes}
                  onChange={(e) => setChallanData({ ...challanData, notes: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </FormSectionCard>

            {/* Action Button */}
            <Button
              type="submit"
              disabled={submitting || selectedBiltyIds.length === 0}
              className="w-full bg-spd-blue hover:bg-spd-blueHover text-white font-black text-sm rounded-xl shadow-lg gap-2 h-12"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              <span>Generate & Dispatch Challan ({selectedBiltyIds.length} Bilties)</span>
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
