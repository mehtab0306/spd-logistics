"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Camera,
  Upload,
  Maximize2,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportToExcel, export4SheetBiltyExcel } from "@/lib/export-excel";
import { BiltySheetViewer } from "@/components/bilty/bilty-sheet-viewer";
import {
  getStoredBilties,
  saveStoredBilty,
  removeStoredBilty,
  purgeCorruptedBiltyStorage,
  getDeletedBiltyIds as getStoredDeletedBiltyIds,
  getStoredCustomers,
  getDeletedCustomerIds,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  mergeLocalWithApi,
  setCookieCache,
} from "@/lib/local-persistence";
import {
  buildWhatsAppUrl,
  getBiltyTrackingWhatsAppMessage,
  getAdminToDriverWhatsAppMessage,
} from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function BiltyPage() {
  const router = useRouter();
  const [consignments, setConsignments] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(consignments);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

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
  const [receiverCustSearchTerm, setReceiverCustSearchTerm] = useState("");
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  const [vehSearchTerm, setVehSearchTerm] = useState("");

  // Smart Search term states for Edit modal
  const [editCustSearchTerm, setEditCustSearchTerm] = useState("");
  const [editReceiverCustSearchTerm, setEditReceiverCustSearchTerm] = useState("");
  const [editDriverSearchTerm, setEditDriverSearchTerm] = useState("");
  const [editVehSearchTerm, setEditVehSearchTerm] = useState("");

  // High-Resolution Full View Photo Lightbox Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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
    photos: [] as string[],
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
    photos: [] as string[],
  });

  // Status Update Modal State
  const [statusUpdate, setStatusUpdate] = useState({
    shipmentStatus: "IN_TRANSIT",
    location: "",
    statusNote: "",
    receivedBy: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
  });

  const DEFAULT_CLIENT_CONSIGNMENTS: any[] = [];
  const DEFAULT_CUSTOMERS: any[] = [];
  const DEFAULT_DRIVERS: any[] = [];
  const DEFAULT_VEHICLES: any[] = [];

  // LocalStorage helpers for 100% offline & serverless resilience
  const getLocalBilties = (): any[] => {
    return getStoredBilties();
  };

  const saveLocalBilty = (bilty: any) => {
    if (typeof window === "undefined") return;
    try {
      saveStoredBilty(bilty);

      // Auto-set driver status to ON_TRIP when assigned to an active Bilty that is dispatched/In-Transit
      if (bilty.shipmentStatus === "IN_TRANSIT" || bilty.shipmentStatus === "DISPATCHED") {
        const driverId = bilty.driverId || bilty.driver?.id;
        const driverName = bilty.driverName || bilty.driver?.name;
        if (driverId || driverName) {
          try {
            const drivers = getStoredDrivers();
            let updated = false;
            const nextDrivers = drivers.map((d: any) => {
              if ((driverId && String(d.id) === String(driverId)) || (driverName && d.name?.toLowerCase().trim() === driverName.toLowerCase().trim())) {
                updated = true;
                return { ...d, status: "ON_TRIP" };
              }
              return d;
            });
            if (updated) {
              localStorage.setItem("spd_drivers", JSON.stringify(nextDrivers));
              localStorage.setItem("spd_local_drivers", JSON.stringify(nextDrivers));
            }
          } catch (dErr) {
            console.warn("Auto update driver status error:", dErr);
          }
        }
      }
    } catch (err) {
      console.warn("Save local bilty error:", err);
    }
  };

  const removeLocalBilty = (id: string, recordToTrash?: any) => {
    removeStoredBilty(id, recordToTrash);
  };

  const getDeletedBiltyIds = (): string[] => {
    return getStoredDeletedBiltyIds();
  };

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        purgeCorruptedBiltyStorage();
      }

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (warehouseFilter) params.append("warehouse", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);

      let supabaseBilties: any[] = [];
      if (isSupabaseConfigured) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Supabase timeout")), 2500)
          );
          const fetchPromise = supabase
            .from("bilties")
            .select("*")
            .order("created_at", { ascending: false });
          const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]);
          if (!error && Array.isArray(data) && data.length > 0) {
            supabaseBilties = data.map((r: any) => ({
              id: r.id,
              biltyNumber: r.bilty_number || r.id,
              trackingId: r.bilty_number || r.id,
              bookingDate: r.booking_date || r.created_at,
              senderName: r.sender_name,
              senderPhone: r.sender_phone,
              receiverName: r.receiver_name,
              receiverPhone: r.receiver_phone,
              origin: r.origin,
              destination: r.destination,
              itemDescription: r.item_description,
              packagesCount: r.packages_count,
              weight: r.weight,
              totalFreight: r.total_freight,
              totalAmount: r.total_freight,
              paymentMode: r.payment_mode,
              shipmentStatus: (r.status || "BOOKED").toUpperCase(),
              createdAt: r.created_at,
              ...r,
            }));
          }
        } catch (sbErr) {
          console.warn("Supabase fetch bilties warning:", sbErr);
        }
      }

      let apiItems: any[] = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`/api/admin/bilty?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          apiItems = data.data;
        } else {
          apiItems = [...DEFAULT_CLIENT_CONSIGNMENTS];
        }
      } catch (err) {
        apiItems = [...DEFAULT_CLIENT_CONSIGNMENTS];
      }

      // Merge Supabase bilties + locally stored bilties (kept at top) with API seed bilties
      const localBilties = getLocalBilties();
      const combinedActive = supabaseBilties.length > 0
        ? mergeLocalWithApi(supabaseBilties, localBilties, getDeletedBiltyIds(), "biltyNumber")
        : localBilties;
      const deletedIds = getDeletedBiltyIds();
      let items = mergeLocalWithApi(combinedActive, apiItems, deletedIds, "biltyNumber").filter(
        (b) =>
          b &&
          b.shipmentStatus !== "DELETED" &&
          !String(b.id || "").startsWith("bilty-demo-") &&
          !String(b.id || "").startsWith("cust-") &&
          !String(b.biltyNumber || "").startsWith("cust-") &&
          !String(b.id || "").startsWith("c-") &&
          !String(b.biltyNumber || "").startsWith("c-") &&
          (b.senderName || b.receiverName || b.biltyNumber)
      );

      // Apply search and filter to merged list
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (b) =>
            b.biltyNumber?.toLowerCase().includes(q) ||
            b.trackingId?.toLowerCase().includes(q) ||
            b.senderName?.toLowerCase().includes(q) ||
            b.receiverName?.toLowerCase().includes(q) ||
            b.origin?.toLowerCase().includes(q) ||
            b.destination?.toLowerCase().includes(q)
        );
      }
      if (warehouseFilter) {
        items = items.filter((b) => b.warehouse === warehouseFilter);
      }
      if (statusFilter) {
        items = items.filter((b) => b.shipmentStatus === statusFilter);
      }

      // Strict deduplication safeguard across consignments
      const dedupedItems: any[] = [];
      const seenBiltyIds = new Set<string>();
      const seenBiltyNumbers = new Set<string>();

      for (const item of items) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        const bNum = String(item.biltyNumber || "").trim().toUpperCase();
        if (seenBiltyIds.has(id)) continue;
        if (bNum && seenBiltyNumbers.has(bNum)) continue;

        seenBiltyIds.add(id);
        if (bNum) seenBiltyNumbers.add(bNum);
        dedupedItems.push(item);
      }

      setConsignments(dedupedItems);
    } catch (err) {
      console.warn("Error fetching consignments, using fallback list:", err);
      const cleanFallback = mergeLocalWithApi(getLocalBilties(), DEFAULT_CLIENT_CONSIGNMENTS, getDeletedBiltyIds(), "biltyNumber").filter(
        (b) =>
          b &&
          b.shipmentStatus !== "DELETED" &&
          !String(b.id || "").startsWith("bilty-demo-") &&
          !String(b.id || "").startsWith("cust-") &&
          !String(b.biltyNumber || "").startsWith("cust-") &&
          !String(b.id || "").startsWith("c-") &&
          !String(b.biltyNumber || "").startsWith("c-") &&
          (b.senderName || b.receiverName || b.biltyNumber)
      );
      setConsignments(cleanFallback);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const fetchDependencies = async () => {
    try {
      let supabaseCustomers: any[] = [];
      let supabaseDrivers: any[] = [];
      if (isSupabaseConfigured) {
        try {
          const { data: sbCust } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
          if (Array.isArray(sbCust)) {
            supabaseCustomers = sbCust.map((c: any) => ({
              id: c.id,
              name: c.name,
              companyName: c.company_name || c.name,
              phone: c.phone,
              email: c.email,
              address: c.address,
              city: c.city,
              ntn: c.ntn,
              status: c.status || "ACTIVE",
              ...c,
            }));
          }
        } catch (e) {
          console.warn("Supabase fetch customers warning in bilty:", e);
        }
        try {
          const { data: sbDrv } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
          if (Array.isArray(sbDrv)) {
            supabaseDrivers = sbDrv.map((d: any) => ({
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
          console.warn("Supabase fetch drivers warning in bilty:", e);
        }
      }

      const [custRes, drivRes, vehRes] = await Promise.all([
        fetch("/api/admin/customers").catch(() => null),
        fetch("/api/admin/drivers").catch(() => null),
        fetch("/api/admin/vehicles").catch(() => null),
      ]);
      const [custData, drivData, vehData] = await Promise.all([
        custRes ? custRes.json().catch(() => ({})) : Promise.resolve({}),
        drivRes ? drivRes.json().catch(() => ({})) : Promise.resolve({}),
        vehRes ? vehRes.json().catch(() => ({})) : Promise.resolve({}),
      ]);
      const apiCustomers = custData.success && custData.data?.length ? custData.data : DEFAULT_CUSTOMERS;
      const apiDrivers = drivData.success && drivData.data?.length ? drivData.data : DEFAULT_DRIVERS;
      const apiVehicles = vehData.success && vehData.data?.length ? vehData.data : DEFAULT_VEHICLES;

      const localCust = getStoredCustomers();
      const combinedActiveCust = supabaseCustomers.length > 0
        ? mergeLocalWithApi(supabaseCustomers, localCust, getDeletedCustomerIds())
        : localCust;
      const rawCustomers = mergeLocalWithApi(combinedActiveCust, apiCustomers, getDeletedCustomerIds());

      const dedupedCust: any[] = [];
      const seenCustIds = new Set<string>();
      const seenCustPhones = new Set<string>();
      const seenCustNames = new Set<string>();
      for (const item of rawCustomers) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        if (seenCustIds.has(id)) continue;
        const normPhone = item.phone ? String(item.phone).replace(/[^0-9]/g, "") : "";
        const normName = item.name ? String(item.name).trim().toLowerCase() : "";
        if (normPhone.length >= 7 && seenCustPhones.has(normPhone)) continue;
        if (normName.length > 1 && seenCustNames.has(normName)) continue;
        seenCustIds.add(id);
        if (normPhone.length >= 7) seenCustPhones.add(normPhone);
        if (normName.length > 1) seenCustNames.add(normName);
        dedupedCust.push(item);
      }

      const localDrv = getStoredDrivers();
      const combinedActiveDrv = supabaseDrivers.length > 0
        ? mergeLocalWithApi(supabaseDrivers, localDrv, getDeletedDriverIds())
        : localDrv;
      const rawDrivers = mergeLocalWithApi(combinedActiveDrv, apiDrivers, getDeletedDriverIds());

      const dedupedDrv: any[] = [];
      const seenDrvIds = new Set<string>();
      const seenDrvPhones = new Set<string>();
      const seenDrvNames = new Set<string>();
      for (const item of rawDrivers) {
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
        dedupedDrv.push(item);
      }

      setCustomers(dedupedCust);
      setDrivers(dedupedDrv);
      setVehicles(mergeLocalWithApi(getStoredVehicles(), apiVehicles, getDeletedVehicleIds(), "registrationNumber"));
    } catch (err) {
      console.warn("Error fetching dependencies, using fallbacks:", err);
      setCustomers(getStoredCustomers());
      setDrivers(getStoredDrivers());
      setVehicles(getStoredVehicles());
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBilty?.id) return;
    setDeleteLoading(true);
    try {
      // Remove locally immediately & move to Recycle Bin
      removeLocalBilty(deletingBilty.id, deletingBilty);
      setConsignments((prev) => prev.filter((b) => b.id !== deletingBilty.id));

      // Supabase cloud deletion
      if (isSupabaseConfigured) {
        try {
          await supabase.from("bilties").delete().eq("id", deletingBilty.id);
        } catch (sbErr) {
          console.warn("Supabase bilty delete warning:", sbErr);
        }
      }

      // Background API call
      fetch(`/api/admin/bilty?id=${encodeURIComponent(deletingBilty.id)}`, {
        method: "DELETE",
      }).catch(() => {});

      setActionFeedback({
        type: "success",
        text: `Bilty ${deletingBilty.biltyNumber || ""} (${deletingBilty.trackingId || ""}) was successfully deleted.`,
      });
      setDeleteStep(0);
      setDeletingBilty(null);
    } catch (err: any) {
      console.error("Delete bilty error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 1. Load data strictly once when client mounts
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("spd_bilties") ||
        localStorage.getItem("spd_local_bilties") ||
        sessionStorage.getItem("spd_bilties");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(
            (b: any) =>
              b &&
              (b.id || b.biltyNumber) &&
              !String(b.id || "").startsWith("cust-") &&
              !String(b.biltyNumber || "").startsWith("cust-") &&
              !String(b.id || "").startsWith("c-") &&
              !String(b.id || "").startsWith("bilty-demo-")
          );
          if (clean.length > 0) {
            setConsignments(clean);
          }
        }
      }
    } catch (err) {
      console.error("Error loading bilties on mount:", err);
    } finally {
      setIsLoaded(true); // Mark client ready
    }
  }, []);

  // 2. Only write back to localStorage AFTER initial load has completed
  useEffect(() => {
    if (!isLoaded) return; // CRITICAL: NEVER overwrite storage before initial load completes!
    if (consignments.length > 0) {
      try {
        const serialized = JSON.stringify(consignments);
        localStorage.setItem("spd_bilties", serialized);
        localStorage.setItem("spd_local_bilties", serialized);
        localStorage.setItem("bilties", serialized);
        sessionStorage.setItem("spd_bilties", serialized);
        setCookieCache("spd_bilties_cache", serialized);
      } catch (err) {
        console.warn("Sync bilties to storage error:", err);
      }
    }
  }, [consignments, isLoaded]);

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
      photos: [] as string[],
    });
    setCustSearchTerm("");
    setReceiverCustSearchTerm("");
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
      photos: bilty.photos || [],
    });
    setEditCustSearchTerm("");
    setEditReceiverCustSearchTerm("");
    setEditDriverSearchTerm("");
    setEditVehSearchTerm("");
    setEditFormError("");
    setEditBiltyOpen(true);
  };

  // Handle Shipper / Sender Customer Selection
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

  // Handle Consignee / Receiver Customer Selection (Task 1)
  const handleSelectReceiverCustomer = (cust: any, isEdit = false) => {
    const rName = cust ? (cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name) : "";
    const rPhone = cust ? cust.phone || "" : "";
    const rAddr = cust ? cust.address || (cust.city ? `${cust.city}, Pakistan` : "") : "";

    if (isEdit) {
      setEditFormData((prev: any) => ({
        ...prev,
        receiverName: rName || prev.receiverName,
        receiverPhone: rPhone || prev.receiverPhone,
        receiverAddress: rAddr || prev.receiverAddress,
      }));
      setEditReceiverCustSearchTerm("");
    } else {
      setFormData((prev) => ({
        ...prev,
        receiverName: rName || prev.receiverName,
        receiverPhone: rPhone || prev.receiverPhone,
        receiverAddress: rAddr || prev.receiverAddress,
      }));
      setReceiverCustSearchTerm("");
    }
  };

  // Convert File to compressed Base64 string for client-safe persistence (Task 2)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        try {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            } else {
              resolve(result);
            }
          };
          img.onerror = () => resolve(result);
          img.src = result;
        } catch {
          resolve(result);
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Add cargo photos (Max 3 photos)
  const handleAddPhotos = async (files: FileList | null, isEdit = false) => {
    if (!files || files.length === 0) return;
    const currentList = isEdit ? (editFormData.photos || []) : (formData.photos || []);
    const remainingSlots = 3 - currentList.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: string[] = [];
    for (const f of filesToProcess) {
      const b64 = await fileToBase64(f);
      if (b64) newPhotos.push(b64);
    }

    if (isEdit) {
      setEditFormData((prev: any) => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos].slice(0, 3),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos].slice(0, 3),
      }));
    }
  };

  // Remove photo by index
  const handleRemovePhoto = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev: any) => ({
        ...prev,
        photos: (prev.photos || []).filter((_: any, i: number) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        photos: (prev.photos || []).filter((_: any, i: number) => i !== index),
      }));
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
    if (submitting) return;
    setSubmitting(true);
    setFormError("");

    try {
      const manualBiltyNo = formData.biltyNumber?.trim();
      const finalBiltyNumber = manualBiltyNo
        ? manualBiltyNo
        : `SPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const freightAmount = Number(formData.freight) || 0;
      const labourCharges = Number(formData.additionalCharges) || 0;
      const otherCharges = 0;
      const discNum = Number(formData.discount) || 0;
      const totalAmount = Math.max(0, freightAmount + labourCharges + otherCharges - discNum);
      const paidAmount = Number(formData.paidAmount) || 0;
      const remainingBalance = Math.max(0, totalAmount - paidAmount);
      const paymentMode = remainingBalance <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "TO-PAY";
      const bookingDate = formData.date ? formData.date.slice(0, 10) : new Date().toISOString().split("T")[0];
      const itemDesc = formData.packageDetails?.trim() || "General Commercial Cargo";
      const pkgCount = Number(formData.quantity) || 1;
      const grossWeight = Number(formData.weight) || 0;

      const createdBilty = {
        id: finalBiltyNumber,
        biltyNumber: finalBiltyNumber,
        trackingId: formData.trackingId?.trim() || `SPD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        bookingDate,

        // Consignor & Consignee
        senderName: formData.senderName?.trim() || "",
        senderPhone: formData.senderPhone?.trim() || "",
        senderAddress: formData.senderAddress?.trim() || "",
        receiverName: formData.receiverName?.trim() || "",
        receiverPhone: formData.receiverPhone?.trim() || "",
        receiverAddress: formData.receiverAddress?.trim() || "",

        // Route
        origin: formData.origin?.trim() || "Lahore",
        destination: formData.destination?.trim() || "Karachi",
        warehouse: formData.warehouse || "LAHORE",

        // Cargo Details (MUST NOT BE DROPPED)
        itemDescription: itemDesc,
        packageDetails: itemDesc,
        packagingType: "Bags / Cartons",
        packagesCount: pkgCount,
        quantity: pkgCount,
        weight: grossWeight,

        // Financials & Terms
        freightAmount,
        freight: freightAmount,
        labourCharges,
        otherCharges,
        additionalCharges: labourCharges + otherCharges,
        discount: discNum,
        totalFreight: totalAmount,
        totalAmount,
        paidAmount,
        remainingBalance,
        paymentMode,
        paymentStatus: paymentMode === "PAID" ? "PAID" : "TO_PAY",

        status: "Booked",
        shipmentStatus: formData.shipmentStatus || "BOOKED",
        vehicleId: formData.vehicleId || undefined,
        vehicleNumber: formData.vehicleNumber || "LES-8921",
        driverId: formData.driverId || undefined,
        driverName: formData.driverName || "Muhammad Khan",
        notes: formData.notes || "",
        photos: formData.photos || [],
        createdAt: new Date().toISOString(),
        trackingEvents: [
          {
            id: `te_${Date.now()}`,
            status: formData.shipmentStatus || "BOOKED",
            location: `${formData.origin || "Lahore"} Dispatch Station`,
            description: `Consignment Bilty #${finalBiltyNumber} booked for transit to ${formData.destination || "Karachi"}.`,
            timestamp: new Date(),
          },
        ],
        payments: paidAmount > 0 ? [
          { id: `p_${Date.now()}`, amount: paidAmount, paymentMethod: "CASH", paymentType: "ADVANCE", date: new Date() }
        ] : [],
      };

      // Load existing bilties & deduplicate (Section 2)
      const existingBilties = getStoredBilties();
      const updated = [createdBilty, ...existingBilties.filter((b: any) => String(b.biltyNumber || b.id).trim().toUpperCase() !== finalBiltyNumber.toUpperCase())];

      if (typeof window !== "undefined") {
        localStorage.setItem("spd_bilties", JSON.stringify(updated));
        localStorage.setItem("spd_local_bilties", JSON.stringify(updated));
        localStorage.setItem("bilties", JSON.stringify(updated));
      }
      saveStoredBilty(createdBilty);
      setConsignments(updated);

      // Supabase cloud database insertion
      if (isSupabaseConfigured) {
        try {
          await supabase.from("bilties").upsert([
            {
              id: String(createdBilty.id),
              bilty_number: finalBiltyNumber,
              booking_date: createdBilty.bookingDate,
              sender_name: createdBilty.senderName,
              sender_phone: createdBilty.senderPhone,
              receiver_name: createdBilty.receiverName,
              receiver_phone: createdBilty.receiverPhone,
              origin: createdBilty.origin,
              destination: createdBilty.destination,
              item_description: createdBilty.itemDescription,
              packages_count: Number(createdBilty.packagesCount) || 1,
              weight: Number(createdBilty.weight) || 0,
              total_freight: Number(createdBilty.totalFreight) || 0,
              payment_mode: createdBilty.paymentMode || "TO-PAY",
              status: createdBilty.shipmentStatus || "Booked",
            },
          ]);
        } catch (sbErr) {
          console.warn("Supabase bilty upsert warning:", sbErr);
        }
      }

      // Background API attempt
      fetch("/api/admin/bilty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createdBilty),
      }).catch((err) => console.warn("Background bilty API save:", err));

      setNewBiltyOpen(false);
      const successMsg = `Bilty [${finalBiltyNumber}] saved successfully with all cargo particulars.`;
      setActionFeedback({ type: "success", text: successMsg });
      setTimeout(() => setActionFeedback(null), 4000);
      setPrintBilty(createdBilty);
    } catch (err: any) {
      setFormError(err.message || "Failed to create consignment bilty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBilty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setEditFormError("");

    try {
      const freightNum = parseFloat(editFormData.freight) || 0;
      const addlNum = parseFloat(editFormData.additionalCharges) || 0;
      const discNum = parseFloat(editFormData.discount) || 0;
      const paidNum = parseFloat(editFormData.paidAmount) || 0;
      const tot = Math.max(0, freightNum + addlNum - discNum);
      const rem = Math.max(0, tot - paidNum);
      const pStatus = rem <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "PENDING";

      const updatedBilty = {
        ...editFormData,
        freight: freightNum,
        freightAmount: freightNum,
        additionalCharges: addlNum,
        discount: discNum,
        totalFreight: tot,
        totalAmount: tot,
        paidAmount: paidNum,
        remainingBalance: rem,
        paymentStatus: pStatus,
        paymentMode: rem <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "TO-PAY",
        quantity: parseInt(editFormData.quantity) || 1,
        packagesCount: parseInt(editFormData.quantity) || 1,
        weight: editFormData.weight ? parseFloat(editFormData.weight) : null,
        itemDescription: editFormData.packageDetails || "General Cargo",
        packageDetails: editFormData.packageDetails || "General Cargo",
        photos: editFormData.photos || [],
      };

      // Save locally immediately
      saveLocalBilty(updatedBilty);

      // Update state immediately
      setConsignments((prev) =>
        prev.map((b) => (b.id === updatedBilty.id ? { ...b, ...updatedBilty } : b))
      );

      // Background API attempt
      fetch("/api/admin/bilty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      }).catch(() => {});

      setEditBiltyOpen(false);
      setActionFeedback({ type: "success", text: `Bilty #${editFormData.biltyNumber} updated successfully.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setEditFormError(err.message || "Failed to update consignment bilty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalBilty) return;

    setSubmitting(true);
    try {
      const newEvent = {
        id: `te_${Date.now()}`,
        status: statusUpdate.shipmentStatus,
        location: statusUpdate.location || "En Route Station",
        description: statusUpdate.statusNote || `Status updated to ${statusUpdate.shipmentStatus}`,
        timestamp: new Date(),
      };

      const updatedBilty = {
        ...statusModalBilty,
        shipmentStatus: statusUpdate.shipmentStatus,
        deliveryDate: statusUpdate.deliveryDate,
        receivedBy: statusUpdate.receivedBy,
        trackingEvents: [newEvent, ...(statusModalBilty.trackingEvents || [])],
      };

      // Save locally immediately
      saveLocalBilty(updatedBilty);

      // Update state immediately
      setConsignments((prev) =>
        prev.map((b) => (b.id === statusModalBilty.id ? updatedBilty : b))
      );

      // Background API call
      fetch("/api/admin/bilty", {
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
      }).catch(() => {});

      setStatusModalBilty(null);
      setActionFeedback({ type: "success", text: `Shipment status updated to ${statusUpdate.shipmentStatus}.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      "SPD_Bilties_Export",
      [
        { header: "Bilty #", accessor: (b) => b.biltyNumber || "" },
        { header: "Tracking ID", accessor: (b) => b.trackingId || "" },
        { header: "Booking Date", accessor: (b) => b.date ? new Date(b.date).toLocaleDateString("en-GB") : "" },
        { header: "From (Station)", accessor: (b) => b.origin || "" },
        { header: "To (Station)", accessor: (b) => b.destination || "" },
        { header: "Sender / Consignor", accessor: (b) => b.senderName || "" },
        { header: "Sender Phone", accessor: (b) => b.senderPhone || "" },
        { header: "Receiver / Consignee", accessor: (b) => b.receiverName || "" },
        { header: "Receiver Phone", accessor: (b) => b.receiverPhone || "" },
        { header: "Cargo / Goods Details", accessor: (b) => b.packageDetails || "" },
        { header: "Packages / Qty", accessor: (b) => b.quantity || 1 },
        { header: "Weight (Kg)", accessor: (b) => b.weight || "" },
        { header: "Vehicle", accessor: (b) => b.vehicleNumber || b.vehicle?.vehicleNumber || "Unassigned" },
        { header: "Driver", accessor: (b) => b.driverName || b.driver?.name || "Unassigned" },
        { header: "Base Freight (PKR)", accessor: (b) => b.freight || 0 },
        { header: "Total Amount (PKR)", accessor: (b) => b.totalAmount || 0 },
        { header: "Paid Amount (PKR)", accessor: (b) => b.paidAmount || 0 },
        { header: "Remaining Balance (PKR)", accessor: (b) => b.remainingBalance ?? ((b.totalAmount || 0) - (b.paidAmount || 0)) },
        { header: "Payment Status", accessor: (b) => b.paymentStatus || "PENDING" },
        { header: "Shipment Status", accessor: (b) => b.shipmentStatus || "BOOKED" },
      ],
      consignments
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Bilty & Consignments Management
          </h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="rounded-xl text-xs sm:text-sm font-bold gap-2 h-10 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 text-slate-700 dark:text-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
          <Button
            onClick={() => router.push("/admin/bilty/new")}
            className="w-full sm:w-auto bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md gap-2 h-10 px-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Consignment Bilty</span>
          </Button>
        </div>
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
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="p-1 hover:opacity-75 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Bilty #, tracking, sender, receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs w-full"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]"
          >
            <option value="">All Stations</option>
            <option value="LAHORE">Lahore</option>
            <option value="KARACHI">Karachi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[130px]"
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
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bilties Content */}
      {loading && !isLoaded ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-400 font-semibold">Loading consignments...</p>
        </div>
      ) : consignments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Consignments Found"
          description="Click 'New Consignment Bilty' to add one."
          actionLabel="New Consignment Bilty"
          actionHref="/admin/bilty/new"
        />
      ) : (
        <>
          {/* MOBILE CARDS VIEW (< 768px) */}
          <div className="block md:hidden space-y-3">
            {consignments.map((c) => {
              const targetPhone = c.receiver?.whatsapp || c.receiverPhone || c.receiver?.phone || c.customer?.whatsapp || c.customer?.phone;
              const waMsg = targetPhone ? getBiltyTrackingWhatsAppMessage({
                biltyNumber: c.biltyNumber || c.id,
                trackingId: c.trackingId,
                status: c.shipmentStatus || c.status,
                origin: c.origin,
                destination: c.destination,
              }) : "";

              const mode = String(c.paymentMode || c.paymentStatus || c.amountType || "").toUpperCase();
              const isPaid = mode === "PAID";
              const isBilled = mode === "BILLED" || mode === "TO_BE_BILLED" || mode === "TO BE BILLED";
              const isToPay = mode === "TO-PAY" || mode === "TO_PAY" || mode === "TO PAY" || mode === "UNPAID" || (!isPaid && !isBilled);

              const cargoDesc = c.itemDescription || c.packageDetails || (c.items && c.items[0]?.detail) || "-";
              const pkgsCount = c.packagesCount || c.quantity || "-";
              const cargoWeight = c.weight !== null && c.weight !== undefined && Number(c.weight) > 0 ? `${Number(c.weight).toLocaleString()} KG` : "-";

              return (
                <div
                  key={c.id || c.biltyNumber}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  {/* Card Header: Bilty #, Tracking & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <Link
                        href={`/admin/bilty/${encodeURIComponent(c.id || c.biltyNumber)}`}
                        className="font-black text-sm text-spd-blue hover:text-spd-red hover:underline block font-mono"
                        title="View / Print 4-Sheet Dossier"
                      >
                        {c.biltyNumber || c.id || "-"}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono font-bold">{c.trackingId || "-"}</p>
                      <p className="text-[10px] text-slate-400">
                        {c.bookingDate ? formatDate(c.bookingDate) : c.date ? formatDate(c.date) : "-"}
                      </p>
                    </div>
                    <div>
                      {isPaid ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300">
                          PAID
                        </span>
                      ) : isBilled ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300">
                          BILLED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300">
                          TO-PAY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Hub */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black">{c.origin || "-"}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="font-black text-spd-blue">{c.destination || "-"}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        (c.warehouse || c.origin || "").toUpperCase().includes("KARACHI")
                          ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-red-100 text-spd-red dark:bg-red-950/60 dark:text-red-400"
                      }`}
                    >
                      {c.warehouse || "LAHORE"}
                    </span>
                  </div>

                  {/* Parties Info */}
                  <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-900 dark:text-white font-bold truncate">
                      <span className="text-slate-400 font-normal">Sender: </span>
                      {c.senderName || c.customer?.companyName || c.customer?.name || "-"}
                      {c.senderPhone && <span className="text-slate-500 font-normal"> ({c.senderPhone})</span>}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 truncate">
                      <span className="text-slate-400 font-normal">Receiver: </span>
                      {c.receiverName || "-"}
                      {c.receiverPhone && <span className="text-slate-500 font-normal"> ({c.receiverPhone})</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <span className="text-slate-400 font-normal">Cargo: </span>
                      {cargoDesc} ({pkgsCount} pkgs &bull; {cargoWeight})
                    </p>
                  </div>

                  {/* Fleet & Financials */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Freight</p>
                      <p className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(c.totalFreight ?? c.totalAmount ?? c.freightAmount ?? c.freight ?? 0)}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        Paid: {formatCurrency(c.paidAmount || 0)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Terms</p>
                      <p className="font-black text-slate-900 dark:text-white">
                        {c.paymentMode || c.paymentStatus || c.amountType || "TO-PAY"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Balance: {formatCurrency(c.remainingBalance || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Vehicle & Driver */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {c.vehicleNumber || c.vehicle?.vehicleNumber || "-"}
                    </span>
                    <span className="truncate max-w-[150px]">
                      Driver: {c.driverName || c.driver?.name || "-"}
                    </span>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold gap-1"
                        onClick={() => setViewDetailsBilty(c)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 rounded-lg text-blue-600 hover:text-blue-900 text-xs font-semibold gap-1"
                        onClick={() => router.push(`/admin/bilty/${encodeURIComponent(c.id || c.biltyNumber)}/edit`)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>
                      {targetPhone && (
                        <a
                          href={buildWhatsAppUrl(targetPhone, waMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          title="WhatsApp Consignee"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-emerald-700"
                        onClick={() => export4SheetBiltyExcel(c)}
                        title="Export 4-Sheet Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-spd-blue"
                        onClick={() => setPrintBilty(c)}
                        title="4-Sheet Dossier & Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-600"
                        onClick={() => {
                          setDeletingBilty(c);
                          setDeleteStep(1);
                        }}
                        title="Delete Bilty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 rounded-lg text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-xs font-bold gap-1 shrink-0"
                      onClick={() => {
                        setStatusModalBilty(c);
                        setStatusUpdate({
                          shipmentStatus: c.shipmentStatus || "IN_TRANSIT",
                          location: `${c.destination || "Karachi"} Terminal`,
                          statusNote: "",
                          receivedBy: c.receiverName || "",
                          deliveryDate: new Date().toISOString().slice(0, 10),
                        });
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Status</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= 768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto overflow-y-visible scrollbar-thin">
              <Table className="min-w-[1100px]">
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Bilty # / Tracking</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Booking Date</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Sender & Receiver</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Route (Origin ➔ Destination)</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Cargo Items & Pkgs</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Gross Weight</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Total Freight & Terms</TableHead>
                    <TableHead className="text-xs font-bold text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consignments.map((c) => {
                    const mode = String(c.paymentMode || c.paymentStatus || c.amountType || "").toUpperCase();
                    const isPaid = mode === "PAID";
                    const isBilled = mode === "BILLED" || mode === "TO_BE_BILLED" || mode === "TO BE BILLED";
                    const isToPay = mode === "TO-PAY" || mode === "TO_PAY" || mode === "TO PAY" || mode === "UNPAID" || (!isPaid && !isBilled);

                    const cargoDesc = c.itemDescription || c.packageDetails || (c.items && c.items[0]?.detail) || "-";
                    const pkgsCount = c.packagesCount || c.quantity || "-";
                    const cargoWeight = c.weight !== null && c.weight !== undefined && Number(c.weight) > 0 ? `${Number(c.weight).toLocaleString()} KG` : "-";

                    return (
                      <TableRow
                        key={c.id || c.biltyNumber}
                        id={`record-${c.id}`}
                        data-record-id={c.id}
                        className={cn(
                          "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-xs",
                          highlightClass(c.id) || highlightClass(c.biltyNumber)
                        )}
                      >
                        {/* 1. Bilty # & Tracking (with Clickable preview link) */}
                        <TableCell>
                          <div>
                            <Link
                              href={`/admin/bilty/${encodeURIComponent(c.id || c.biltyNumber)}`}
                              className="font-black text-xs text-spd-blue hover:text-spd-red hover:underline block font-mono"
                              title="Click to view / print 4-Sheet Dossier"
                            >
                              {c.biltyNumber || c.id || "-"}
                            </Link>
                            <p className="text-[10px] text-slate-500 font-mono">{c.trackingId || "-"}</p>
                          </div>
                        </TableCell>

                        {/* 2. Booking Date */}
                        <TableCell>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {c.bookingDate ? formatDate(c.bookingDate) : c.date ? formatDate(c.date) : "-"}
                          </span>
                        </TableCell>

                        {/* 3. Sender & Receiver (Name + Contact) */}
                        <TableCell>
                          <div className="space-y-0.5 max-w-[210px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              <span className="text-slate-400 font-normal">Sender: </span>
                              {c.senderName || c.customer?.companyName || c.customer?.name || "-"}
                              {c.senderPhone && <span className="text-slate-500 font-normal"> ({c.senderPhone})</span>}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 truncate">
                              <span className="text-slate-400 font-normal">Receiver: </span>
                              {c.receiverName || "-"}
                              {c.receiverPhone && <span className="text-slate-500 font-normal"> ({c.receiverPhone})</span>}
                            </p>
                          </div>
                        </TableCell>

                        {/* 4. Origin ➔ Destination */}
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                              <span>{c.origin || "-"}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-spd-blue">{c.destination || "-"}</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${
                                (c.warehouse || c.origin || "").toUpperCase().includes("KARACHI")
                                  ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                                  : "bg-red-100 text-spd-red dark:bg-red-950/60 dark:text-red-400"
                              }`}
                            >
                              {c.warehouse || "LAHORE"}
                            </span>
                          </div>
                        </TableCell>

                        {/* 5. Cargo Items & Packages Count */}
                        <TableCell>
                          <div className="space-y-0.5 max-w-[190px]">
                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={cargoDesc}>
                              {cargoDesc}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {pkgsCount !== "-" ? `${pkgsCount} ${c.packagingType || "pkgs"}` : "-"}
                            </p>
                          </div>
                        </TableCell>

                        {/* 6. Gross Weight (KG) */}
                        <TableCell>
                          <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {cargoWeight}
                          </span>
                        </TableCell>

                        {/* 7. Total Freight & Payment Status Badge */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-black text-slate-900 dark:text-white whitespace-nowrap">
                              {formatCurrency(c.totalFreight ?? c.totalAmount ?? c.freightAmount ?? c.freight ?? 0)}
                            </p>
                            <div>
                              {isPaid ? (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300">
                                  PAID
                                </span>
                              ) : isBilled ? (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300">
                                  BILLED
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300">
                                  TO-PAY
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 8. Actions */}
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
                              onClick={() => router.push(`/admin/bilty/${encodeURIComponent(c.id || c.biltyNumber)}/edit`)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Edit</span>
                            </Button>
                            {(() => {
                              const targetPhone = c.receiver?.whatsapp || c.receiverPhone || c.receiver?.phone || c.customer?.whatsapp || c.customer?.phone;
                              if (!targetPhone) return null;
                              const msg = getBiltyTrackingWhatsAppMessage({
                                biltyNumber: c.biltyNumber || c.id,
                                trackingId: c.trackingId,
                                status: c.shipmentStatus || c.status,
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
                              className="h-8 w-8 rounded-lg text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              title="Export 4-Sheet Excel (.xlsx)"
                              onClick={() => export4SheetBiltyExcel(c)}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/50"
                              title="4-Sheet Dossier & Print"
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
                                  shipmentStatus: c.shipmentStatus || "IN_TRANSIT",
                                  location: `${c.destination || "Karachi"} Terminal`,
                                  statusNote: "",
                                  receivedBy: c.receiverName || "",
                                  deliveryDate: new Date().toISOString().slice(0, 10),
                                });
                              }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Status</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* MODAL 2: 4-SHEET TRANSPORT DOSSIER VIEWER & EXPORT */}
      <Dialog open={!!printBilty} onOpenChange={() => setPrintBilty(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <BiltySheetViewer bilty={printBilty} showBackLink={false} />
        </DialogContent>
      </Dialog>

      {/* MODAL 3: UPDATE SHIPMENT STATUS */}
      <Dialog open={!!statusModalBilty} onOpenChange={() => setStatusModalBilty(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overflow-x-visible rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pb-16">
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-visible rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pb-16">
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

                {/* Proof & Attachment Documents (Cargo Photo, Physical Bilty Copy, Weight Slip Proof) */}
                {(() => {
                  const proofItems = [
                    { title: "Goods / Cargo Photo", url: viewDetailsBilty.cargoPhoto || viewDetailsBilty.photos?.[0] },
                    { title: "Physical Bilty Copy", url: viewDetailsBilty.biltyPhoto || viewDetailsBilty.photos?.[1] },
                    { title: "Weight Slip / Loading Proof", url: viewDetailsBilty.weightSlipPhoto || viewDetailsBilty.photos?.[2] },
                  ].filter((p) => Boolean(p.url));

                  if (proofItems.length === 0) return null;

                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-spd-red" />
                          Attachment & Proof Documents ({proofItems.length})
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Click photo to view in high-resolution</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {proofItems.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => setPreviewPhotoUrl(item.url)}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex flex-col aspect-video cursor-pointer shadow-sm hover:shadow-md transition-all"
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                              {item.title}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                              <Maximize2 className="w-4 h-4" /> Full View
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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

          <DialogFooter className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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
                <Printer className="w-3.5 h-3.5" /> 4-Sheet Dossier
              </Button>
              <Button
                type="button"
                onClick={() => export4SheetBiltyExcel(viewDetailsBilty)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> 4-Sheet Excel
              </Button>
              {viewDetailsBilty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const targetId = viewDetailsBilty.id || viewDetailsBilty.biltyNumber || viewDetailsBilty.trackingId;
                    if (!targetId) return;
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("spd_selected_bilty", JSON.stringify(viewDetailsBilty));
                        sessionStorage.setItem("last_created_bilty", JSON.stringify(viewDetailsBilty));
                      } catch {}
                    }
                    setViewDetailsBilty(null);
                    router.push(`/admin/bilty/${encodeURIComponent(targetId)}`);
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Full Page View
                </Button>
              )}
            </div>
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

      {/* FULL RESOLUTION CARGO PHOTO PREVIEW MODAL (TASK 2) */}
      <Dialog open={!!previewPhotoUrl} onOpenChange={() => setPreviewPhotoUrl(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-4 bg-slate-950 text-white border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-spd-red" />
              <span className="text-sm font-bold">Consignment Cargo Photo — High Resolution</span>
            </div>
            <div className="flex items-center gap-2">
              {previewPhotoUrl && (
                <a
                  href={previewPhotoUrl}
                  download={`cargo-photo-${Date.now()}.jpg`}
                  className="px-2.5 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 text-xs flex items-center gap-1 font-semibold"
                  title="Download photo"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewPhotoUrl(null)}
                className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center p-2 sm:p-6 min-h-[300px] max-h-[80vh] overflow-auto">
            {previewPhotoUrl && (
              <img
                src={previewPhotoUrl}
                alt="Consignment Cargo High Resolution Preview"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
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

