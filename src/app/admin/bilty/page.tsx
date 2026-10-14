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
  getDeletedBiltyIds as getStoredDeletedBiltyIds,
  getStoredCustomers,
  getDeletedCustomerIds,
  getStoredDrivers,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import {
  buildWhatsAppUrl,
  getBiltyTrackingWhatsAppMessage,
  getAdminToDriverWhatsAppMessage,
} from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";

export default function BiltyPage() {
  const router = useRouter();
  const [consignments, setConsignments] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(consignments);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const DEFAULT_CLIENT_CONSIGNMENTS = [
    {
      id: "bilty-cust-101",
      biltyNumber: "SPD-LHR-2026-0101",
      trackingId: "SPD-2026-00101",
      date: new Date(Date.now() - 3600000 * 20).toISOString(),
      senderName: "Standard Customer (Prime Logistics)",
      senderPhone: "0300 1234567",
      senderAddress: "Gulberg III, Main Boulevard, Lahore",
      receiverName: "Karachi Commercial Mart",
      receiverPhone: "0321 9876543",
      receiverAddress: "M.A. Jinnah Road, Karachi",
      origin: "Lahore",
      destination: "Karachi",
      warehouse: "LAHORE",
      vehicleNumber: "LES-8921",
      driverName: "Muhammad Khan",
      packageDetails: "Industrial Auto Parts & Machinery",
      quantity: 80,
      weight: 3200,
      cpm: 100,
      freight: 48000,
      additionalCharges: 2000,
      discount: 0,
      totalAmount: 50000,
      paidAmount: 20000,
      remainingBalance: 30000,
      paymentStatus: "PARTIALLY_PAID",
      shipmentStatus: "IN_TRANSIT",
      currentLocation: "Sadiqabad Motorway Interchange M-5",
      notes: "Direct express delivery to central warehouse",
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      customer: { id: "c-customer-1", name: "Standard Customer", companyName: "Prime Logistics & Trade", phone: "0300 1234567", email: "customer@gmail.com" },
      vehicle: { id: "v-1", vehicleNumber: "LES-8921", vehicleType: "10 Wheeler Bedford" },
      driver: { id: "d-1", name: "Muhammad Khan", phone: "0301 5566778" },
      trackingEvents: [
        { id: "te-101-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway Interchange M-5", timestamp: new Date(Date.now() - 3600000 * 2), description: "Cargo convoy in transit on Motorway M-5." },
        { id: "te-101-2", status: "DISPATCHED", location: "Lahore Central Logistics Hub", timestamp: new Date(Date.now() - 3600000 * 8), description: "Dispatched from Lahore terminal via Vehicle LES-8921." },
        { id: "te-101-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 20), description: "Consignment booked and verified." },
      ],
      payments: [
        { id: "pay-101-1", amount: 20000, paymentMethod: "CASH", paymentType: "ADVANCE", date: new Date() }
      ]
    },
    {
      id: "bilty-cust-102",
      biltyNumber: "SPD-KHI-2026-0102",
      trackingId: "SPD-2026-00102",
      date: new Date(Date.now() - 3600000 * 10).toISOString(),
      senderName: "Standard Customer (Prime Logistics)",
      senderPhone: "0300 1234567",
      senderAddress: "SITE Area, Karachi",
      receiverName: "Islamabad Distribution Center",
      receiverPhone: "0333 8765432",
      receiverAddress: "Sector I-9 Industrial Area, Islamabad",
      origin: "Karachi",
      destination: "Islamabad",
      warehouse: "KARACHI",
      vehicleNumber: "KHI-7720",
      driverName: "Abdul Ghaffar",
      packageDetails: "Electronics & Commercial Displays",
      quantity: 120,
      weight: 2400,
      cpm: 120,
      freight: 65000,
      additionalCharges: 3000,
      discount: 0,
      totalAmount: 68000,
      paidAmount: 0,
      remainingBalance: 68000,
      paymentStatus: "UNPAID",
      shipmentStatus: "DISPATCHED",
      currentLocation: "Hyderabad National Highway Bypass",
      notes: "Fragile electronic panels - Keep upright",
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      customer: { id: "c-customer-1", name: "Standard Customer", companyName: "Prime Logistics & Trade", phone: "0300 1234567", email: "customer@gmail.com" },
      vehicle: { id: "v-2", vehicleNumber: "KHI-7720", vehicleType: "Prime Mover 22 Wheeler" },
      driver: { id: "d-2", name: "Abdul Ghaffar", phone: "0345 9988112" },
      trackingEvents: [
        { id: "te-102-1", status: "DISPATCHED", location: "Hyderabad Highway Bypass", timestamp: new Date(Date.now() - 3600000 * 4), description: "En route to toll checkpoint." },
        { id: "te-102-2", status: "BOOKED", location: "Karachi Port Hub", timestamp: new Date(Date.now() - 3600000 * 10), description: "Bilty registered and loaded onto vehicle." },
      ],
      payments: []
    },
    {
      id: "bilty-cust-103",
      biltyNumber: "SPD-LHR-2026-0103",
      trackingId: "SPD-2026-00103",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      senderName: "Standard Customer (Prime Logistics)",
      senderPhone: "0300 1234567",
      senderAddress: "Kot Lakhpat, Lahore",
      receiverName: "Peshawar Wholesale Depot",
      receiverPhone: "0301 2345678",
      receiverAddress: "Hayatabad Industrial Area, Peshawar",
      origin: "Lahore",
      destination: "Peshawar",
      warehouse: "LAHORE",
      vehicleNumber: "PMA-7102",
      driverName: "Rashid Ali",
      packageDetails: "Consumer Packaged Goods & Beverages",
      quantity: 150,
      weight: 4100,
      cpm: 90,
      freight: 42000,
      additionalCharges: 1000,
      discount: 1000,
      totalAmount: 42000,
      paidAmount: 42000,
      remainingBalance: 0,
      paymentStatus: "PAID",
      shipmentStatus: "DELIVERED",
      currentLocation: "Peshawar Wholesale Depot",
      deliveryDate: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: "Successfully delivered. Receiving voucher signed.",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      customer: { id: "c-customer-1", name: "Standard Customer", companyName: "Prime Logistics & Trade", phone: "0300 1234567", email: "customer@gmail.com" },
      vehicle: { id: "v-3", vehicleNumber: "PMA-7102", vehicleType: "Mazda Titan" },
      driver: { id: "d-3", name: "Rashid Ali", phone: "0333 1122334" },
      trackingEvents: [
        { id: "te-103-1", status: "DELIVERED", location: "Peshawar Depot", timestamp: new Date(Date.now() - 3600000 * 5), description: "Delivered to receiving manager." },
        { id: "te-103-2", status: "OUT_FOR_DELIVERY", location: "Peshawar Ring Road", timestamp: new Date(Date.now() - 3600000 * 12), description: "Out for final delivery." },
        { id: "te-103-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 86400000 * 2), description: "Booking confirmed." },
      ],
      payments: [
        { id: "pay-103-1", amount: 42000, paymentMethod: "ONLINE", paymentType: "FULL", date: new Date() }
      ]
    },
    {
      id: "bilty-mock-1",
      biltyNumber: "SPD-LHR-2026-0042",
      trackingId: "SPD-2026-000142",
      date: new Date().toISOString(),
      senderName: "Crescent Textile Mills Ltd",
      senderPhone: "0300 1234567",
      senderAddress: "Kot Lakhpat Industrial Area, Lahore",
      receiverName: "Metro Cash & Carry Terminal",
      receiverPhone: "0321 9876543",
      receiverAddress: "University Road, Karachi",
      origin: "Lahore",
      destination: "Karachi",
      warehouse: "LAHORE",
      vehicleNumber: "LES-8921",
      driverName: "Muhammad Khan",
      packageDetails: "Textile Fabrics & Yarn Cartons",
      quantity: 120,
      weight: 4500,
      cpm: 120,
      freight: 45000,
      additionalCharges: 1500,
      discount: 500,
      totalAmount: 46000,
      paidAmount: 46000,
      remainingBalance: 0,
      paymentStatus: "PAID",
      shipmentStatus: "IN_TRANSIT",
      currentLocation: "Sadiqabad Motorway Bypass",
      notes: "Express Priority Consignment",
      createdAt: new Date().toISOString(),
      customer: { id: "c-1", name: "Mian Muhammad Mansha", companyName: "Crescent Textile Mills Ltd", phone: "0300 1234567" },
      vehicle: { id: "v-1", vehicleNumber: "LES-8921", vehicleType: "10 Wheeler Bedford" },
      driver: { id: "d-1", name: "Muhammad Khan", phone: "0301 5566778" },
      trackingEvents: [
        { id: "te-1", status: "IN_TRANSIT", location: "Sadiqabad Motorway", timestamp: new Date(), notes: "In transit on Motorway M-5" },
        { id: "te-2", status: "DISPATCHED", location: "Lahore Central Hub", timestamp: new Date(Date.now() - 3600000 * 6), notes: "Dispatched from warehouse" },
        { id: "te-3", status: "BOOKED", location: "Lahore Station", timestamp: new Date(Date.now() - 3600000 * 12), notes: "Shipment booked and loaded" },
      ],
      payments: [
        { id: "p-1", amount: 46000, paymentMethod: "CASH", paymentType: "FREIGHT", date: new Date() }
      ]
    },
    {
      id: "bilty-mock-2",
      biltyNumber: "SPD-KHI-2026-0038",
      trackingId: "SPD-2026-000141",
      date: new Date(Date.now() - 86400000).toISOString(),
      senderName: "Al-Rahim Trading Company",
      senderPhone: "0333 4455667",
      senderAddress: "SITE Area, Karachi",
      receiverName: "Islamabad Mega Commercial Mall",
      receiverPhone: "0312 3344556",
      receiverAddress: "Sector I-9 Industrial Area, Islamabad",
      origin: "Karachi",
      destination: "Islamabad",
      warehouse: "KARACHI",
      vehicleNumber: "KHI-7720",
      driverName: "Abdul Ghaffar",
      packageDetails: "Electronics & Household Goods",
      quantity: 45,
      weight: 2800,
      cpm: 90,
      freight: 82000,
      additionalCharges: 2000,
      discount: 0,
      totalAmount: 84000,
      paidAmount: 30000,
      remainingBalance: 54000,
      paymentStatus: "PARTIALLY_PAID",
      shipmentStatus: "DISPATCHED",
      currentLocation: "Hyderabad Junction Hub",
      notes: "Handle with Care - Electronic Merchandise",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      customer: { id: "c-2", name: "Haji Rahim", companyName: "Al-Rahim Trading", phone: "0333 4455667" },
      vehicle: { id: "v-2", vehicleNumber: "KHI-7720", vehicleType: "Prime Mover 22 Wheeler" },
      driver: { id: "d-2", name: "Abdul Ghaffar", phone: "0345 9988112" },
      trackingEvents: [
        { id: "te-4", status: "DISPATCHED", location: "Hyderabad Bypass", timestamp: new Date(), notes: "Crossed Hyderabad Toll Plaza" },
        { id: "te-5", status: "BOOKED", location: "Karachi Terminal", timestamp: new Date(Date.now() - 86400000), notes: "Container sealed and dispatched" }
      ],
      payments: [
        { id: "p-2", amount: 30000, paymentMethod: "ONLINE", paymentType: "ADVANCE", date: new Date(Date.now() - 86400000) }
      ]
    },
    {
      id: "bilty-mock-3",
      biltyNumber: "SPD-LHR-2026-0035",
      trackingId: "SPD-2026-000140",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      senderName: "Packages Limited",
      senderPhone: "042 35811544",
      senderAddress: "Shahrah-e-Roomi, Lahore",
      receiverName: "Peshawar Industrial Cargo Hub",
      receiverPhone: "0300 7788990",
      receiverAddress: "Hayatabad Industrial Estate, Peshawar",
      origin: "Lahore",
      destination: "Peshawar",
      warehouse: "LAHORE",
      vehicleNumber: "TK-4431",
      driverName: "Sardar Ali",
      packageDetails: "Packaging Materials & Printed Cartons",
      quantity: 350,
      weight: 3800,
      cpm: 150,
      freight: 38000,
      additionalCharges: 1000,
      discount: 0,
      totalAmount: 39000,
      paidAmount: 39000,
      remainingBalance: 0,
      paymentStatus: "PAID",
      shipmentStatus: "DELIVERED",
      currentLocation: "Peshawar Delivery Station",
      notes: "Consignment safely delivered and signed",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      customer: { id: "c-3", name: "Syed Babar Ali", companyName: "Packages Limited", phone: "042 35811544" },
      vehicle: { id: "v-3", vehicleNumber: "TK-4431", vehicleType: "6 Wheeler Hino Truck" },
      driver: { id: "d-3", name: "Sardar Ali", phone: "0313 5544332" },
      trackingEvents: [
        { id: "te-6", status: "DELIVERED", location: "Peshawar", timestamp: new Date(), notes: "Delivered to receiver and acknowledged" }
      ],
      payments: [
        { id: "p-3", amount: 39000, paymentMethod: "CASH", paymentType: "FREIGHT", date: new Date() }
      ]
    },
    {
      id: "bilty-mock-4",
      biltyNumber: "SPD-LHR-2026-0029",
      trackingId: "SPD-2026-000138",
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      senderName: "National Steel Traders",
      senderPhone: "0321 7654321",
      senderAddress: "GT Road, Gujranwala",
      receiverName: "Quetta Railway Goods Terminal",
      receiverPhone: "0331 2233445",
      receiverAddress: "Zarghun Road, Quetta",
      origin: "Lahore",
      destination: "Quetta",
      warehouse: "LAHORE",
      vehicleNumber: "QTA-5512",
      driverName: "Jan Muhammad",
      packageDetails: "Steel Wire Rods & Hardware Supplies",
      quantity: 80,
      weight: 6200,
      cpm: 80,
      freight: 95000,
      additionalCharges: 3000,
      discount: 1000,
      totalAmount: 97000,
      paidAmount: 50000,
      remainingBalance: 47000,
      paymentStatus: "PARTIALLY_PAID",
      shipmentStatus: "IN_TRANSIT",
      currentLocation: "Sukkur Bypass Hub",
      notes: "Heavy Commercial Steel Consignment",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      customer: { id: "c-4", name: "Malik Usman", companyName: "National Steel Traders", phone: "0321 7654321" },
      vehicle: { id: "v-4", vehicleNumber: "QTA-5512", vehicleType: "10 Wheeler Bedford" },
      driver: { id: "d-4", name: "Jan Muhammad", phone: "0302 1122334" },
      trackingEvents: [
        { id: "te-7", status: "IN_TRANSIT", location: "Sukkur", timestamp: new Date(), notes: "In transit towards Quetta via Shikarpur" }
      ],
      payments: [
        { id: "p-4", amount: 50000, paymentMethod: "BANK_TRANSFER", paymentType: "ADVANCE", date: new Date() }
      ]
    }
  ];

  const DEFAULT_CUSTOMERS = [
    { id: "c-customer-1", name: "Standard Customer", companyName: "Prime Logistics & Trade", phone: "0300 1234567", city: "Lahore", email: "customer@gmail.com" },
    { id: "c-1", name: "Mian Muhammad Mansha", companyName: "Crescent Textile Mills Ltd", phone: "0300 1234567", city: "Lahore" },
    { id: "c-2", name: "Haji Rahim", companyName: "Al-Rahim Trading", phone: "0333 4455667", city: "Karachi" },
    { id: "c-3", name: "Syed Babar Ali", companyName: "Packages Limited", phone: "042 35811544", city: "Lahore" },
    { id: "c-4", name: "Malik Usman", companyName: "National Steel Traders", phone: "0321 7654321", city: "Gujranwala" },
  ];
  const DEFAULT_DRIVERS = [
    { id: "d-1", name: "Muhammad Khan", phone: "0301 5566778", vehicleNumber: "LES-8921" },
    { id: "d-2", name: "Abdul Ghaffar", phone: "0345 9988112", vehicleNumber: "KHI-7720" },
    { id: "d-3", name: "Sardar Ali", phone: "0313 5544332", vehicleNumber: "TK-4431" },
    { id: "d-4", name: "Jan Muhammad", phone: "0302 1122334", vehicleNumber: "QTA-5512" },
  ];
  const DEFAULT_VEHICLES = [
    { id: "v-1", vehicleNumber: "LES-8921", vehicleType: "10 Wheeler Bedford", capacity: "20 Ton" },
    { id: "v-2", vehicleNumber: "KHI-7720", vehicleType: "Prime Mover 22 Wheeler", capacity: "40 Ton" },
    { id: "v-3", vehicleNumber: "TK-4431", vehicleType: "6 Wheeler Hino Truck", capacity: "10 Ton" },
    { id: "v-4", vehicleNumber: "QTA-5512", vehicleType: "10 Wheeler Bedford", capacity: "20 Ton" },
  ];

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
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (warehouseFilter) params.append("warehouse", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);

      let apiItems: any[] = [];
      try {
        const res = await fetch(`/api/admin/bilty?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          apiItems = data.data;
        } else {
          apiItems = [...DEFAULT_CLIENT_CONSIGNMENTS];
        }
      } catch (err) {
        apiItems = [...DEFAULT_CLIENT_CONSIGNMENTS];
      }

      // Merge locally stored bilties (kept at top) with API seed bilties
      const localBilties = getLocalBilties();
      const deletedIds = getDeletedBiltyIds();
      let items = mergeLocalWithApi(localBilties, apiItems, deletedIds, "biltyNumber").filter(
        (b) => b.shipmentStatus !== "DELETED"
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

      setConsignments(items);
    } catch (err) {
      console.warn("Error fetching consignments, using demo list:", err);
      setConsignments(mergeLocalWithApi(getLocalBilties(), DEFAULT_CLIENT_CONSIGNMENTS, getDeletedBiltyIds(), "biltyNumber"));
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
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

      setCustomers(mergeLocalWithApi(getStoredCustomers(), apiCustomers, getDeletedCustomerIds()));
      setDrivers(mergeLocalWithApi(getStoredDrivers(), apiDrivers, getDeletedDriverIds()));
      setVehicles(mergeLocalWithApi(getStoredVehicles(), apiVehicles, getDeletedVehicleIds(), "registrationNumber"));
    } catch (err) {
      console.warn("Error fetching dependencies, using fallbacks:", err);
      setCustomers(mergeLocalWithApi(getStoredCustomers(), DEFAULT_CUSTOMERS, getDeletedCustomerIds()));
      setDrivers(mergeLocalWithApi(getStoredDrivers(), DEFAULT_DRIVERS, getDeletedDriverIds()));
      setVehicles(mergeLocalWithApi(getStoredVehicles(), DEFAULT_VEHICLES, getDeletedVehicleIds(), "registrationNumber"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBilty?.id) return;
    setDeleteLoading(true);
    try {
      // Remove locally immediately & move to Recycle Bin
      removeLocalBilty(deletingBilty.id, deletingBilty);
      setConsignments((prev) => prev.filter((b) => b.id !== deletingBilty.id));

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
    setSubmitting(true);
    setFormError("");

    try {
      const freightNum = parseFloat(formData.freight) || 0;
      const addlNum = parseFloat(formData.additionalCharges) || 0;
      const discNum = parseFloat(formData.discount) || 0;
      const paidNum = parseFloat(formData.paidAmount) || 0;
      const tot = Math.max(0, freightNum + addlNum - discNum);
      const rem = Math.max(0, tot - paidNum);
      const pStatus = rem <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "PENDING";

      const createdBilty = {
        id: `bilty_loc_${Date.now()}`,
        biltyNumber: formData.biltyNumber || `SPD-LHR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        trackingId: formData.trackingId || `SPD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        date: formData.date || new Date().toISOString().slice(0, 10),
        customerId: formData.customerId || undefined,
        senderName: formData.senderName || "Valued Shipper",
        senderPhone: formData.senderPhone || "",
        senderAddress: formData.senderAddress || "",
        receiverName: formData.receiverName || "Valued Consignee",
        receiverPhone: formData.receiverPhone || "",
        receiverAddress: formData.receiverAddress || "",
        origin: formData.origin || "Lahore",
        destination: formData.destination || "Karachi",
        warehouse: formData.warehouse || "LAHORE",
        vehicleId: formData.vehicleId || undefined,
        vehicleNumber: formData.vehicleNumber || "LES-8921",
        driverId: formData.driverId || undefined,
        driverName: formData.driverName || "Muhammad Khan",
        packageDetails: formData.packageDetails || "General Commercial Cargo",
        quantity: parseInt(formData.quantity) || 1,
        weight: formData.weight ? parseFloat(formData.weight) : 50,
        cpm: formData.cpm ? parseFloat(formData.cpm) : null,
        freight: freightNum,
        additionalCharges: addlNum,
        discount: discNum,
        totalAmount: tot,
        paidAmount: paidNum,
        remainingBalance: rem,
        paymentStatus: pStatus,
        shipmentStatus: formData.shipmentStatus || "BOOKED",
        notes: formData.notes || "",
        photos: formData.photos || [],
        createdAt: new Date().toISOString(),
        trackingEvents: [
          {
            id: `te_${Date.now()}`,
            status: formData.shipmentStatus || "BOOKED",
            location: `${formData.origin || "Lahore"} Dispatch Station`,
            description: `Consignment Bilty #${formData.biltyNumber} booked for transit to ${formData.destination || "Karachi"}.`,
            timestamp: new Date(),
          },
        ],
        payments: paidNum > 0 ? [
          { id: `p_${Date.now()}`, amount: paidNum, paymentMethod: "CASH", paymentType: "ADVANCE", date: new Date() }
        ] : [],
      };

      // Save to localStorage immediately
      saveLocalBilty(createdBilty);

      // Prepend to consignments state immediately
      setConsignments((prev) => [createdBilty, ...prev]);

      // Background API attempt
      fetch("/api/admin/bilty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).catch((err) => console.warn("Background bilty API save:", err));

      setNewBiltyOpen(false);
      setActionFeedback({ type: "success", text: `Bilty #${createdBilty.biltyNumber} saved successfully.` });
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
        additionalCharges: addlNum,
        discount: discNum,
        totalAmount: tot,
        paidAmount: paidNum,
        remainingBalance: rem,
        paymentStatus: pStatus,
        quantity: parseInt(editFormData.quantity) || 1,
        weight: editFormData.weight ? parseFloat(editFormData.weight) : null,
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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate official consignment bilty vouchers, assign fleet drivers, update status, and print vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!consignments.length}
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
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-400 font-semibold">Loading consignments...</p>
        </div>
      ) : consignments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No consignments found"
          description="Create your first consignment bilty voucher to initiate shipment dispatch."
        />
      ) : (
        <>
          {/* MOBILE CARDS VIEW (< 768px) */}
          <div className="block md:hidden space-y-3">
            {consignments.map((c) => {
              const targetPhone = c.receiver?.whatsapp || c.receiverPhone || c.receiver?.phone || c.customer?.whatsapp || c.customer?.phone;
              const waMsg = targetPhone ? getBiltyTrackingWhatsAppMessage({
                biltyNumber: c.biltyNumber,
                trackingId: c.trackingId,
                status: c.shipmentStatus,
                origin: c.origin,
                destination: c.destination,
              }) : "";

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  {/* Card Header: Bilty #, Tracking & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white">{c.biltyNumber}</p>
                      <p className="text-[11px] text-spd-blue font-mono font-bold">{c.trackingId}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(c.date)}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                        c.shipmentStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : c.shipmentStatus === "IN_TRANSIT" || c.shipmentStatus === "DRIVER_ON_THE_WAY"
                          ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {c.shipmentStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Route & Hub */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black">{c.origin}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="font-black text-spd-blue">{c.destination}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.warehouse === "KARACHI"
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
                      <span className="text-slate-400 font-normal">From: </span>
                      {c.customer?.companyName || c.senderName}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 truncate">
                      <span className="text-slate-400 font-normal">To: </span>
                      {c.receiverName} {c.receiverPhone && `(${c.receiverPhone})`}
                    </p>
                    {c.packageDetails && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="text-slate-400 font-normal">Cargo: </span>
                        {c.packageDetails} ({c.quantity} pcs &bull; {c.weight} kg)
                      </p>
                    )}
                  </div>

                  {/* Fleet & Financials */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Freight</p>
                      <p className="font-black text-slate-900 dark:text-white">{formatCurrency(c.totalAmount)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Paid: {formatCurrency(c.paidAmount)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Balance</p>
                      <p className={`font-black ${c.remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {formatCurrency(c.remainingBalance)}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{c.paymentStatus}</p>
                    </div>
                  </div>

                  {/* Vehicle & Driver */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {c.vehicleNumber || c.vehicle?.vehicleNumber || "No Truck"}
                    </span>
                    <span className="truncate max-w-[150px]">
                      Driver: {c.driverName || c.driver?.name || "Unassigned"}
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
                        onClick={() => router.push(`/admin/bilty/${c.id}/edit`)}
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
                          shipmentStatus: c.shipmentStatus,
                          location: `${c.destination} Terminal`,
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
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin">
              <Table className="min-w-[950px]">
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Bilty # / Tracking</TableHead>
                    <TableHead className="text-xs font-bold">Shipper & Receiver</TableHead>
                    <TableHead className="text-xs font-bold">Route & Station</TableHead>
                    <TableHead className="text-xs font-bold">Truck & Driver</TableHead>
                    <TableHead className="text-xs font-bold">Total Freight</TableHead>
                    <TableHead className="text-xs font-bold">Balance</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consignments.map((c) => (
                    <TableRow
                      key={c.id}
                      id={`record-${c.id}`}
                      data-record-id={c.id}
                      className={cn(
                        "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all",
                        highlightClass(c.id) || highlightClass(c.biltyNumber)
                      )}
                    >
                      <TableCell>
                        <div>
                          <p className="font-black text-xs text-slate-900 dark:text-white">{c.biltyNumber}</p>
                          <p className="text-[10px] text-spd-blue font-mono font-bold">{c.trackingId}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(c.date)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            From: {c.customer?.companyName || c.senderName}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            To: {c.receiverName} ({c.receiverPhone || "No phone"})
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.packageDetails}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span>{c.origin}</span>
                            <span>&rarr;</span>
                            <span>{c.destination}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-bold mt-1 inline-block ${
                              c.warehouse === "KARACHI"
                                ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                                : "bg-red-100 text-spd-red dark:bg-red-950/60 dark:text-red-400"
                            }`}
                          >
                            {c.warehouse || "LAHORE"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {c.vehicleNumber || c.vehicle?.vehicleNumber || "Unassigned"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Driver: {c.driverName || c.driver?.name || "Unassigned"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {formatCurrency(c.totalAmount)}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Paid: {formatCurrency(c.paidAmount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-black ${
                            c.remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(c.remainingBalance)}
                        </span>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{c.paymentStatus}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                            c.shipmentStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : c.shipmentStatus === "IN_TRANSIT" || c.shipmentStatus === "DRIVER_ON_THE_WAY"
                              ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {c.shipmentStatus.replace(/_/g, " ")}
                        </span>
                      </TableCell>
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
                            onClick={() => router.push(`/admin/bilty/${c.id}/edit`)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Edit</span>
                          </Button>
                          {(() => {
                            const targetPhone = c.receiver?.whatsapp || c.receiverPhone || c.receiver?.phone || c.customer?.whatsapp || c.customer?.phone;
                            if (!targetPhone) return null;
                            const msg = getBiltyTrackingWhatsAppMessage({
                              biltyNumber: c.biltyNumber,
                              trackingId: c.trackingId,
                              status: c.shipmentStatus,
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
                                shipmentStatus: c.shipmentStatus,
                                location: `${c.destination} Terminal`,
                                statusNote: "",
                                receivedBy: c.receiverName || "",
                                deliveryDate: new Date().toISOString().slice(0, 10),
                              });
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Update Status</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
              {viewDetailsBilty?.id && (
                <Link href={`/admin/bilty/${viewDetailsBilty.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Page View
                  </Button>
                </Link>
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

