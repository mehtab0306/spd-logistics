"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  MapPin,
  RefreshCw,
  User,
  Phone,
  FileText,
  MessageSquare,
  Sparkles,
  Navigation,
  Eye,
} from "lucide-react";
import { formatDateTime, formatDate, cn } from "@/lib/utils";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_COLORS } from "@/lib/constants";
import { buildWhatsAppUrl, getBiltyTrackingWhatsAppMessage } from "@/lib/whatsapp";
import { getStoredBilties, saveStoredBilty } from "@/lib/local-persistence";

const LOCAL_BILTIES_KEY = "spd_local_bilties";
const LOCAL_TRACKING_KEY = "spd_local_tracking";

const FALLBACK_CONSIGNMENTS = [
  {
    id: "bilty-cust-101",
    trackingId: "SPD-2026-00101",
    biltyNumber: "SPD-LHR-2026-0101",
    origin: "Lahore",
    destination: "Karachi",
    warehouse: "LAHORE",
    shipmentStatus: "IN_TRANSIT",
    senderName: "Standard Customer (Prime Logistics)",
    senderPhone: "0300 1234567",
    receiverName: "Karachi Commercial Mart",
    receiverPhone: "0321 9876543",
    packageDetails: "Industrial Auto Parts & Machinery",
    quantity: 80,
    weight: 3200,
    driverName: "Muhammad Khan",
    vehicleNumber: "LES-8921",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    trackingEvents: [
      {
        id: "te-101-1",
        status: "IN_TRANSIT",
        location: "Sadiqabad Motorway Interchange M-5",
        description: "Cargo convoy in transit on Motorway M-5.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "te-101-2",
        status: "DISPATCHED",
        location: "Lahore Central Logistics Hub",
        description: "Dispatched from Lahore terminal via Vehicle LES-8921.",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "te-101-3",
        status: "BOOKED",
        location: "Lahore Station",
        description: "Consignment booked and verified.",
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ],
  },
  {
    id: "bilty-cust-102",
    trackingId: "SPD-2026-00102",
    biltyNumber: "SPD-KHI-2026-0102",
    origin: "Karachi",
    destination: "Islamabad",
    warehouse: "KARACHI",
    shipmentStatus: "DISPATCHED",
    senderName: "Standard Customer (Prime Logistics)",
    senderPhone: "0300 1234567",
    receiverName: "Islamabad Distribution Center",
    receiverPhone: "0333 8765432",
    packageDetails: "Electronics & Commercial Displays",
    quantity: 120,
    weight: 2400,
    driverName: "Abdul Ghaffar",
    vehicleNumber: "KHI-7720",
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    trackingEvents: [
      {
        id: "te-102-1",
        status: "DISPATCHED",
        location: "Hyderabad Highway Bypass",
        description: "En route to toll checkpoint.",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "te-102-2",
        status: "BOOKED",
        location: "Karachi Port Hub",
        description: "Bilty registered and loaded onto vehicle.",
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
    ],
  },
  {
    id: "bilty-cust-103",
    trackingId: "SPD-2026-00103",
    biltyNumber: "SPD-LHR-2026-0103",
    origin: "Lahore",
    destination: "Peshawar",
    warehouse: "LAHORE",
    shipmentStatus: "DELIVERED",
    senderName: "Standard Customer (Prime Logistics)",
    senderPhone: "0300 1234567",
    receiverName: "Peshawar Wholesale Depot",
    receiverPhone: "0301 2345678",
    packageDetails: "Consumer Packaged Goods & Beverages",
    quantity: 150,
    weight: 4100,
    driverName: "Rashid Ali",
    vehicleNumber: "PMA-7102",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    deliveryDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    trackingEvents: [
      {
        id: "te-103-1",
        status: "DELIVERED",
        location: "Peshawar Depot",
        description: "Delivered to receiving manager.",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "te-103-2",
        status: "OUT_FOR_DELIVERY",
        location: "Peshawar Ring Road",
        description: "Out for final delivery.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "te-103-3",
        status: "BOOKED",
        location: "Lahore Station",
        description: "Booking confirmed.",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "cons-1",
    trackingId: "SPD-2026-000142",
    biltyNumber: "SPD-LHR-2026-0042",
    origin: "Lahore",
    destination: "Karachi",
    warehouse: "LAHORE",
    shipmentStatus: "IN_TRANSIT",
    senderName: "Crescent Textile Mills Ltd",
    senderPhone: "0300 1234567",
    receiverName: "Metro Cash & Carry Terminal",
    receiverPhone: "0321 9876543",
    packageDetails: "Textile Fabrics & Yarn Cartons",
    quantity: 120,
    weight: 4500,
    driverName: "Muhammad Khan",
    vehicleNumber: "LES-8921",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    trackingEvents: [
      {
        id: "te-1",
        status: "IN_TRANSIT",
        location: "Sadiqabad Motorway Interchange",
        description: "Cargo convoy in transit on Motorway M-5.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "te-2",
        status: "DISPATCHED",
        location: "Lahore Central Logistics Hub",
        description: "Dispatched from Lahore terminal via Vehicle LES-8921.",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "te-3",
        status: "BOOKED",
        location: "Lahore Station",
        description: "Consignment booked and documents verified.",
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
  },
  {
    id: "cons-2",
    trackingId: "SPD-2026-000141",
    biltyNumber: "SPD-KHI-2026-0038",
    origin: "Karachi",
    destination: "Islamabad",
    warehouse: "KARACHI",
    shipmentStatus: "DISPATCHED",
    senderName: "Universal Pharma Karachi",
    senderPhone: "0333 4567890",
    receiverName: "Shifa International Hospital",
    receiverPhone: "0345 6789012",
    packageDetails: "Medical Consumables & Lab Kits",
    quantity: 85,
    weight: 1800,
    driverName: "Tariq Mehmood",
    vehicleNumber: "KHI-4420",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    trackingEvents: [
      {
        id: "te-21",
        status: "DISPATCHED",
        location: "Karachi Port Gate #3",
        description: "Dispatched and outbound on National Highway.",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "te-22",
        status: "BOOKED",
        location: "Karachi Hub",
        description: "Shipment booked and verified.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
  },
  {
    id: "cons-3",
    trackingId: "SPD-2026-000140",
    biltyNumber: "SPD-LHR-2026-0035",
    origin: "Lahore",
    destination: "Peshawar",
    warehouse: "LAHORE",
    shipmentStatus: "DELIVERED",
    senderName: "Lahore Auto Spares",
    senderPhone: "0312 3456789",
    receiverName: "Khyber Engineering Works",
    receiverPhone: "0301 2345678",
    packageDetails: "Industrial Machinery Parts & Lubricants",
    quantity: 40,
    weight: 2200,
    driverName: "Rashid Ali",
    vehicleNumber: "PMA-7102",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    deliveryDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    trackingEvents: [
      {
        id: "te-31",
        status: "DELIVERED",
        location: "Peshawar Industrial Estate",
        description: "Successfully handed over to recipient. Signatures collected.",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "te-32",
        status: "OUT_FOR_DELIVERY",
        location: "Peshawar City Station",
        description: "Out for final destination delivery.",
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        id: "te-33",
        status: "BOOKED",
        location: "Lahore Hub",
        description: "Bilty generated and booked.",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "cons-4",
    trackingId: "SPD-2026-000139",
    biltyNumber: "SPD-MUL-2026-0012",
    origin: "Multan",
    destination: "Faisalabad",
    warehouse: "MULTAN",
    shipmentStatus: "BOOKED",
    senderName: "Multan Mango & Fruits Cargo",
    senderPhone: "0302 9876543",
    receiverName: "Faisalabad Agro Cold Chain",
    receiverPhone: "0322 1234567",
    packageDetails: "Wooden Crates of Seasonal Produce",
    quantity: 250,
    weight: 5200,
    driverName: "Zahid Qureshi",
    vehicleNumber: "MN-9811",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    trackingEvents: [
      {
        id: "te-41",
        status: "BOOKED",
        location: "Multan Cargo Station",
        description: "Bilty registered and shipment queued for vehicle loading.",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: "cons-5",
    trackingId: "SPD-2026-000138",
    biltyNumber: "SPD-LHR-2026-0029",
    origin: "Lahore",
    destination: "Quetta",
    warehouse: "LAHORE",
    shipmentStatus: "IN_TRANSIT",
    senderName: "Hafeez Center Electronics",
    senderPhone: "0300 7654321",
    receiverName: "Bolan IT Market Traders",
    receiverPhone: "0331 4321098",
    packageDetails: "Laptops & Network Hardware Boxes",
    quantity: 65,
    weight: 980,
    driverName: "Gulzar Ahmad",
    vehicleNumber: "LES-5541",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    trackingEvents: [
      {
        id: "te-51",
        status: "IN_TRANSIT",
        location: "D.G. Khan Transit Station",
        description: "Passing D.G. Khan checkpoint towards Fort Munro pass.",
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "te-52",
        status: "BOOKED",
        location: "Lahore Terminal",
        description: "Shipment booked and loaded.",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
  },
];

function AdminTrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam =
    searchParams.get("id") ||
    searchParams.get("track") ||
    searchParams.get("bilty") ||
    searchParams.get("query") ||
    searchParams.get("trackingId");

  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(qParam ? qParam.trim() : "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedConsignment, setSelectedConsignment] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status update state for selected consignment
  const [updateStatus, setUpdateStatus] = useState("IN_TRANSIT");
  const [updateLocation, setUpdateLocation] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (selectedConsignment) {
      setUpdateStatus(selectedConsignment.shipmentStatus || "IN_TRANSIT");
      setUpdateLocation("");
      setUpdateNote("");
      setUpdateFeedback(null);
    }
  }, [selectedConsignment]);

  // Load consignments from local storage and backend API
  const loadData = async () => {
    setLoading(true);
    let items: any[] = [];

    // 1. Try fetching from API
    try {
      const res = await fetch("/api/admin/bilty?limit=50");
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        items = data.data;
      }
    } catch (err) {
      console.warn("API bilty query in tracking failed:", err);
    }

    // 2. Read and merge local bilties & tracking store (ensures newly created bilties and updated statuses show immediately)
    if (typeof window !== "undefined") {
      try {
        const localItems = getStoredBilties();
        for (const lb of localItems) {
          const idx = items.findIndex(
            (b) => b.id === lb.id || (lb.biltyNumber && b.biltyNumber === lb.biltyNumber)
          );
          if (idx >= 0) {
            items[idx] = { ...items[idx], ...lb };
          } else {
            items.unshift(lb);
          }
        }

        const rawTracking = localStorage.getItem(LOCAL_TRACKING_KEY);
        if (rawTracking) {
          const trackingItems: any[] = JSON.parse(rawTracking);
          for (const tb of trackingItems) {
            const idx = items.findIndex(
              (b) => b.id === tb.id || (tb.biltyNumber && b.biltyNumber === tb.biltyNumber) || (tb.trackingId && b.trackingId === tb.trackingId)
            );
            if (idx >= 0) {
              items[idx] = { ...items[idx], ...tb };
            } else {
              items.unshift(tb);
            }
          }
        }

        const rawDeliveries = localStorage.getItem("spd_deliveries");
        if (rawDeliveries) {
          const deliveryItems: any[] = JSON.parse(rawDeliveries);
          for (const db of deliveryItems) {
            const idx = items.findIndex(
              (b) => b.id === db.id || (db.biltyNumber && b.biltyNumber === db.biltyNumber) || (db.trackingId && b.trackingId === db.trackingId)
            );
            if (idx >= 0) {
              items[idx] = { ...items[idx], ...db };
            } else {
              items.unshift(db);
            }
          }
        }
      } catch (e) {
        console.warn("Error reading local bilties in tracking:", e);
      }
    }

    // 3. Ensure fallback consignments (e.g. seeded SPD-2026-00101/102/103) are always present
    for (const fb of FALLBACK_CONSIGNMENTS) {
      const idx = items.findIndex(
        (b) => b.id === fb.id || b.biltyNumber === fb.biltyNumber || (fb.trackingId && b.trackingId === fb.trackingId)
      );
      if (idx === -1) {
        items.push(fb);
      }
    }

    // Filter out deleted
    items = items.filter((b) => b.shipmentStatus !== "DELETED");

    setConsignments(items);
    setLoading(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsignment) return;

    setIsUpdating(true);
    const newEvent = {
      id: `te_${Date.now()}`,
      status: updateStatus,
      location: updateLocation.trim() || (selectedConsignment.destination ? `${selectedConsignment.destination} Hub Station` : "Transit Checkpoint"),
      description: updateNote.trim() || `Status updated to ${updateStatus.replace(/_/g, " ")}.`,
      timestamp: new Date().toISOString(),
    };

    const updatedConsignment = {
      ...selectedConsignment,
      shipmentStatus: updateStatus,
      status: updateStatus,
      trackingEvents: [newEvent, ...(selectedConsignment.trackingEvents || [])],
    };

    // Update in state
    setSelectedConsignment(updatedConsignment);
    setConsignments((prev) =>
      prev.map((c) =>
        c.id === updatedConsignment.id ||
        (c.biltyNumber && c.biltyNumber === updatedConsignment.biltyNumber) ||
        (c.trackingId && c.trackingId === updatedConsignment.trackingId)
          ? updatedConsignment
          : c
      )
    );

    // Save to spd_bilties, spd_local_bilties & spd_local_tracking
    if (typeof window !== "undefined") {
      try {
        saveStoredBilty(updatedConsignment);

        // Auto update driver status to ON_TRIP if in transit
        if (updateStatus === "IN_TRANSIT" || updateStatus === "DISPATCHED") {
          const dId = updatedConsignment.driverId;
          const dName = updatedConsignment.driverName;
          const rawDrivers = localStorage.getItem("spd_local_drivers");
          if (rawDrivers) {
            let drivers: any[] = JSON.parse(rawDrivers);
            let dUpdated = false;
            drivers = drivers.map((d: any) => {
              if ((dId && d.id === dId) || (dName && d.name?.toLowerCase().trim() === dName.toLowerCase().trim())) {
                dUpdated = true;
                return { ...d, status: "ON_TRIP" };
              }
              return d;
            });
            if (dUpdated) {
              localStorage.setItem("spd_local_drivers", JSON.stringify(drivers));
              localStorage.setItem("spd_drivers", JSON.stringify(drivers));
            }
          }
        }
      } catch (err) {
        console.warn("Error saving status update locally:", err);
      }
    }

    // Call API in background
    fetch("/api/admin/bilty", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: updatedConsignment.id,
        shipmentStatus: updateStatus,
        location: updateLocation.trim() || undefined,
        statusNote: updateNote.trim() || undefined,
      }),
    }).catch(() => {});

    setIsUpdating(false);
    setUpdateFeedback("Status & Checkpoint updated successfully!");
    setTimeout(() => setUpdateFeedback(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-fill and auto-open tracking lookup when id or track query param is provided
  useEffect(() => {
    if (qParam) {
      const cleanParam = qParam.trim();
      setSearchQuery(cleanParam);
      if (consignments.length > 0) {
        const cleanUpper = cleanParam.toUpperCase();
        const found = consignments.find(
          (c) =>
            c.id?.toString().trim().toUpperCase() === cleanUpper ||
            c.biltyNumber?.trim().toUpperCase() === cleanUpper ||
            c.trackingId?.trim().toUpperCase() === cleanUpper
        );
        if (found) {
          setSelectedConsignment(found);
        }
      }
    }
  }, [qParam, consignments]);

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filtered consignments
  const filteredConsignments = useMemo(() => {
    return consignments.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.trackingId && c.trackingId.toLowerCase().includes(q)) ||
        (c.biltyNumber && c.biltyNumber.toLowerCase().includes(q)) ||
        (c.senderName && c.senderName.toLowerCase().includes(q)) ||
        (c.receiverName && c.receiverName.toLowerCase().includes(q)) ||
        (c.origin && c.origin.toLowerCase().includes(q)) ||
        (c.destination && c.destination.toLowerCase().includes(q)) ||
        (c.driverName && c.driverName.toLowerCase().includes(q)) ||
        (c.vehicleNumber && c.vehicleNumber.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (c.shipmentStatus && c.shipmentStatus.toUpperCase() === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [consignments, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = consignments.length;
    const inTransit = consignments.filter(
      (c) => c.shipmentStatus === "IN_TRANSIT" || c.shipmentStatus === "DISPATCHED"
    ).length;
    const booked = consignments.filter((c) => c.shipmentStatus === "BOOKED").length;
    const delivered = consignments.filter((c) => c.shipmentStatus === "DELIVERED").length;
    return { total, inTransit, booked, delivered };
  }, [consignments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Consignment Tracking Center"
          description="Real-time status synchronization, bilty checkpoint history, and shipment timeline monitoring."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Sync Live</span>
          </Button>
          <Button asChild size="sm" className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs">
            <Link href="/tracking" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Tracking Portal</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-spd-blue shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tracked</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Transit</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{stats.inTransit}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Booked / Queued</p>
            <p className="text-xl font-black text-sky-600 mt-0.5">{stats.booked}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivered</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.delivered}</p>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID (SPD-YYYY-XXXX), Bilty #, Shipper, Consignee, City..."
            className="pl-10 h-11 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* STATUS FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "BOOKED", "IN_TRANSIT", "DISPATCHED", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                statusFilter === st
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {st === "ALL" ? "All Shipments" : SHIPMENT_STATUS_LABELS[st] || st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* SHIPMENT CARDS LIST */}
      {filteredConsignments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No consignments found"
          description="Try adjusting your search query or filter to locate shipments."
        />
      ) : (
        <div className="grid gap-3">
          {filteredConsignments.map((c) => {
            const statusKey = (c.shipmentStatus || "BOOKED").toUpperCase();
            const statusLabel = SHIPMENT_STATUS_LABELS[statusKey] || statusKey.replace(/_/g, " ");
            const statusColor = SHIPMENT_STATUS_COLORS[statusKey] || "bg-slate-100 text-slate-700";
            const trackingId = c.trackingId || c.biltyNumber || `SPD-2026-${c.id}`;

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-spd-blue/40 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {trackingId}
                      </span>
                      <button
                        onClick={() => handleCopy(trackingId)}
                        title="Copy Tracking ID"
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {copiedId === trackingId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {c.biltyNumber && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Bilty: {c.biltyNumber}
                      </span>
                    )}

                    <Badge className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider", statusColor)}>
                      {statusLabel}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConsignment(c)}
                      className="rounded-xl text-xs font-bold gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-spd-blue" />
                      <span>Quick Timeline</span>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-spd-blue hover:text-spd-blueHover">
                      <Link href={`/tracking?id=${encodeURIComponent(trackingId)}`} target="_blank">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Track Portal</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Route
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <span>{c.origin || "Origin"}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{c.destination || "Destination"}</span>
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">Hub: {c.warehouse || "MAIN"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Shipper & Consignee
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      From: {c.senderName || "Valued Shipper"}
                    </p>
                    <p className="text-slate-500 truncate text-[11px]">
                      To: {c.receiverName || "Valued Consignee"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cargo / Transport
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {c.packageDetails || "Commercial Consignment"}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {c.quantity ? `${c.quantity} pkgs` : ""} {c.weight ? `• ${c.weight} kg` : ""}
                      {c.vehicleNumber ? ` • ${c.vehicleNumber}` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Last Checkpoint
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {Array.isArray(c.trackingEvents) && c.trackingEvents.length > 0
                        ? c.trackingEvents[0].location || "En Route Station"
                        : `${c.origin || "Origin"} Terminal`}
                    </p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      {c.createdAt ? formatDate(c.createdAt) : "Active"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK TIMELINE / CONSIGNMENT DETAILS MODAL */}
      <Dialog open={!!selectedConsignment} onOpenChange={() => setSelectedConsignment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Live Consignment Tracking
                  </span>
                  {selectedConsignment?.biltyNumber && (
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Bilty #{selectedConsignment.biltyNumber}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-spd-blue" />
                  <span className="font-mono">{selectedConsignment?.trackingId || selectedConsignment?.biltyNumber}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedConsignment?.origin} &rarr; {selectedConsignment?.destination} • Booked on{" "}
                  {selectedConsignment?.createdAt ? formatDate(selectedConsignment.createdAt) : "Today"}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider",
                    SHIPMENT_STATUS_COLORS[(selectedConsignment?.shipmentStatus || "BOOKED").toUpperCase()] ||
                      "bg-blue-100 text-blue-800"
                  )}
                >
                  {SHIPMENT_STATUS_LABELS[(selectedConsignment?.shipmentStatus || "BOOKED").toUpperCase()] ||
                    selectedConsignment?.shipmentStatus?.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* SCROLLABLE MODAL BODY */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 pt-4">
            {/* Visual 6-Stage Timeline */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Consignment Transit Progress
              </h4>
              {(() => {
                const stages = [
                  { key: "BOOKED", label: "Booked" },
                  { key: "PICKED_UP", label: "Picked Up" },
                  { key: "IN_TRANSIT", label: "In Transit" },
                  { key: "ARRIVED_AT_DESTINATION", label: "Arrived at Hub" },
                  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
                  { key: "DELIVERED", label: "Delivered" },
                ];

                const statusOrder: Record<string, number> = {
                  BOOKED: 0,
                  BOOKING_RECEIVED: 0,
                  PICKED_UP: 1,
                  PROCESSING: 1,
                  DISPATCHED: 2,
                  VEHICLE_ASSIGNED: 2,
                  IN_TRANSIT: 2,
                  ARRIVED_AT_DESTINATION: 3,
                  ON_THE_WAY: 4,
                  OUT_FOR_DELIVERY: 4,
                  DELIVERED: 5,
                };

                const currentStatus = selectedConsignment?.shipmentStatus || "BOOKED";
                const currentIndex = statusOrder[currentStatus] !== undefined ? statusOrder[currentStatus] : 1;
                const isDelivered = currentStatus === "DELIVERED";

                return (
                  <div className="w-full">
                    {/* Desktop Timeline */}
                    <div className="hidden sm:grid grid-cols-6 gap-2 relative">
                      <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />
                      <div
                        className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                        style={{
                          width: `${Math.min(100, (currentIndex / (stages.length - 1)) * 100)}%`,
                        }}
                      />

                      {stages.map((stage, idx) => {
                        const isDone = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                          <div key={stage.key} className="flex flex-col items-center text-center z-10 space-y-1.5">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2",
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400",
                                isCurrent && !isDelivered && "ring-4 ring-emerald-500/20"
                              )}
                            >
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <span
                              className={cn(
                                "text-[11px] font-bold leading-tight",
                                isDone ? "text-slate-900 dark:text-white" : "text-slate-400"
                              )}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile Timeline */}
                    <div className="sm:hidden space-y-2">
                      {stages.map((stage, idx) => {
                        const isDone = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                          <div key={stage.key} className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                              )}
                            >
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                isDone ? "text-slate-900 dark:text-white" : "text-slate-400"
                              )}
                            >
                              {stage.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-spd-blue">
                                Active
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Consignment Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Shipper Details</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedConsignment?.senderName || "Valued Shipper"}
                </p>
                {selectedConsignment?.senderPhone && (
                  <p className="text-slate-500 text-[11px] mt-0.5">{selectedConsignment.senderPhone}</p>
                )}
                {selectedConsignment?.senderAddress && (
                  <p className="text-slate-400 text-[10px] mt-0.5 truncate">{selectedConsignment.senderAddress}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Consignee (Receiver)</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedConsignment?.receiverName || "Valued Consignee"}
                </p>
                {selectedConsignment?.receiverPhone && (
                  <p className="text-slate-500 text-[11px] mt-0.5">{selectedConsignment.receiverPhone}</p>
                )}
                {selectedConsignment?.receiverAddress && (
                  <p className="text-slate-400 text-[10px] mt-0.5 truncate">{selectedConsignment.receiverAddress}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Cargo & Vehicle</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedConsignment?.packageDetails || "Commercial Consignment"}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {selectedConsignment?.quantity ? `${selectedConsignment.quantity} Cartons / Items` : ""}{" "}
                  {selectedConsignment?.weight ? `• ${selectedConsignment.weight} KG` : ""}
                </p>
                {selectedConsignment?.vehicleNumber && (
                  <p className="text-slate-600 dark:text-slate-300 font-semibold text-[11px] mt-0.5">
                    Vehicle: {selectedConsignment.vehicleNumber} {selectedConsignment.driverName ? `(${selectedConsignment.driverName})` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Checkpoint Events List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-spd-blue" />
                Transit Checkpoint History
              </h4>
              {Array.isArray(selectedConsignment?.trackingEvents) && selectedConsignment.trackingEvents.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 my-2">
                  {selectedConsignment.trackingEvents.map((event: any, index: number) => (
                    <div key={event.id || index} className="relative">
                      <div
                        className={cn(
                          "absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
                          index === 0 ? "bg-spd-blue ring-2 ring-blue-500/20" : "bg-slate-400"
                        )}
                      />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {SHIPMENT_STATUS_LABELS[event.status as keyof typeof SHIPMENT_STATUS_LABELS] ||
                              event.status?.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(event.timestamp || event.createdAt)}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-spd-red shrink-0" />
                          <span>{event.location || "Transit Checkpoint"}</span>
                        </p>
                        {event.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  Initial booking checkpoint recorded. Transit updates will log automatically.
                </div>
              )}
            </div>

            {/* Direct Status Update & Checkpoint Entry */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-spd-red" />
                  <span>Update Live Status & Post Checkpoint</span>
                </h4>
                {updateFeedback && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    {updateFeedback}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">New Shipment Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-spd-blue outline-none"
                  >
                    <option value="BOOKED">BOOKED (At Station)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (On Highway)</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Last Mile)</option>
                    <option value="DELIVERED">DELIVERED (Signed & Handed Over)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Hub / Station Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Sukkur Bypass Interchange"
                    value={updateLocation}
                    onChange={(e) => setUpdateLocation(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-spd-blue outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Transit Note / Remark</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared toll, en route to Karachi"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-spd-blue outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    size="sm"
                    className="rounded-xl text-xs font-bold bg-spd-blue hover:bg-spd-blueHover text-white gap-1.5 h-9"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isUpdating && "animate-spin")} />
                    <span>Save Status & Add Checkpoint</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* PINNED FOOTER */}
          <DialogFooter className="shrink-0 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {selectedConsignment && (
                <a
                  href={buildWhatsAppUrl(
                    null,
                    getBiltyTrackingWhatsAppMessage({
                      biltyNumber: selectedConsignment.biltyNumber,
                      trackingId: selectedConsignment.trackingId || selectedConsignment.biltyNumber,
                      status: selectedConsignment.shipmentStatus,
                      origin: selectedConsignment.origin,
                      destination: selectedConsignment.destination,
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>
              )}
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
                <Link href={`/tracking?id=${encodeURIComponent(selectedConsignment?.trackingId || selectedConsignment?.biltyNumber || "")}`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!selectedConsignment) return;
                  const targetId = selectedConsignment.id || selectedConsignment.biltyNumber || selectedConsignment.trackingId;
                  if (!targetId) return;
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.setItem("spd_selected_bilty", JSON.stringify(selectedConsignment));
                      sessionStorage.setItem("last_created_bilty", JSON.stringify(selectedConsignment));
                    } catch {}
                  }
                  setSelectedConsignment(null);
                  router.push(`/admin/bilty/${encodeURIComponent(targetId)}`);
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Page View</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedConsignment(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[50vh] text-slate-500 font-bold">
          Loading Tracking Portal...
        </div>
      }
    >
      <AdminTrackingContent />
    </Suspense>
  );
}
