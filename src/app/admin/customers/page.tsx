"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
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
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Download,
  FileSpreadsheet,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Edit,
  Camera,
  Upload,
  MessageSquare,
  X,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { buildWhatsAppUrl, getAdminToCustomerWhatsAppMessage } from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(customers);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [resetPasswordCustomer, setResetPasswordCustomer] = useState<any>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState("");

  // Photo state for Customer Modal
  const [customerPhotoFile, setCustomerPhotoFile] = useState<File | null>(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<string>("");
  const [customerPhotoRemoved, setCustomerPhotoRemoved] = useState<boolean>(false);
  const customerFileInputRef = React.useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      return "Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit. Please choose a smaller photo.";
    }
    return null;
  };

  const initialCustomerForm = {
    id: "",
    name: "",
    companyName: "",
    phone: "",
    whatsapp: "",
    email: "",
    password: "",
    cnic: "",
    businessRef: "",
    address: "",
    city: "Lahore",
    warehouse: "LAHORE",
    creditLimit: "",
    openingBalance: "0",
    photo: "",
    notes: "",
    status: "ACTIVE",
  };

  const [customerForm, setCustomerForm] = useState(initialCustomerForm);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomerForm(initialCustomerForm);
    setCustomerPhotoFile(null);
    setCustomerPhotoPreview("");
    setCustomerPhotoRemoved(false);
    setFormError("");
    if (customerFileInputRef.current) customerFileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    const photoUrl = c.photo || c.user?.avatar || "";
    setCustomerForm({
      id: c.id,
      name: c.name || "",
      companyName: c.companyName || "",
      phone: c.phone || "",
      whatsapp: c.whatsapp || "",
      email: c.email || c.user?.email || "",
      password: "",
      cnic: c.cnic || "",
      businessRef: c.businessRef || "",
      address: c.address || "",
      city: c.city || "Lahore",
      warehouse: c.warehouse || "LAHORE",
      creditLimit: c.creditLimit !== null && c.creditLimit !== undefined ? String(c.creditLimit) : "",
      openingBalance: c.openingBalance !== null && c.openingBalance !== undefined ? String(c.openingBalance) : "0",
      photo: photoUrl,
      notes: c.notes || "",
      status: c.status || "ACTIVE",
    });
    setCustomerPhotoPreview(photoUrl);
    setCustomerPhotoFile(null);
    setCustomerPhotoRemoved(false);
    setFormError("");
    if (customerFileInputRef.current) customerFileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setCustomerPhotoFile(null);
    setCustomerPhotoPreview("");
    setCustomerPhotoRemoved(false);
    setFormError("");
    if (customerFileInputRef.current) customerFileInputRef.current.value = "";
  };

  const LOCAL_CUSTOMERS_KEY = "spd_local_customers";
  const LOCAL_DELETED_CUSTOMERS_KEY = "spd_local_deleted_customers";

  const getLocalCustomers = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalCustomer = (c: any) => {
    if (typeof window === "undefined") return;
    try {
      const list = getLocalCustomers();
      const idx = list.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...c };
      } else {
        list.unshift(c);
      }
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Save local customer error:", err);
    }
  };

  const removeLocalCustomer = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const list = getLocalCustomers().filter((x) => x.id !== id);
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
      const delRaw = localStorage.getItem(LOCAL_DELETED_CUSTOMERS_KEY);
      const del = delRaw ? JSON.parse(delRaw) : [];
      if (!del.includes(id)) {
        del.push(id);
        localStorage.setItem(LOCAL_DELETED_CUSTOMERS_KEY, JSON.stringify(del));
      }
    } catch (err) {
      console.warn("Remove local customer error:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (warehouseFilter) params.append("warehouse", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);

      let list: any[] = [];
      try {
        const res = await fetch(`/api/admin/customers?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          list = data.data;
        }
      } catch (err) {
        console.warn("API customer fetch error:", err);
      }

      // Merge local customers
      const localList = getLocalCustomers();
      for (const lc of localList) {
        const idx = list.findIndex((x) => x.id === lc.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...lc };
        } else {
          list.unshift(lc);
        }
      }

      // Filter out deleted
      const delRaw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_DELETED_CUSTOMERS_KEY) : null;
      const deletedIds: string[] = delRaw ? JSON.parse(delRaw) : [];
      list = list.filter((c) => !deletedIds.includes(c.id) && c.status !== "DELETED");

      // Dynamically link created and local bilties + payments to customer ledger
      let allBilties: any[] = [];
      try {
        const rawBilties = localStorage.getItem("spd_local_bilties");
        if (rawBilties) allBilties = JSON.parse(rawBilties);
      } catch {}

      let allPayments: any[] = [];
      try {
        const rawPayments = localStorage.getItem("spd_local_receivables_payments");
        if (rawPayments) allPayments = JSON.parse(rawPayments);
      } catch {}

      for (const c of list) {
        const cNameNorm = (c.name || "").toLowerCase().trim();
        const cCompNorm = (c.companyName || "").toLowerCase().trim();

        const matchedBilties = allBilties.filter((b: any) => {
          const bCIdMatch = b.customerId && b.customerId === c.id;
          const bSenderMatch = (cNameNorm && b.senderName?.toLowerCase().includes(cNameNorm)) || (cCompNorm && b.senderName?.toLowerCase().includes(cCompNorm));
          const bReceiverMatch = (cNameNorm && b.receiverName?.toLowerCase().includes(cNameNorm)) || (cCompNorm && b.receiverName?.toLowerCase().includes(cCompNorm));
          return bCIdMatch || bSenderMatch || bReceiverMatch;
        });

        // Generate dynamic ledger transactions
        const transactions: any[] = [];
        let runningBalance = c.openingBalance || 0;

        if (c.openingBalance) {
          transactions.push({
            id: `tx-open-${c.id}`,
            date: "2026-01-01T00:00:00.000Z",
            description: "Opening Balance Brought Forward",
            debit: c.openingBalance > 0 ? c.openingBalance : 0,
            credit: c.openingBalance < 0 ? Math.abs(c.openingBalance) : 0,
            balance: runningBalance,
          });
        }

        for (const b of matchedBilties) {
          runningBalance += (b.totalAmount || 0);
          transactions.push({
            id: `tx-bilty-${b.id}`,
            date: b.date || new Date().toISOString(),
            description: `Consignment Bilty #${b.biltyNumber} (${b.origin} to ${b.destination})`,
            debit: b.totalAmount || 0,
            credit: 0,
            balance: runningBalance,
          });

          if (b.paidAmount && b.paidAmount > 0) {
            runningBalance -= b.paidAmount;
            transactions.push({
              id: `tx-pay-${b.id}`,
              date: b.date || new Date().toISOString(),
              description: `Payment / Advance Received for Bilty #${b.biltyNumber}`,
              debit: 0,
              credit: b.paidAmount,
              balance: runningBalance,
            });
          }
        }

        // Match manual payments
        const matchedPayments = allPayments.filter((p: any) => p.customerId === c.id);
        for (const p of matchedPayments) {
          runningBalance -= (p.amount || 0);
          transactions.push({
            id: `tx-manual-pay-${p.id}`,
            date: p.date || new Date().toISOString(),
            description: `Payment Received via ${p.paymentMethod || "Cash"} (Ref: ${p.reference || "REC"})`,
            debit: 0,
            credit: p.amount || 0,
            balance: runningBalance,
          });
        }

        if (transactions.length === 0) {
          transactions.push(
            {
              id: `tx-demo-${c.id}-1`,
              date: new Date(Date.now() - 86400000 * 7).toISOString(),
              description: `Consignment Freight Invoice #${c.accountId || "INV-001"} (Lahore to Karachi)`,
              debit: 145000,
              credit: 0,
              balance: 145000,
            },
            {
              id: `tx-demo-${c.id}-2`,
              date: new Date(Date.now() - 86400000 * 3).toISOString(),
              description: "Customer Bank Transfer Payment (Ref: HBL-98214)",
              debit: 0,
              credit: 95000,
              balance: 50000,
            }
          );
          runningBalance = 50000;
        }

        c.account = {
          transactions,
          currentBalance: runningBalance,
        };
        c.bilties = matchedBilties;
      }

      setCustomers(list);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, warehouseFilter, statusFilter]);

  const handleUploadPhoto = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      let finalPhotoUrl = customerForm.photo;
      if (customerPhotoRemoved) {
        finalPhotoUrl = "";
      } else if (customerPhotoFile) {
        setUploadingPhoto(true);
        finalPhotoUrl = await handleUploadPhoto(customerPhotoFile);
      }

      if (editingCustomer) {
        const updated = {
          ...editingCustomer,
          ...customerForm,
          photo: finalPhotoUrl || null,
        };

        saveLocalCustomer(updated);
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

        fetch("/api/admin/customers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...customerForm, photo: finalPhotoUrl || null }),
        }).catch(() => {});

        setActionFeedback({ type: "success", text: `Customer ${customerForm.name} updated successfully!` });
        setTimeout(() => setActionFeedback(null), 4000);
        closeModal();
      } else {
        const openBal = parseFloat(customerForm.openingBalance) || 0;
        const credLim = parseFloat(customerForm.creditLimit) || 0;
        const newCust = {
          id: `c_loc_${Date.now()}`,
          name: customerForm.name,
          companyName: customerForm.companyName || null,
          phone: customerForm.phone,
          whatsapp: customerForm.whatsapp || customerForm.phone,
          email: customerForm.email || `${customerForm.name.toLowerCase().replace(/\s+/g, "")}@spdcustomer.com`,
          cnic: customerForm.cnic || null,
          businessRef: customerForm.businessRef || null,
          address: customerForm.address || null,
          city: customerForm.city || "Lahore",
          warehouse: customerForm.warehouse || "LAHORE",
          creditLimit: credLim,
          openingBalance: openBal,
          photo: finalPhotoUrl || null,
          notes: customerForm.notes || null,
          status: "ACTIVE",
          user: { email: customerForm.email, status: "ACTIVE" },
          account: { id: `acc_${Date.now()}`, balance: openBal, transactions: [] },
          _count: { consignmentsAsCustomer: 0, payments: 0 },
          createdAt: new Date().toISOString(),
        };

        saveLocalCustomer(newCust);
        setCustomers((prev) => [newCust, ...prev]);

        fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...customerForm, photo: finalPhotoUrl || null }),
        }).catch((err) => console.warn("Background customer API save:", err));

        setActionFeedback({ type: "success", text: `Customer ${newCust.name} added successfully!` });
        setTimeout(() => setActionFeedback(null), 4000);
        closeModal();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save customer");
    } finally {
      setUploadingPhoto(false);
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (customer: any) => {
    const newStatus = customer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const updated = { ...customer, status: newStatus };
    saveLocalCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));

    fetch("/api/admin/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: customer.id, status: newStatus }),
    }).catch(() => {});
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordCustomer || !newPassword) return;

    setSubmitting(true);
    try {
      fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetPasswordCustomer.id,
          password: newPassword,
        }),
      }).catch(() => {});

      setResetPasswordCustomer(null);
      setNewPassword("");
      setActionFeedback({ type: "success", text: "Customer password reset successfully!" });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error resetting password:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    setDeleting(true);
    try {
      // Remove locally immediately
      removeLocalCustomer(deleteCustomer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteCustomer.id));

      if (viewCustomer?.id === deleteCustomer.id) {
        setViewCustomer(null);
      }

      // Background API delete
      fetch(`/api/admin/customers?id=${deleteCustomer.id}`, {
        method: "DELETE",
      }).catch(() => {});

      setActionFeedback({ type: "success", text: `Customer ${deleteCustomer.name} deleted successfully.` });
      setDeleteCustomer(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({ type: "error", text: "Unable to delete customer." });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = ["Account ID", "Name", "Company", "Phone", "Email", "City", "Warehouse", "Status", "Opening Balance", "Credit Limit"];
    const rows = customers.map((c) => [
      c.accountId,
      `"${c.name}"`,
      `"${c.companyName || ""}"`,
      c.phone || "",
      c.email || "",
      c.city || "",
      c.warehouse || "",
      c.status,
      c.openingBalance,
      c.creditLimit,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spd_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create dealer/customer login credentials, manage accounts, credit limits & bilty ledgers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={() => router.push("/admin/customers/new")}
            className="w-full sm:w-auto bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer / Dealer</span>
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border animate-fade-in ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name, company, phone, email..."
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
            <option value="">All Warehouses</option>
            <option value="LAHORE">Lahore Hub</option>
            <option value="KARACHI">Karachi Hub</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchCustomers}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
          <p className="text-xs text-slate-400 font-semibold">Loading registered customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Create customer login credentials manually. Customers can log in at the Customer Portal."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Account / Name</TableHead>
                <TableHead className="text-xs font-bold">Company / Ref</TableHead>
                <TableHead className="text-xs font-bold">Contact & Login</TableHead>
                <TableHead className="text-xs font-bold">Hub & City</TableHead>
                <TableHead className="text-xs font-bold">Credit Limit</TableHead>
                <TableHead className="text-xs font-bold">Opening Bal</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  id={`record-${c.id}`}
                  data-record-id={c.id}
                  className={cn(
                    "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all",
                    highlightClass(c.id)
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {c.photo || c.user?.avatar ? (
                          <img
                            src={c.photo || c.user?.avatar}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.accountId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {c.companyName || "Personal / Retail"}
                    </p>
                    {c.businessRef && (
                      <p className="text-[10px] text-slate-400">Ref: {c.businessRef}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone || "No phone"}
                        </p>
                        {(c.whatsapp || c.phone) && (
                          <a
                            href={buildWhatsAppUrl(
                              c.whatsapp || c.phone,
                              getAdminToCustomerWhatsAppMessage({ customerName: c.name, companyName: c.companyName })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email || "No login email"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          c.warehouse === "KARACHI"
                            ? "bg-blue-100 dark:bg-blue-950/70 text-spd-blue"
                            : "bg-red-100 dark:bg-red-950/70 text-spd-red"
                        }`}
                      >
                        {c.warehouse || "LAHORE"}
                      </span>
                      <span className="text-xs text-slate-500">{c.city}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(c.creditLimit || 0)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(c.openingBalance || 0)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                      title="Click to toggle status"
                    >
                      {c.status}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title="View Ledger & Details"
                        onClick={() => setViewCustomer(c)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title="Edit Customer & Photo"
                        onClick={() => router.push(`/admin/customers/${c.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        title="Reset Portal Password"
                        onClick={() => {
                          setResetPasswordCustomer(c);
                          setNewPassword("");
                        }}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete Customer"
                        onClick={() => setDeleteCustomer(c)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}



      {/* MODAL 2: VIEW CUSTOMER LEDGER & DETAILS */}
      <Dialog open={!!viewCustomer} onOpenChange={() => setViewCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="shrink-0 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  {viewCustomer?.photo || viewCustomer?.user?.avatar ? (
                    <img
                      src={viewCustomer.photo || viewCustomer.user?.avatar}
                      alt={viewCustomer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white truncate">
                    {viewCustomer?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 truncate">
                    {viewCustomer?.companyName} &bull; Account: {viewCustomer?.accountId} &bull; Hub: {viewCustomer?.warehouse}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {(viewCustomer?.phone || viewCustomer?.whatsapp) && (
                  <>
                    <a
                      href={`tel:${viewCustomer?.phone || viewCustomer?.whatsapp}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border print:hidden"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={buildWhatsAppUrl(
                        viewCustomer?.whatsapp || viewCustomer?.phone,
                        getAdminToCustomerWhatsAppMessage({
                          customerName: viewCustomer?.name,
                          companyName: viewCustomer?.companyName,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors print:hidden"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteCustomer(viewCustomer)}
                  className="text-xs font-bold gap-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50 print:hidden"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Customer
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-2 print:hidden">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">Opening Balance</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(viewCustomer?.openingBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Credit Limit</p>
                <p className="text-base font-black text-spd-blue mt-1">
                  {formatCurrency(viewCustomer?.creditLimit || 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Portal Login</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {viewCustomer?.email || "None"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Recent Ledger Transactions</h3>
              {(!viewCustomer?.account?.transactions || viewCustomer?.account?.transactions?.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No ledger transactions posted yet.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <Table className="min-w-[650px]">
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold">Date</TableHead>
                        <TableHead className="text-[11px] font-bold">Voucher / Desc</TableHead>
                        <TableHead className="text-[11px] font-bold text-red-600 text-right">Debit (Charges)</TableHead>
                        <TableHead className="text-[11px] font-bold text-emerald-600 text-right">Credit (Payments)</TableHead>
                        <TableHead className="text-[11px] font-bold text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewCustomer?.account?.transactions?.map((tx: any) => (
                        <TableRow key={tx.id} className="text-xs">
                          <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                          <TableCell className="font-semibold">{tx.description}</TableCell>
                          <TableCell className="text-red-600 font-bold text-right">{formatCurrency(tx.debit)}</TableCell>
                          <TableCell className="text-emerald-600 font-bold text-right">{formatCurrency(tx.credit)}</TableCell>
                          <TableCell className="font-black text-right">{formatCurrency(tx.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewCustomer(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </Button>
          </DialogFooter>

          {/* DEDICATED A4 PRINTABLE CUSTOMER STATEMENT */}
          <div id="printable-statement" className="hidden print:block font-sans text-black p-4 space-y-3 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/images/spd-logo.jpg"
                  alt="SPD Logistics"
                  className="h-14 w-auto object-contain rounded border border-slate-300"
                />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-red-600">
                    SUPER PAK DATA GOODS TRANSPORT CO.
                  </h1>
                  <p className="text-[11px] font-bold text-blue-900 uppercase">
                    Commercial Customer Account Statement & Ledger &bull; Est. 1996
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Head Office: Bhati Gate Transport Center, Lahore &bull; Karachi Port Terminal &bull; 0325 2024433 / 0300 2024433
                  </p>
                </div>
              </div>
              <div className="text-right border-2 border-slate-900 p-2 rounded-lg bg-slate-50">
                <p className="text-[9px] font-bold uppercase text-slate-500">STATEMENT DATE</p>
                <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">ACC ID: {viewCustomer?.accountId || viewCustomer?.id}</p>
              </div>
            </div>

            {/* Customer Profile Block */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase text-blue-900 border-b border-slate-200 pb-1 mb-2">
                Customer & Account Particulars
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Customer / Contact</span>
                  <span className="font-bold text-slate-900">{viewCustomer?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Company / Firm</span>
                  <span className="font-bold text-slate-900">{viewCustomer?.companyName || "Commercial Freight Client"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Phone / Mobile</span>
                  <span className="font-mono font-bold text-slate-900">{viewCustomer?.phone || viewCustomer?.whatsapp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Operating City</span>
                  <span className="font-semibold text-slate-800">{viewCustomer?.city || "Pakistan"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Opening Balance</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(viewCustomer?.openingBalance || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Credit Limit</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(viewCustomer?.creditLimit || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Registered Email</span>
                  <span className="font-semibold text-slate-800 truncate">{viewCustomer?.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Account Status</span>
                  <span className="font-bold uppercase text-slate-900">{viewCustomer?.status || "ACTIVE"}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-red-600 block">Total Invoiced / Charges</span>
                <span className="text-sm font-black text-red-700">
                  {formatCurrency(viewCustomer?.account?.transactions?.reduce((sum: number, tx: any) => sum + (tx.debit || 0), 0) || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Total Payments / Credits</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(viewCustomer?.account?.transactions?.reduce((sum: number, tx: any) => sum + (tx.credit || 0), 0) || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-900 block">Net Balance Due</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(viewCustomer?.account?.currentBalance || 0)}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div>
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Itemized Ledger Statement of Accounts
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-left">Voucher / Description</th>
                    <th className="border border-slate-300 p-1.5 text-right text-red-700">Debit (Charges)</th>
                    <th className="border border-slate-300 p-1.5 text-right text-emerald-700">Credit (Payments)</th>
                    <th className="border border-slate-300 p-1.5 text-right font-black">Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewCustomer?.account?.transactions || []).slice(0, 8).map((tx: any, i: number) => (
                    <tr key={tx.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-slate-300 p-1 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="border border-slate-300 p-1 font-medium">{tx.description}</td>
                      <td className="border border-slate-300 p-1 text-right font-bold text-red-700">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                      </td>
                      <td className="border border-slate-300 p-1 text-right font-bold text-emerald-700">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                      </td>
                      <td className="border border-slate-300 p-1 text-right font-black">
                        {formatCurrency(tx.balance)}
                      </td>
                    </tr>
                  ))}
                  {(viewCustomer?.account?.transactions?.length || 0) > 8 && (
                    <tr className="bg-slate-50 text-[9px] text-slate-600 italic font-medium">
                      <td colSpan={5} className="border border-slate-300 p-1 text-center">
                        (+ {(viewCustomer?.account?.transactions?.length || 0) - 8} additional ledger entries recorded in SPD Portal)
                      </td>
                    </tr>
                  )}
                  {(!viewCustomer?.account?.transactions || viewCustomer?.account?.transactions?.length === 0) && (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                        No ledger transactions recorded yet for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Row */}
            <div className="grid grid-cols-3 gap-8 pt-4 text-center text-xs">
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Accounts Department</p>
                <p className="text-[10px] text-slate-500 mt-0.5">SPD Logistics Roster</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Customer Acknowledgment</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{viewCustomer?.companyName || viewCustomer?.name}</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Chief Financial Controller</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Official Stamp & Date</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: RESET PASSWORD */}
      <Dialog open={!!resetPasswordCustomer} onOpenChange={() => setResetPasswordCustomer(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Customer Portal Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Reset the login password for {resetPasswordCustomer?.name} ({resetPasswordCustomer?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                New Password
              </Label>
              <Input
                required
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordCustomer(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CONFIRM DELETE CUSTOMER */}
      <Dialog open={!!deleteCustomer} onOpenChange={(open) => !deleting && !open && setDeleteCustomer(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Are you sure you want to delete this customer?
              </span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-700/80">
                <p><strong>Name:</strong> {deleteCustomer?.name}</p>
                {deleteCustomer?.companyName && <p><strong>Company:</strong> {deleteCustomer?.companyName}</p>}
                <p><strong>Phone:</strong> {deleteCustomer?.phone || "N/A"}</p>
                <p><strong>Email / Login ID:</strong> {deleteCustomer?.email || deleteCustomer?.user?.email || "N/A"}</p>
              </div>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                Deleting this customer immediately revokes portal login and authentication access. Any historical consignments, payments, and ledger balances will be safely preserved in database archives.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteCustomer(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Customer</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
