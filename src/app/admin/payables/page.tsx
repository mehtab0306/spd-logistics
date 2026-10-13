"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  Search,
  RefreshCw,
  Plus,
  Printer,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Truck,
  Fuel,
  Wrench,
  Building,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  FileText,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/export-excel";

interface PayableItem {
  id: string;
  vendorName: string;
  category: string;
  reference?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string | null;
  status: "UNPAID" | "PARTIAL" | "PAID";
  notes?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "DRIVER_PAYMENT", label: "Driver Payment" },
  { value: "TRANSPORTER", label: "Transporter / Hired Vehicle" },
  { value: "FUEL", label: "Fuel & Diesel" },
  { value: "VEHICLE_MAINTENANCE", label: "Vehicle Maintenance" },
  { value: "OFFICE_EXPENSE", label: "Office Expense" },
  { value: "OTHER", label: "Other Operational" },
];

export default function PayablesPage() {
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [summary, setSummary] = useState({
    totalPayables: 0,
    totalPaid: 0,
    totalRemaining: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Cash books for payout dropdown
  const [cashBooks, setCashBooks] = useState<any[]>([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null);

  // Add / Edit Form State
  const [formVendor, setFormVendor] = useState("");
  const [formCategory, setFormCategory] = useState("DRIVER_PAYMENT");
  const [formReference, setFormReference] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formPaid, setFormPaid] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Pay Form State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payCashBookId, setPayCashBookId] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payError, setPayError] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  const LOCAL_PAYABLES_KEY = "spd_local_payables";
  const LOCAL_DELETED_PAYABLES_KEY = "spd_deleted_payables";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      let serverPayables: PayableItem[] = [];
      try {
        const res = await fetch(`/api/admin/payables?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.payables)) {
          serverPayables = data.data.payables;
        }
      } catch (e) {
        console.warn("Could not fetch remote payables, using local state:", e);
      }

      // Merge local storage payables
      let localPayables: PayableItem[] = [];
      let deletedIds: string[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_PAYABLES_KEY);
          if (raw) localPayables = JSON.parse(raw);
          const delRaw = localStorage.getItem(LOCAL_DELETED_PAYABLES_KEY);
          if (delRaw) deletedIds = JSON.parse(delRaw);
        } catch (e) {}
      }

      // Merge and filter
      const combinedMap = new Map<string, PayableItem>();
      // First add server payables not deleted
      serverPayables.forEach((p) => {
        if (!deletedIds.includes(p.id)) {
          combinedMap.set(p.id, p);
        }
      });
      // Override or prepend local payables
      localPayables.forEach((p) => {
        if (!deletedIds.includes(p.id)) {
          combinedMap.set(p.id, p);
        }
      });

      let merged = Array.from(combinedMap.values());
      // Apply filters if needed
      if (search) {
        const q = search.toLowerCase();
        merged = merged.filter(
          (p) =>
            p.vendorName?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.reference?.toLowerCase().includes(q) ||
            p.driverName?.toLowerCase().includes(q) ||
            p.vehicleNumber?.toLowerCase().includes(q)
        );
      }
      if (categoryFilter !== "ALL") {
        merged = merged.filter((p) => p.category === categoryFilter);
      }
      if (statusFilter !== "ALL") {
        merged = merged.filter((p) => p.status === statusFilter);
      }

      // Calculate summary
      const totalPayables = merged.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
      const totalPaid = merged.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const totalRemaining = merged.reduce((sum, p) => sum + (Number(p.remainingAmount) || 0), 0);
      const now = new Date();
      const overdueCount = merged.filter(
        (p) => p.status !== "PAID" && p.dueDate && new Date(p.dueDate) < now
      ).length;

      setPayables(merged);
      setSummary({ totalPayables, totalPaid, totalRemaining, overdueCount });
    } catch (err) {
      console.error("Failed to load payables:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
    fetch("/api/admin/cash-books")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCashBooks(d.data || []);
      })
      .catch(() => {});
  }, [fetchData]);

  const handleOpenAdd = () => {
    setFormVendor("");
    setFormCategory("DRIVER_PAYMENT");
    setFormReference(`BILL-${Date.now().toString().slice(-5)}`);
    setFormVehicle("");
    setFormDriver("");
    setFormDescription("");
    setFormTotal("");
    setFormPaid("0");
    setFormDueDate("");
    setFormNotes("");
    setFormError("");
    setAddModalOpen(true);
  };

  const handleOpenEdit = (item: PayableItem) => {
    setSelectedPayable(item);
    setFormVendor(item.vendorName);
    setFormCategory(item.category);
    setFormReference(item.reference || "");
    setFormVehicle(item.vehicleNumber || "");
    setFormDriver(item.driverName || "");
    setFormDescription(item.description);
    setFormTotal(String(item.totalAmount));
    setFormPaid(String(item.paidAmount));
    setFormDueDate(item.dueDate ? item.dueDate.slice(0, 10) : "");
    setFormNotes(item.notes || "");
    setFormError("");
    setEditModalOpen(true);
  };

  const handleOpenPay = (item: PayableItem) => {
    setSelectedPayable(item);
    setPayAmount(String(item.remainingAmount));
    setPayMethod("CASH");
    setPayCashBookId("");
    setPayNotes(`Payment towards ${item.description}`);
    setPayError("");
    setPayModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor.trim() || !formDescription.trim() || !formTotal) {
      setFormError("Beneficiary, description, and total amount are required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");
      const totalNum = parseFloat(formTotal) || 0;
      const paidNum = parseFloat(formPaid) || 0;
      const remNum = Math.max(0, totalNum - paidNum);
      const newStatus = remNum <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "UNPAID";

      const localItem: PayableItem = {
        id: `pay_loc_${Date.now()}`,
        vendorName: formVendor,
        category: formCategory,
        reference: formReference || `BILL-${Date.now().toString().slice(-5)}`,
        vehicleNumber: formVehicle || null,
        driverName: formDriver || null,
        description: formDescription,
        totalAmount: totalNum,
        paidAmount: paidNum,
        remainingAmount: remNum,
        dueDate: formDueDate || null,
        status: newStatus as any,
        notes: formNotes || null,
        createdAt: new Date().toISOString(),
      };

      // Optimistically save to localStorage
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_PAYABLES_KEY);
          const current: PayableItem[] = raw ? JSON.parse(raw) : [];
          current.unshift(localItem);
          localStorage.setItem(LOCAL_PAYABLES_KEY, JSON.stringify(current));
        } catch (e) {}
      }

      setAddModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("spd-notifications-updated"));

      // Background sync
      fetch("/api/admin/payables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: formVendor,
          category: formCategory,
          reference: formReference,
          vehicleNumber: formVehicle,
          driverName: formDriver,
          description: formDescription,
          totalAmount: formTotal,
          paidAmount: formPaid,
          dueDate: formDueDate || undefined,
          notes: formNotes,
        }),
      }).catch((e) => console.warn("Background payable save warning:", e));
    } catch (err: any) {
      setFormError(err.message || "Failed to save payable");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;

    try {
      setFormSubmitting(true);
      setFormError("");
      const totalNum = parseFloat(formTotal) || 0;
      const paidNum = selectedPayable.paidAmount || 0;
      const remNum = Math.max(0, totalNum - paidNum);
      const newStatus = remNum <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "UNPAID";

      const updatedItem: PayableItem = {
        ...selectedPayable,
        vendorName: formVendor,
        category: formCategory,
        reference: formReference || selectedPayable.reference,
        vehicleNumber: formVehicle || null,
        driverName: formDriver || null,
        description: formDescription,
        totalAmount: totalNum,
        paidAmount: paidNum,
        remainingAmount: remNum,
        dueDate: formDueDate || null,
        status: newStatus as any,
        notes: formNotes || null,
      };

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_PAYABLES_KEY);
          let current: PayableItem[] = raw ? JSON.parse(raw) : [];
          const idx = current.findIndex((p) => p.id === selectedPayable.id);
          if (idx >= 0) {
            current[idx] = updatedItem;
          } else {
            current.unshift(updatedItem);
          }
          localStorage.setItem(LOCAL_PAYABLES_KEY, JSON.stringify(current));
        } catch (e) {}
      }

      setEditModalOpen(false);
      fetchData();

      // Background sync
      fetch("/api/admin/payables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPayable.id,
          vendorName: formVendor,
          category: formCategory,
          reference: formReference,
          vehicleNumber: formVehicle,
          driverName: formDriver,
          description: formDescription,
          totalAmount: formTotal,
          dueDate: formDueDate || null,
          notes: formNotes,
        }),
      }).catch((e) => console.warn("Background payable edit warning:", e));
    } catch (err: any) {
      setFormError(err.message || "Failed to update payable");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSavePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;

    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      setPayError("Valid positive payout amount required");
      return;
    }

    try {
      setPaySubmitting(true);
      setPayError("");
      const newPaid = (selectedPayable.paidAmount || 0) + num;
      const newRemaining = Math.max(0, (selectedPayable.totalAmount || 0) - newPaid);
      const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

      const updatedItem: PayableItem = {
        ...selectedPayable,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus as any,
      };

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_PAYABLES_KEY);
          let current: PayableItem[] = raw ? JSON.parse(raw) : [];
          const idx = current.findIndex((p) => p.id === selectedPayable.id);
          if (idx >= 0) {
            current[idx] = updatedItem;
          } else {
            current.unshift(updatedItem);
          }
          localStorage.setItem(LOCAL_PAYABLES_KEY, JSON.stringify(current));
        } catch (e) {}
      }

      setPayModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("spd-notifications-updated"));

      // Background sync
      fetch("/api/admin/payables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPayable.id,
          recordPayment: true,
          paymentAmount: num,
          paymentMethod: payMethod,
          cashBookId: payCashBookId || undefined,
          notes: payNotes,
        }),
      }).catch((e) => console.warn("Background payment warning:", e));
    } catch (err: any) {
      setPayError(err.message || "Failed to record payout");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove payable for "${name}"?`)) return;

    if (typeof window !== "undefined") {
      try {
        const delRaw = localStorage.getItem(LOCAL_DELETED_PAYABLES_KEY);
        const deletedIds: string[] = delRaw ? JSON.parse(delRaw) : [];
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem(LOCAL_DELETED_PAYABLES_KEY, JSON.stringify(deletedIds));
        }
        const raw = localStorage.getItem(LOCAL_PAYABLES_KEY);
        if (raw) {
          const current: PayableItem[] = JSON.parse(raw);
          localStorage.setItem(LOCAL_PAYABLES_KEY, JSON.stringify(current.filter((p) => p.id !== id)));
        }
      } catch (e) {}
    }

    fetchData();

    // Background sync
    fetch(`/api/admin/payables?id=${id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleExportExcel = () => {
    if (payables.length === 0) return;
    const data = payables.map((p) => ({
      "Vendor / Beneficiary": p.vendorName || "",
      "Category": p.category || "",
      "Reference": p.reference || "",
      "Vehicle / Truck": p.vehicleNumber || "",
      "Driver": p.driverName || "",
      "Description": p.description || "",
      "Total Amount (PKR)": p.totalAmount || 0,
      "Paid Amount (PKR)": p.paidAmount || 0,
      "Remaining Balance (PKR)": p.remainingAmount || 0,
      "Due Date": p.dueDate ? p.dueDate.slice(0, 10) : "",
      "Status": p.status || "UNPAID",
      "Notes": p.notes || "",
    }));

    exportToExcel(data, "SPD_Payables_Summary");
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "DRIVER_PAYMENT":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Driver Pay</Badge>;
      case "TRANSPORTER":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Transporter</Badge>;
      case "FUEL":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Fuel & Diesel</Badge>;
      case "VEHICLE_MAINTENANCE":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Maintenance</Badge>;
      case "OFFICE_EXPENSE":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Office</Badge>;
      default:
        return <Badge variant="outline">Operational</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Payables & Operational Expenses"
          description="Manage money company owes to drivers, hired vehicles, fuel pumps, mechanics, and suppliers."
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="w-full sm:w-auto gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={payables.length === 0}
              className="w-full sm:w-auto gap-1.5 bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="w-full sm:w-auto gap-1.5">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="default" size="sm" onClick={handleOpenAdd} className="w-full sm:w-auto bg-spd-red hover:bg-red-700 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Add Payable
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">SPD LOGISTICS — PAYABLES & EXPENSES REPORT</h2>
        <p className="text-sm text-gray-500">Super Pak Data Goods Transport Co. | Generated on {new Date().toLocaleDateString("en-PK")}</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <StatsCard
          title="Total Payables"
          value={formatCurrency(summary.totalPayables || 0)}
          icon={ArrowUpRight}
          description="Total recorded liabilities"
        />
        <StatsCard
          title="Total Paid Out"
          value={formatCurrency(summary.totalPaid || 0)}
          icon={CreditCard}
          description="Disbursements to date"
        />
        <div className="rounded-xl border p-6 bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Remaining Balance</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(summary.totalRemaining || 0)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Pending company payouts</p>
          </div>
        </div>
        <StatsCard
          title="Overdue Invoices"
          value={summary.overdueCount || 0}
          icon={AlertCircle}
          description="Past due settlement dates"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="print:hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by vendor, reference, or vehicle #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background focus-visible:ring-spd-red"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 bg-background border border-input rounded-xl text-xs font-semibold focus:ring-2 focus:ring-spd-red"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payables Data Table */}
      {loading && payables.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3 bg-card rounded-xl border">
          <RefreshCw className="h-8 w-8 animate-spin text-spd-red" />
          <p className="text-sm font-medium">Loading payables records...</p>
        </div>
      ) : payables.length === 0 ? (
        <EmptyState
          icon={ArrowUpRight}
          title="No payables found"
          description="Record trip payouts, fuel receipts, and maintenance costs by clicking 'Add Payable'."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold">Beneficiary / Vendor</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Reference / Bill #</TableHead>
                  <TableHead className="font-bold">Vehicle / Driver</TableHead>
                  <TableHead className="font-bold text-right">Total Amount</TableHead>
                  <TableHead className="font-bold text-right">Paid Amount</TableHead>
                  <TableHead className="font-bold text-right text-amber-600 dark:text-amber-400">Balance</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-center print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-bold text-foreground">{item.vendorName}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    </TableCell>

                    <TableCell>{getCategoryBadge(item.category)}</TableCell>

                    <TableCell className="font-mono text-xs font-semibold">
                      {item.reference || "—"}
                    </TableCell>

                    <TableCell className="text-xs">
                      {item.vehicleNumber && (
                        <div className="font-bold text-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span>{item.vehicleNumber}</span>
                        </div>
                      )}
                      {item.driverName && (
                        <div className="text-muted-foreground">{item.driverName}</div>
                      )}
                      {!item.vehicleNumber && !item.driverName && <span>—</span>}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>

                    <TableCell className="text-right text-emerald-600 font-semibold">
                      {formatCurrency(item.paidAmount)}
                    </TableCell>

                    <TableCell className="text-right font-black text-amber-600 dark:text-amber-400 text-base">
                      {formatCurrency(item.remainingAmount)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        className={`text-[10px] font-bold ${
                          item.status === "PAID"
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : item.status === "PARTIAL"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-spd-red hover:bg-red-700 text-white"
                        }`}
                      >
                        {item.status}
                      </Badge>
                      {item.dueDate && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Due {formatDate(item.dueDate)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {item.remainingAmount > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenPay(item)}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 p-0"
                          title="Edit payable"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.vendorName)}
                          className="h-8 w-8 p-0 text-destructive"
                          title="Delete payable"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* DIALOG: Add / Edit Payable */}
      <Dialog open={addModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddModalOpen(false);
          setEditModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-spd-red" />
              <span>{editModalOpen ? "Edit Payable Entry" : "Record New Payable"}</span>
            </DialogTitle>
            <DialogDescription>
              {editModalOpen ? "Modify liability details and due dates." : "Record an expense owed to a driver, transporter, or vendor."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editModalOpen ? handleSaveEdit : handleSaveAdd} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Beneficiary / Vendor *</Label>
                <Input
                  required
                  placeholder="Driver Tariq / PSO Fuel Pump"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Category *</Label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-spd-red"
                >
                  <option value="DRIVER_PAYMENT">Driver Payment</option>
                  <option value="TRANSPORTER">Transporter / Hired Vehicle</option>
                  <option value="FUEL">Fuel & Diesel</option>
                  <option value="VEHICLE_MAINTENANCE">Vehicle Maintenance</option>
                  <option value="OFFICE_EXPENSE">Office Expense</option>
                  <option value="OTHER">Other Operational</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Reference / Bill #</Label>
                <Input
                  placeholder="BILL-0982"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Vehicle #</Label>
                <Input
                  placeholder="LES-9988"
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Driver Name</Label>
                <Input
                  placeholder="Tariq Mehmood"
                  value={formDriver}
                  onChange={(e) => setFormDriver(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Description / Purpose *</Label>
              <Input
                required
                placeholder="Trip freight payment Lahore to Karachi / Diesel refueling"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Total Amount (PKR) *</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  placeholder="45000"
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                  className="h-10 rounded-xl text-xs font-bold"
                />
              </div>

              {!editModalOpen && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">Advance Paid (PKR)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                    className="h-10 rounded-xl text-xs font-medium text-emerald-600"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Due Date</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Notes / Remarks</Label>
              <Input
                placeholder="Fuel slip attached / Check paid on delivery"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }} disabled={formSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting} className="bg-spd-red hover:bg-red-700 text-white font-bold gap-2">
                {formSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editModalOpen ? "Save Changes" : "Create Payable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Record Payment Against Payable */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span>Record Payable Settlement</span>
            </DialogTitle>
            <DialogDescription>
              Record money paid to {selectedPayable?.vendorName} ({selectedPayable?.category}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePay} className="space-y-4 pt-2">
            {payError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Liability:</span>
                <span className="font-semibold">{formatCurrency(selectedPayable?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previously Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(selectedPayable?.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-muted-foreground font-bold">Remaining Balance:</span>
                <span className="font-bold text-amber-600">{formatCurrency(selectedPayable?.remainingAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Payout Amount (PKR) *</Label>
              <Input
                type="number"
                step="any"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 20000"
                className="h-11 rounded-xl text-base font-bold focus-visible:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Payment Method</Label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-11 px-3 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Deduct Cash Book</Label>
                <select
                  value={payCashBookId}
                  onChange={(e) => setPayCashBookId(e.target.value)}
                  className="w-full h-11 px-3 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No Cash Book (Direct)</option>
                  {cashBooks.map((cb) => (
                    <option key={cb.id} value={cb.id}>{cb.name} ({cb.city})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Memo / Notes</Label>
              <Input
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Payment voucher / receipt number"
                className="h-11 rounded-xl text-xs focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)} disabled={paySubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={paySubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                {paySubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Confirm Payout
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
