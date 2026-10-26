"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Wallet,
  Plus,
  Search,
  Printer,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Archive,
  AlertTriangle,
  FileSpreadsheet,
  Truck,
  UserCheck,
  Package,
  FileText,
  Filter,
  Clock,
  ArrowRight,
  X,
  CreditCard,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import { exportToExcel } from "@/lib/export-excel";
import { HybridCombobox } from "@/components/ui/hybrid-combobox";
import { VoucherImageAttachment } from "@/components/shared/voucher-image-attachment";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";
import { supabase } from "@/lib/supabase";

interface CashBookItem {
  id: string;
  name: string;
  city: string;
  station?: string;
  description?: string;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  currentBalance: number;
  balance?: number;
  transactionCount: number;
  status: string;
}

interface TransactionItem {
  id: string;
  cashBookId: string;
  date: string;
  voucherNumber?: string;
  description: string;
  category?: string;
  party?: string;
  accountPerson?: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod: string;
  notes?: string;
  customerId?: string;
  customer?: { id: string; name: string; phone?: string; companyName?: string };
  vehicleId?: string;
  vehicleNumber?: string;
  vehicle?: { id: string; vehicleNumber: string; ownerName?: string };
  driverId?: string;
  driverName?: string;
  driver?: { id: string; name: string; phone?: string };
  biltyId?: string;
  biltyNumber?: string;
  bilty?: { id: string; biltyNumber: string; origin?: string; destination?: string };
  challanId?: string;
  challanNumber?: string;
  challan?: { id: string; challanNumber: string; truckNumber?: string };
  route?: string;
  attachment?: string;
}

const CASH_IN_CATEGORIES = [
  "Freight Collection",
  "Customer Payment",
  "Bank Withdrawal",
  "Capital Inflow",
  "Advance Received",
  "Refund / Claim",
  "Other Income",
];

const CASH_OUT_CATEGORIES = [
  "Diesel / Fuel",
  "Driver Advance",
  "Challan Trip Expense",
  "Labour / Loading",
  "Vehicle Maintenance",
  "Toll & Tax",
  "Tyre & Spare Parts",
  "Police / Chungi",
  "Office Expense",
  "Bank Deposit",
  "Salary / Wages",
  "Other Expense",
];

export default function CashBooksPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-spd-blue" />
      </div>
    }>
      <CashBooksContent />
    </Suspense>
  );
}

function CashBooksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Highlight & navigation from Global Search
  const highlightParam = searchParams?.get("highlight");
  const bookIdParam = searchParams?.get("bookId");

  const [cashBooks, setCashBooks] = useState<CashBookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<CashBookItem | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // Reference data for transport linking
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [bilties, setBilties] = useState<any[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [dateFilterMode, setDateFilterMode] = useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [cashInModalOpen, setCashInModalOpen] = useState(false);
  const [cashOutModalOpen, setCashOutModalOpen] = useState(false);
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [deleteTx, setDeleteTx] = useState<TransactionItem | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const [archiveBookOpen, setArchiveBookOpen] = useState(false);
  const [archivingBook, setArchivingBook] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newBookData, setNewBookData] = useState({
    name: "",
    city: "Lahore",
    description: "",
    openingBalance: "",
  });

  const initialTxState = {
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "",
    party: "",
    description: "",
    paymentMethod: "CASH",
    voucherNumber: "",
    notes: "",
    customerId: "",
    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",
    biltyId: "",
    biltyNumber: "",
    challanId: "",
    challanNumber: "",
    route: "",
    attachment: "",
  };

  const [txFormData, setTxFormData] = useState(initialTxState);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Dedicated Party Statement & Export state
  interface PartyStatementData {
    partyName: string;
    transactions: any[];
    totalIn: number;
    totalOut: number;
    balance: number;
    dateRange: string;
  }
  const [partyStatementModal, setPartyStatementModal] = useState<PartyStatementData | null>(null);
  const [printTarget, setPrintTarget] = useState<"BOOK" | "PARTY">("BOOK");

  // Smart highlight hook
  const { highlightClass } = useSmartHighlight(transactions);

  // 1. Initial Load of Cash Books and Dropdown data
  useEffect(() => {
    fetchCashBooks();
    fetchDropdownData();
  }, []);

  // 2. Respond to bookIdParam when books are loaded
  useEffect(() => {
    if (bookIdParam && cashBooks.length > 0) {
      const match = cashBooks.find((b) => b.id === bookIdParam);
      if (match && selectedBook?.id !== match.id) {
        setSelectedBook(match);
      }
    }
  }, [bookIdParam, cashBooks]);

  // 3. Fetch transactions whenever selectedBook or filters change
  useEffect(() => {
    if (selectedBook) {
      fetchTransactions(selectedBook.id);
    }
  }, [selectedBook?.id, categoryFilter, typeFilter, startDate, endDate]);

  const fetchCashBooks = async () => {
    try {
      setLoading(true);
      let localBooks: CashBookItem[] = [];
      try {
        const stored = localStorage.getItem("spd_cash_books");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) localBooks = parsed;
        }
      } catch {}

      const res = await fetch("/api/admin/cash-books");
      const data = await res.json();
      let activeBooks: CashBookItem[] = [];

      if (data.success && Array.isArray(data.data)) {
        activeBooks = data.data.filter((b: any) => b.status !== "DELETED");
      }

      // Merge local with active
      const map = new Map<string, CashBookItem>();
      localBooks.forEach((b) => map.set(b.id, b));
      activeBooks.forEach((b) => map.set(b.id, b));
      const combined = Array.from(map.values());

      if (combined.length > 0) {
        setCashBooks(combined);
        try {
          localStorage.setItem("spd_cash_books", JSON.stringify(combined));
        } catch {}

        // Retain current selection, or honor bookIdParam, or pick first
        setSelectedBook((prev) => {
          if (bookIdParam) {
            const paramMatch = combined.find((b: any) => b.id === bookIdParam);
            if (paramMatch) return paramMatch;
          }
          if (prev) {
            const currentMatch = combined.find((b: any) => b.id === prev.id);
            if (currentMatch) return currentMatch;
          }
          return combined[0] || null;
        });
      }
    } catch (err) {
      console.error("Error fetching cash books:", err);
      try {
        const stored = localStorage.getItem("spd_cash_books");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCashBooks(parsed);
            setSelectedBook((prev) => prev || parsed[0]);
          }
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (bookId: string) => {
    try {
      setTxLoading(true);
      const params = new URLSearchParams({ cashBookId: bookId });
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // 1. Check Supabase cloud database
      let supabaseTxs: any[] = [];
      try {
        const { data: sbData, error: sbErr } = await supabase
          .from("cash_books")
          .select("*")
          .order("created_at", { ascending: false });
        if (!sbErr && Array.isArray(sbData) && sbData.length > 0) {
          supabaseTxs = sbData.map((t: any) => ({
            id: t.id,
            date: t.date || t.created_at,
            voucherNumber: t.id.slice(0, 8),
            description: t.description || "",
            type: t.type === "IN" ? "IN" : "OUT",
            amount: Number(t.amount) || 0,
            credit: t.type === "IN" ? Number(t.amount) || 0 : 0,
            debit: t.type === "OUT" ? Number(t.amount) || 0 : 0,
            category: t.description || (t.type === "IN" ? "Cash In" : "Cash Out"),
            paymentMethod: "CASH",
            createdAt: t.created_at,
          }));
        }
      } catch (e) {
        console.warn("Supabase transactions fetch warning:", e);
      }

      const res = await fetch(`/api/admin/cash-books?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        const apiTxs = data.data.transactions || [];
        const mergedMap = new Map<string, any>();
        supabaseTxs.forEach((t) => mergedMap.set(t.id, t));
        apiTxs.forEach((t: any) => mergedMap.set(t.id, t));
        const finalTxs = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );

        setTransactions(finalTxs);
        // Update selectedBook balances directly
        setSelectedBook((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            totalCredits: data.data.totalCredits ?? prev.totalCredits,
            totalDebits: data.data.totalDebits ?? prev.totalDebits,
            currentBalance: data.data.currentBalance ?? prev.currentBalance,
            transactionCount: finalTxs.length,
          };
        });
      } else if (supabaseTxs.length > 0) {
        setTransactions(supabaseTxs);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [vRes, dRes, cRes, chRes, bRes] = await Promise.allSettled([
        fetch("/api/admin/vehicles").then((r) => r.json()),
        fetch("/api/admin/drivers").then((r) => r.json()),
        fetch("/api/admin/customers").then((r) => r.json()),
        fetch("/api/admin/challan").then((r) => r.json()),
        fetch("/api/admin/bilty").then((r) => r.json()),
      ]);

      if (vRes.status === "fulfilled" && vRes.value?.vehicles) setVehicles(vRes.value.vehicles);
      if (dRes.status === "fulfilled" && dRes.value?.drivers) setDrivers(dRes.value.drivers);
      if (cRes.status === "fulfilled" && cRes.value?.customers) setCustomers(cRes.value.customers);
      if (chRes.status === "fulfilled" && chRes.value?.challans) setChallans(chRes.value.challans);
      if (bRes.status === "fulfilled" && bRes.value?.consignments) setBilties(bRes.value.consignments);
    } catch (err) {
      console.warn("Dropdown data load warning:", err);
    }
  };

  // Quick Date Filter presets
  const handleDatePreset = (preset: "ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH") => {
    setDateFilterMode(preset);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      const t = fmt(today);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === "YESTERDAY") {
      const y = new Date();
      y.setDate(today.getDate() - 1);
      const yStr = fmt(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "THIS_WEEK") {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay());
      setStartDate(fmt(first));
      setEndDate(fmt(today));
    } else if (preset === "THIS_MONTH") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(first));
      setEndDate(fmt(today));
    }
  };

  // Filter transactions locally by search query
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase().trim();
    return transactions.filter((t) => {
      return (
        t.description?.toLowerCase().includes(q) ||
        t.party?.toLowerCase().includes(q) ||
        t.accountPerson?.toLowerCase().includes(q) ||
        t.voucherNumber?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.vehicleNumber?.toLowerCase().includes(q) ||
        t.driverName?.toLowerCase().includes(q) ||
        t.biltyNumber?.toLowerCase().includes(q) ||
        t.challanNumber?.toLowerCase().includes(q) ||
        t.route?.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  // Open Cash IN Modal
  const openCashIn = () => {
    setTxFormData({
      ...initialTxState,
      category: "Freight Collection",
      paymentMethod: "CASH",
    });
    setCashInModalOpen(true);
  };

  // Open Cash OUT Modal
  const openCashOut = () => {
    setTxFormData({
      ...initialTxState,
      category: "Diesel / Fuel",
      paymentMethod: "CASH",
    });
    setCashOutModalOpen(true);
  };

  // Submit Cash IN
  const handleSaveCashIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    const amountVal = parseFloat(txFormData.amount);
    if (!amountVal || amountVal <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount greater than 0" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cashBookId: selectedBook.id,
        type: "IN",
        amount: amountVal,
        date: txFormData.date,
        voucherNumber: txFormData.voucherNumber || undefined,
        category: txFormData.category || "Freight Collection",
        party: txFormData.party || undefined,
        accountPerson: txFormData.party || undefined,
        description: txFormData.description || `${txFormData.category || "Cash Inflow"} - ${txFormData.party || "Counter"}`,
        paymentMethod: txFormData.paymentMethod || "CASH",
        notes: txFormData.notes || undefined,
        customerId: txFormData.customerId || undefined,
        biltyId: txFormData.biltyId || undefined,
        biltyNumber: txFormData.biltyNumber || undefined,
        attachment: txFormData.attachment || undefined,
      };

      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Supabase cloud insertion
      try {
        await supabase.from("cash_books").upsert([
          {
            id: `cb-in-${Date.now()}`,
            date: txFormData.date,
            description: payload.description || payload.category,
            type: "IN",
            amount: amountVal,
          },
        ]);
      } catch (sbErr) {
        console.warn("Supabase record Cash IN warning:", sbErr);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record Cash IN");
      }

      setCashInModalOpen(false);
      setFeedback({ type: "success", message: `Cash IN Rs ${amountVal.toLocaleString()} recorded successfully!` });
      await fetchCashBooks();
      await fetchTransactions(selectedBook.id);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to record Cash IN" });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Cash OUT
  const handleSaveCashOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    const amountVal = parseFloat(txFormData.amount);
    if (!amountVal || amountVal <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount greater than 0" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cashBookId: selectedBook.id,
        type: "OUT",
        amount: amountVal,
        date: txFormData.date,
        voucherNumber: txFormData.voucherNumber || undefined,
        category: txFormData.category || "Diesel / Fuel",
        party: txFormData.party || undefined,
        accountPerson: txFormData.party || undefined,
        description:
          txFormData.description ||
          `${txFormData.category} ${txFormData.vehicleNumber ? "• " + txFormData.vehicleNumber : ""} ${txFormData.party ? "• " + txFormData.party : ""}`,
        paymentMethod: txFormData.paymentMethod || "CASH",
        notes: txFormData.notes || undefined,
        vehicleId: txFormData.vehicleId || undefined,
        vehicleNumber: txFormData.vehicleNumber || undefined,
        driverId: txFormData.driverId || undefined,
        driverName: txFormData.driverName || undefined,
        challanId: txFormData.challanId || undefined,
        challanNumber: txFormData.challanNumber || undefined,
        biltyId: txFormData.biltyId || undefined,
        biltyNumber: txFormData.biltyNumber || undefined,
        route: txFormData.route || undefined,
        attachment: txFormData.attachment || undefined,
      };

      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Supabase cloud insertion
      try {
        await supabase.from("cash_books").upsert([
          {
            id: `cb-out-${Date.now()}`,
            date: txFormData.date,
            description: payload.description || payload.category,
            type: "OUT",
            amount: amountVal,
          },
        ]);
      } catch (sbErr) {
        console.warn("Supabase record Cash OUT warning:", sbErr);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record Cash OUT");
      }

      setCashOutModalOpen(false);
      setFeedback({ type: "success", message: `Cash OUT Rs ${amountVal.toLocaleString()} recorded successfully!` });
      await fetchCashBooks();
      await fetchTransactions(selectedBook.id);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to record Cash OUT" });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async () => {
    if (!deleteTx || !selectedBook) return;
    try {
      setDeletingTx(true);
      const targetTxId = deleteTx.id;

      // 1. Instantly remove from local transaction list and recalculate balances
      const remainingTxs = transactions.filter((t) => t.id !== targetTxId);
      const openBal = selectedBook.openingBalance || 0;
      const newCredits = remainingTxs.reduce((sum, t) => sum + (t.credit || 0), 0);
      const newDebits = remainingTxs.reduce((sum, t) => sum + (t.debit || 0), 0);
      const newNetBalance = openBal + newCredits - newDebits;

      // Recompute running balance sequentially for remaining entries
      let running = openBal;
      const recomputedTxs = remainingTxs.map((t) => {
        running = running + (t.credit || 0) - (t.debit || 0);
        return { ...t, balance: running, runningBalance: running };
      });

      setTransactions(recomputedTxs);

      const updatedBook: CashBookItem = {
        ...selectedBook,
        totalCredits: newCredits,
        totalDebits: newDebits,
        currentBalance: newNetBalance,
        transactionCount: recomputedTxs.length,
      };

      setSelectedBook(updatedBook);

      // 2. Persist to localStorage
      setCashBooks((prev) => {
        const next = prev.map((b) => (b.id === selectedBook.id ? updatedBook : b));
        try {
          localStorage.setItem("spd_cash_books", JSON.stringify(next));
        } catch {}
        return next;
      });

      // 3. Supabase cloud deletion
      try {
        await supabase.from("cash_books").delete().eq("id", targetTxId);
      } catch (sbErr) {
        console.warn("Supabase delete transaction warning:", sbErr);
      }

      // 4. Delete from backend API
      const res = await fetch(`/api/admin/cash-books?txId=${targetTxId}&cashBookId=${selectedBook.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete entry");
      }

      setDeleteTx(null);
      toast.success("Transaction deleted successfully.");
      setFeedback({ type: "success", message: "Transaction deleted successfully." });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete entry");
      setFeedback({ type: "error", message: err.message || "Delete error" });
    } finally {
      setDeletingTx(false);
    }
  };

  // Create New Cash Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const bName = newBookData.name.trim();
    const bCity = newBookData.city.trim();
    if (!bName || !bCity) {
      setFeedback({ type: "error", message: "Cash Book Name and City are required." });
      return;
    }

    const openBal = parseFloat(newBookData.openingBalance) || 0;
    const tempId = `cb-${Date.now()}`;
    const newBookObj: CashBookItem = {
      id: tempId,
      name: bName,
      city: bCity,
      description: newBookData.description.trim() || `Operating cash book for ${bCity}`,
      openingBalance: openBal,
      totalCredits: 0,
      totalDebits: 0,
      currentBalance: openBal,
      transactionCount: 0,
      status: "ACTIVE",
    };

    // 1. Immediately save into state and storage, add as active tab
    setCashBooks((prev) => {
      const updated = [...prev.filter((b) => b.id !== tempId), newBookObj];
      try {
        localStorage.setItem("spd_cash_books", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedBook(newBookObj);
    setTransactions([]);

    // 2. Clean form reset, close modal, and show clean green notification
    setCreateBookOpen(false);
    setNewBookData({
      name: "",
      city: "Lahore",
      description: "",
      openingBalance: "",
    });
    setFeedback({ type: "success", message: "Cash book created successfully" });

    // 3. Sync to API in background without throwing UI error
    try {
      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_BOOK",
          name: bName,
          city: bCity,
          description: newBookData.description.trim(),
          openingBalance: openBal,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const serverBook = data.data;
        setCashBooks((prev) => {
          const updated = prev.map((b) => (b.id === tempId ? { ...b, ...serverBook } : b));
          try {
            localStorage.setItem("spd_cash_books", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setSelectedBook((prev) => (prev?.id === tempId ? { ...prev, ...serverBook } : prev));
      }
    } catch (err: any) {
      console.warn("Background cash book sync warning:", err);
    }
  };

  // Archive / Soft Delete Cash Book
  const handleArchiveBook = async () => {
    if (!selectedBook) return;
    try {
      setArchivingBook(true);
      const res = await fetch(`/api/admin/cash-books?cashBookId=${selectedBook.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to archive book");
      }

      setArchiveBookOpen(false);
      setFeedback({ type: "success", message: `"${selectedBook.name}" archived.` });
      await fetchCashBooks();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Archive error" });
    } finally {
      setArchivingBook(false);
    }
  };

  // Helper to extract clean party name
  const getTxPartyName = (t: TransactionItem): string => {
    return (t.party || t.accountPerson || t.customer?.name || t.driverName || "").trim();
  };

  // Build statement for a party
  const getPartyStatement = (partyName: string): PartyStatementData | null => {
    const pName = partyName.trim();
    if (!pName) return null;
    const normalized = pName.toLowerCase();

    const partyTxs = (transactions || [])
      .filter((t) => getTxPartyName(t).toLowerCase() === normalized)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (partyTxs.length === 0) return null;

    let running = 0;
    const enrichedTxs = partyTxs.map((t) => {
      const cr = Number(t.credit) || 0;
      const dr = Number(t.debit) || 0;
      running += (cr - dr);
      return {
        ...t,
        partyRunningBalance: running,
      };
    });

    const totalIn = enrichedTxs.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    const totalOut = enrichedTxs.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const balance = totalIn - totalOut;

    const dates = enrichedTxs.map((t) => t.date).filter(Boolean).sort();
    const dateRange = dates.length > 0
      ? `${new Date(dates[0]).toLocaleDateString("en-GB")} — ${new Date(dates[dates.length - 1]).toLocaleDateString("en-GB")}`
      : "All Recorded Entries";

    return {
      partyName: pName,
      transactions: enrichedTxs,
      totalIn,
      totalOut,
      balance,
      dateRange,
    };
  };

  // Open statement modal
  const handleOpenPartyStatement = (partyName: string) => {
    const statement = getPartyStatement(partyName);
    if (!statement) {
      setFeedback({ type: "error", message: `No ledger records found for party: ${partyName}` });
      return;
    }
    setPartyStatementModal(statement);
  };

  // Print party statement (A4)
  const handlePrintPartyStatement = (partyName: string) => {
    const statement = getPartyStatement(partyName);
    if (!statement) {
      setFeedback({ type: "error", message: `No ledger records found for party: ${partyName}` });
      return;
    }
    setPartyStatementModal(statement);
    setPrintTarget("PARTY");
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Export single party ledger to Excel (.xlsx)
  const handleExportPartyExcel = (partyName: string) => {
    const statement = getPartyStatement(partyName);
    if (!statement || !statement.transactions.length) {
      setFeedback({ type: "error", message: `No ledger records found for party: ${partyName}` });
      return;
    }

    let running = 0;
    const exportRows = statement.transactions.map((t: any) => {
      const cr = Number(t.credit) || 0;
      const dr = Number(t.debit) || 0;
      running += (cr - dr);
      return {
        "Date": t.date ? new Date(t.date).toLocaleDateString("en-GB") : "",
        "Voucher #": t.voucherNumber || t.id?.slice(0, 8) || "",
        "Party / Account": statement.partyName,
        "Description": t.description || "",
        "Category": t.category || "",
        "Payment Mode": t.paymentMethod || "CASH",
        "Cash IN / Credit (آمد)": cr,
        "Cash OUT / Debit (خرچہ)": dr,
        "Running Balance (بقایا)": running,
        "Vehicle #": t.vehicleNumber || "",
        "Driver": t.driverName || "",
        "Bilty #": t.biltyNumber || "",
        "Challan #": t.challanNumber || "",
        "Route": t.route || "",
        "Remarks": t.notes || "",
      };
    });

    exportToExcel(
      exportRows,
      `Party_Ledger_${statement.partyName.replace(/[^a-zA-Z0-9_-]/g, "_")}`
    );
    setFeedback({ type: "success", message: `Exported ledger for "${statement.partyName}" to Excel (.xlsx)` });
  };

  // Universal Export to Excel / CSV
  const handleExportExcel = () => {
    if (!filteredTransactions.length || !selectedBook) return;
    const data = filteredTransactions.map((t) => ({
      "Date": t.date ? new Date(t.date).toLocaleDateString("en-GB") : "",
      "Voucher #": t.voucherNumber || "",
      "Description": t.description || "",
      "Category": t.category || "",
      "Party / Vendor": t.party || t.accountPerson || "",
      "Payment Mode": t.paymentMethod || "CASH",
      "Cash IN (آمد)": t.credit || 0,
      "Cash OUT (خرچہ)": t.debit || 0,
      "Running Balance": t.balance || 0,
      "Vehicle #": t.vehicleNumber || "",
      "Driver": t.driverName || "",
      "Challan #": t.challanNumber || "",
      "Bilty #": t.biltyNumber || "",
      "Route": t.route || "",
      "Proof Slip": t.attachment ? "Attached" : "No",
      "Remarks / Notes": t.notes || "",
    }));

    exportToExcel(
      data,
      `CashBook_${selectedBook.name.replace(/\s+/g, "_")}`
    );
  };

  // Print Day Book
  const handlePrint = () => {
    setPrintTarget("BOOK");
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2",
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP HEADER: CASH BOOK SWITCHER & ACTIONS */}
      {/* ======================================================== */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-spd-blue/10 dark:bg-spd-blue/20 text-spd-blue">
                <Wallet className="h-6 w-6" />
              </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Cash Book & Day Ledger
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time transport cash flow, station ledgers, and operational expenses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCashBooks}
            className="rounded-xl text-xs h-9 font-bold"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Sync
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!filteredTransactions.length}
            className="rounded-xl text-xs h-9 font-bold bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!selectedBook}
            className="rounded-xl text-xs h-9 font-bold"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Day Book
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateBookOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl text-xs h-9 font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Book
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CASH BOOK TABS SELECTOR */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {cashBooks.map((b) => {
          const isActive = selectedBook?.id === b.id;
          return (
            <button
              key={b.id}
              id={`record-${b.id}`}
              data-record-id={b.id}
              onClick={() => setSelectedBook(b)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                isActive
                  ? "bg-spd-blue text-white border-spd-blue shadow-md shadow-spd-blue/20"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                highlightClass(b.id)
              )}
            >
              <Building2 className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-spd-blue")} />
              <span>{b.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-mono",
                  isActive
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent"
                )}
              >
                {b.city}
              </Badge>
              <span
                className={cn(
                  "text-[11px] font-mono font-black ml-1",
                  isActive
                    ? "text-white"
                    : b.currentBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                Rs {b.currentBalance.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TWO PRIMARY ACTION BUTTONS (CASH IN & CASH OUT) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GREEN + CASH IN (AAMAD) */}
        <button
          onClick={openCashIn}
          disabled={!selectedBook}
          className="group relative flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 transform active:scale-[0.99] text-left overflow-hidden border border-emerald-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">+ Cash IN</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  آمد / Wasool
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Freight collections, customer payments, cash receipts
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* RED - CASH OUT (KHARCHA) */}
        <button
          onClick={openCashOut}
          disabled={!selectedBook}
          className="group relative flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/20 hover:shadow-xl hover:shadow-rose-600/30 transition-all duration-200 transform active:scale-[0.99] text-left overflow-hidden border border-rose-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">- Cash OUT</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  خرچہ / Adaigi
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Diesel, driver advance, challan expense, labour, repairs
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4 TOP SUMMARY STAT CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Opening Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Opening Balance
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
            Rs {(selectedBook?.openingBalance || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Initial base ledger</p>
        </div>

        {/* Total Cash IN */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Total Cash IN
            </p>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            +Rs {(selectedBook?.totalCredits || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
            Total Inflow / Wasool
          </p>
        </div>

        {/* Total Cash OUT */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Total Cash OUT
            </p>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            -Rs {(selectedBook?.totalDebits || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
            Total Expenses / Kharcha
          </p>
        </div>

        {/* Net Cash Balance */}
        <div
          className={cn(
            "border rounded-2xl p-4 shadow-xs",
            (selectedBook?.currentBalance || 0) >= 0
              ? "bg-slate-900 text-white border-slate-800 dark:bg-slate-800"
              : "bg-rose-900 text-white border-rose-800"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Net Cash in Hand
            </p>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-amber-300 mt-1 font-mono">
            Rs {(selectedBook?.currentBalance || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            {selectedBook?.transactionCount || 0} Total entries recorded
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QUICK DATE RANGE FILTER PILLS & SEARCH BAR */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
        {/* Fast Date Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Date:
            </span>
            {(
              [
                ["ALL", "All Time"],
                ["TODAY", "Today"],
                ["YESTERDAY", "Yesterday"],
                ["THIS_WEEK", "This Week"],
                ["THIS_MONTH", "This Month"],
              ] as const
            ).map(([key, label]) => {
              const active = dateFilterMode === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDatePreset(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilterMode("CUSTOM");
              }}
              className="h-8 text-xs w-34 rounded-lg bg-slate-50 dark:bg-slate-800"
            />
            <span className="text-muted-foreground font-bold">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilterMode("CUSTOM");
              }}
              className="h-8 text-xs w-34 rounded-lg bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Filter bar: Search, Type, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by party, diesel, vehicle #, challan, bilty, voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Entries (IN & OUT)</option>
              <option value="IN">Cash IN Only (آمد)</option>
              <option value="OUT">Cash OUT Only (خرچہ)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Categories</option>
              <optgroup label="Cash IN">
                {CASH_IN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cash OUT">
                {CASH_OUT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TRANSACTIONS DAY BOOK TABLE WITH RUNNING BALANCES */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-spd-blue" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Ledger Transactions ({filteredTransactions.length})
            </h2>
            {selectedBook && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedBook.name}
              </Badge>
            )}
          </div>

          {selectedBook && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArchiveBookOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 font-bold"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              Archive Book
            </Button>
          )}
        </div>

        {txLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-spd-blue" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Wallet}
              title="No records found"
              description="Click '+ Add New' to create your first entry."
            />
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                  <TableHead className="text-xs font-bold w-24">Date</TableHead>
                  <TableHead className="text-xs font-bold w-28">Voucher / ID</TableHead>
                  <TableHead className="text-xs font-bold">Details & Transport Linking</TableHead>
                  <TableHead className="text-xs font-bold">Party / Vendor</TableHead>
                  <TableHead className="text-xs font-bold w-24">Mode</TableHead>
                  <TableHead className="text-xs font-bold text-right text-emerald-600 dark:text-emerald-400 w-32">
                    Cash IN (آمد)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right text-rose-600 dark:text-rose-400 w-32">
                    Cash OUT (خرچہ)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right font-mono w-32">
                    Running Bal
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const isIn = tx.credit > 0;
                  const isOut = tx.debit > 0;
                  const partyName = (tx.party || tx.accountPerson || "").trim();
                  return (
                    <TableRow
                      key={tx.id}
                      id={`tx-row-${tx.id}`}
                      data-record-id={tx.id}
                      className={cn(
                        "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs transition-all",
                        highlightClass(tx.id) || highlightClass(tx.voucherNumber)
                      )}
                    >
                      {/* Date */}
                      <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {tx.date ? new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </TableCell>

                      {/* Voucher # */}
                      <TableCell>
                        <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {tx.voucherNumber || tx.id.slice(0, 8)}
                        </span>
                      </TableCell>

                      {/* Details & Transport Linking Badges */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                              {tx.description}
                            </p>
                            {tx.attachment && (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(tx.attachment!)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 transition-colors shrink-0"
                                title="Click to view attached voucher receipt proof"
                              >
                                <Paperclip className="w-3 h-3 text-amber-600" />
                                <span>Receipt Proof</span>
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {tx.category && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 font-medium",
                                  isIn
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                )}
                              >
                                {tx.category}
                              </Badge>
                            )}

                            {/* Transport badges */}
                            {tx.vehicleNumber && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1"
                              >
                                <Truck className="w-2.5 h-2.5" />
                                {tx.vehicleNumber}
                              </Badge>
                            )}

                            {tx.driverName && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1"
                              >
                                <UserCheck className="w-2.5 h-2.5" />
                                {tx.driverName}
                              </Badge>
                            )}

                            {tx.challanNumber && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1"
                              >
                                <FileText className="w-2.5 h-2.5" />
                                Challan: {tx.challanNumber}
                              </Badge>
                            )}

                            {tx.biltyNumber && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1"
                              >
                                <Package className="w-2.5 h-2.5" />
                                Bilty: {tx.biltyNumber}
                              </Badge>
                            )}

                            {tx.route && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                ({tx.route})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Party */}
                      <TableCell>
                        {partyName ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPartyStatement(partyName)}
                            className="font-bold text-slate-800 dark:text-slate-200 text-xs text-left hover:text-spd-blue hover:underline cursor-pointer flex items-center gap-1 group transition-colors"
                            title="Click to view party ledger & statement"
                          >
                            <span>{partyName}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-spd-blue group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="font-bold text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>

                      {/* Mode */}
                      <TableCell>
                        <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">
                          {tx.paymentMethod || "CASH"}
                        </span>
                      </TableCell>

                      {/* Cash IN (Green) */}
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {tx.credit > 0 ? `+Rs ${tx.credit.toLocaleString()}` : "-"}
                      </TableCell>

                      {/* Cash OUT (Red) */}
                      <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {tx.debit > 0 ? `-Rs ${tx.debit.toLocaleString()}` : "-"}
                      </TableCell>

                      {/* Running Balance */}
                      <TableCell
                        className={cn(
                          "text-right font-mono font-black",
                          (tx.balance || 0) >= 0
                            ? "text-slate-900 dark:text-white"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        Rs {(tx.balance || 0).toLocaleString()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Party Print / PDF Statement */}
                          {partyName ? (
                            <button
                              type="button"
                              onClick={() => handlePrintPartyStatement(partyName)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-spd-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title={`Print / PDF Statement for ${partyName}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          ) : null}

                          {/* Party Export Excel */}
                          {partyName ? (
                            <button
                              type="button"
                              onClick={() => handleExportPartyExcel(partyName)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title={`Export Ledger for ${partyName} (.xlsx)`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          ) : null}

                          {/* Delete Transaction */}
                          <button
                            type="button"
                            onClick={() => setDeleteTx(tx)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      </div>

      {/* ======================================================== */}
      {/* DEDICATED A4 PRINTABLE CASH BOOK DAY LEDGER */}
      <div
        id="cash-book-printable"
        data-print-target="true"
        className={cn(
          printTarget === "BOOK" ? "print:block" : "print:hidden",
          "printable-document hidden font-sans text-black p-4 space-y-3 bg-white"
        )}
      >
        <PrintHeader
          title={`Cash Book & Day Ledger: ${selectedBook?.name || "General Cash Book"}`}
          subtitle="Real-Time Station Cash Receipts, Operational Expenses & Ledger Balance"
          documentNumber={selectedBook?.id}
          station={selectedBook?.station || selectedBook?.city || "Head Office Station (Lahore)"}
        />

        {/* Financial Summary Box */}
        <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Cash Book Title</span>
              <span className="font-bold text-slate-900">{selectedBook?.name || "Cash Book"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Assigned Station</span>
              <span className="font-bold text-slate-900">{selectedBook?.station || selectedBook?.city || "Lahore Station"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Opening Balance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(selectedBook?.openingBalance || 0)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Net Current Balance</span>
              <span className="font-black text-slate-900">{formatCurrency(selectedBook?.balance ?? selectedBook?.currentBalance ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        {(() => {
          const printTotalIn = filteredTransactions.reduce((acc, t) => acc + (Number(t.credit) || 0), 0);
          const printTotalOut = filteredTransactions.reduce((acc, t) => acc + (Number(t.debit) || 0), 0);
          const printNetBalance = (Number(selectedBook?.openingBalance) || 0) + printTotalIn - printTotalOut;

          return (
            <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Total Cash IN (آمد)</span>
                <span className="text-sm font-black text-emerald-700">
                  +{formatCurrency(printTotalIn)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-rose-600 block">Total Cash OUT (خرچہ)</span>
                <span className="text-sm font-black text-rose-700">
                  -{formatCurrency(printTotalOut)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-700 block">Net Day Balance (بقایا)</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(printNetBalance)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Transactions Table - 100% fixed auto-fit */}
        <div className="w-full overflow-hidden">
          <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
            Day Book Itemized Transaction Register ({filteredTransactions.length} Entries)
          </p>
          <table
            className="w-full border-collapse border border-black text-[9px] table-fixed"
            style={{ width: "100%", tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-black text-center font-bold">
                <th className="border border-black p-1">Date</th>
                <th className="border border-black p-1">Voucher #</th>
                <th className="border border-black p-1 text-left">Description</th>
                <th className="border border-black p-1 text-left">Party / Vendor</th>
                <th className="border border-black p-1">Vehicle / Ref</th>
                <th className="border border-black p-1 text-right text-emerald-700">Cash IN</th>
                <th className="border border-black p-1 text-right text-rose-700">Cash OUT</th>
                <th className="border border-black p-1 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: any, idx: number) => (
                <tr key={tx.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="border border-black p-1 text-center whitespace-nowrap font-mono text-[8.5px] truncate">
                    {tx.date ? new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                  </td>
                  <td className="border border-black p-1 font-mono font-bold text-slate-800 truncate">
                    {tx.voucherNumber || tx.id?.slice(0, 8)}
                  </td>
                  <td className="border border-black p-1 truncate">
                    <div className="font-semibold text-slate-900 truncate">{tx.description || tx.category}</div>
                    <div className="text-[8px] text-slate-500 truncate">{tx.category} • {tx.paymentMethod || "CASH"}</div>
                  </td>
                  <td className="border border-black p-1 font-medium truncate">
                    {tx.party || tx.accountPerson || "—"}
                  </td>
                  <td className="border border-black p-1 font-mono text-[8.5px] truncate">
                    {tx.vehicleNumber || tx.driverName || tx.challanNumber ? (
                      <div className="truncate">
                        {tx.vehicleNumber && <span className="font-bold">{tx.vehicleNumber} </span>}
                        {tx.driverName && <span>({tx.driverName}) </span>}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-bold text-emerald-700 truncate">
                    {tx.credit > 0 ? formatCurrency(tx.credit) : "—"}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-bold text-rose-700 truncate">
                    {tx.debit > 0 ? formatCurrency(tx.debit) : "—"}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-black text-slate-900 truncate">
                    {formatCurrency(tx.balance || 0)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="border border-black p-3 text-center text-slate-400 italic">
                    No cash transactions recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              {(() => {
                const totalIn = filteredTransactions.reduce((acc, t) => acc + (Number(t.credit) || 0), 0);
                const totalOut = filteredTransactions.reduce((acc, t) => acc + (Number(t.debit) || 0), 0);
                const netBal = (Number(selectedBook?.openingBalance) || 0) + totalIn - totalOut;
                return (
                  <tr className="bg-slate-100 font-black border-t-2 border-black text-[9px]">
                    <td colSpan={5} className="p-1 text-right uppercase text-black">
                      Register Totals ({filteredTransactions.length}):
                    </td>
                    <td className="p-1 text-right font-mono text-emerald-700 truncate">
                      +{formatCurrency(totalIn)}
                    </td>
                    <td className="p-1 text-right font-mono text-rose-700 truncate">
                      -{formatCurrency(totalOut)}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-900 truncate">
                      {formatCurrency(netBal)}
                    </td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </div>

        <PrintFooter
          notes="Official Day Book & Transport Cash Ledger generated from Super Pak Data Goods Transport Co. Core Accounting System. All cash collections and operational expenses must match physical voucher receipts."
          preparedByLabel="Prepared By"
          checkedByLabel="Checked By"
          authorizedLabel="Authorized Signature"
        />
      </div>

      {/* ======================================================== */}
      {/* DEDICATED A4 PRINTABLE PARTY STATEMENT */}
      {/* ======================================================== */}
      <div 
        id="party-statement-printable" 
        data-print-target="true"
        className={cn(
          printTarget === "PARTY" && partyStatementModal ? "print:block" : "print:hidden",
          "printable-document hidden font-sans text-black p-4 space-y-3 bg-white"
        )}
      >
        {partyStatementModal && (
          <>
            <PrintHeader
              companyName="SUPER PAK DATA WALE GOODS TRANSPORT CO."
              title={`Party Ledger Statement: ${partyStatementModal.partyName}`}
              subtitle="Consolidated Party Ledger Statement • Debits, Credits & Running Balance"
              documentNumber={`STMT-${partyStatementModal.partyName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "")}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`}
              station={selectedBook?.station || selectedBook?.city || "All Operating Stations"}
            />

            {/* Financial Summary Box */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Party / Account Name</span>
                  <span className="font-bold text-slate-900 text-sm">{partyStatementModal.partyName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Operating Cash Book</span>
                  <span className="font-bold text-slate-900">{selectedBook?.name || "Cash Book"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Statement Period</span>
                  <span className="font-semibold text-slate-800">{partyStatementModal.dateRange}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Net Running Balance</span>
                  <span className={cn(
                    "font-black text-sm",
                    partyStatementModal.balance >= 0 ? "text-slate-900" : "text-rose-700"
                  )}>
                    {formatCurrency(partyStatementModal.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Total Received / Credit (+ آمد)</span>
                <span className="text-sm font-black text-emerald-700">
                  +{formatCurrency(partyStatementModal.totalIn)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-rose-600 block">Total Paid / Debit (- خرچہ)</span>
                <span className="text-sm font-black text-rose-700">
                  -{formatCurrency(partyStatementModal.totalOut)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-700 block">Closing Balance (بقایا جات)</span>
                <span className={cn("text-sm font-black", partyStatementModal.balance >= 0 ? "text-slate-900" : "text-rose-700")}>
                  {formatCurrency(partyStatementModal.balance)}
                </span>
              </div>
            </div>

            {/* Itemized Party Transactions - 100% fixed auto-fit */}
            <div className="w-full overflow-hidden">
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Itemized Chronological Transaction History ({partyStatementModal.transactions.length} Records)
              </p>
              <table
                className="w-full border-collapse border border-black text-[9px] table-fixed"
                style={{ width: "100%", tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "23%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100 text-black text-center font-bold">
                    <th className="border border-black p-1">Date</th>
                    <th className="border border-black p-1">Voucher #</th>
                    <th className="border border-black p-1 text-left">Description</th>
                    <th className="border border-black p-1">Transport / Ref</th>
                    <th className="border border-black p-1">Mode</th>
                    <th className="border border-black p-1 text-right text-emerald-700">Cash IN (آمد)</th>
                    <th className="border border-black p-1 text-right text-rose-700">Cash OUT (خرچہ)</th>
                    <th className="border border-black p-1 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {partyStatementModal.transactions.map((tx: any, idx: number) => (
                    <tr key={tx.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-black p-1 text-center whitespace-nowrap font-mono text-[8.5px] truncate">
                        {tx.date ? new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="border border-black p-1 font-mono font-bold text-slate-800 truncate">
                        {tx.voucherNumber || tx.id?.slice(0, 8)}
                      </td>
                      <td className="border border-black p-1 truncate">
                        <div className="font-semibold text-slate-900 truncate">{tx.description || tx.category}</div>
                        <div className="text-[8px] text-slate-500 truncate">{tx.category}</div>
                      </td>
                      <td className="border border-black p-1 font-mono text-[8.5px] truncate">
                        {tx.biltyNumber && <span className="block truncate">Bilty: <strong>{tx.biltyNumber}</strong></span>}
                        {tx.challanNumber && <span className="block truncate">Chl: <strong>{tx.challanNumber}</strong></span>}
                        {tx.vehicleNumber && <span className="block truncate">Veh: {tx.vehicleNumber}</span>}
                        {!tx.biltyNumber && !tx.challanNumber && !tx.vehicleNumber && "—"}
                      </td>
                      <td className="border border-black p-1 text-center font-mono uppercase text-[8.5px] truncate">
                        {tx.paymentMethod || "CASH"}
                      </td>
                      <td className="border border-black p-1 text-right font-mono font-bold text-emerald-700 truncate">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : "—"}
                      </td>
                      <td className="border border-black p-1 text-right font-mono font-bold text-rose-700 truncate">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : "—"}
                      </td>
                      <td className="border border-black p-1 text-right font-mono font-black text-slate-900 truncate">
                        {formatCurrency(tx.partyRunningBalance || 0)}
                      </td>
                    </tr>
                  ))}
                  {partyStatementModal.transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="border border-black p-3 text-center text-slate-400 italic">
                        No transactions recorded for this party.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black text-[9px]">
                    <td colSpan={5} className="p-1 text-right uppercase text-black">
                      Party Totals ({partyStatementModal.transactions.length}):
                    </td>
                    <td className="p-1 text-right font-mono text-emerald-700 truncate">
                      +{formatCurrency(partyStatementModal.totalIn)}
                    </td>
                    <td className="p-1 text-right font-mono text-rose-700 truncate">
                      -{formatCurrency(partyStatementModal.totalOut)}
                    </td>
                    <td className="p-1 text-right font-mono text-slate-900 truncate">
                      {formatCurrency(partyStatementModal.balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <PrintFooter
              notes={`Official Individual Party Account Statement for ${partyStatementModal.partyName} generated by Super Pak Data Wale Goods Transport Co. Verified against Cash Book records.`}
              preparedByLabel="Accountant"
              checkedByLabel="Station Manager"
              authorizedLabel="Authorized Signatory"
            />
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: + CASH IN (AAMAD) */}
      {/* ======================================================== */}
      <Dialog open={cashInModalOpen} onOpenChange={setCashInModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto overflow-x-visible p-6 pb-28">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span>Record Cash IN (+ آمد)</span>
            </DialogTitle>
            <DialogDescription>
              Record incoming money, freight collections, or customer payments to {selectedBook?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCashIn} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Date *</Label>
                <Input
                  type="date"
                  required
                  value={txFormData.date}
                  onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Amount (PKR) *
                </Label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder=""
                  value={txFormData.amount}
                  onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                  className="h-9 text-sm font-mono font-bold border-emerald-300 focus-visible:ring-emerald-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <HybridCombobox
                  value={txFormData.category}
                  onChange={(val) => setTxFormData({ ...txFormData, category: val })}
                  options={CASH_IN_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Payment Mode</Label>
                <select
                  value={txFormData.paymentMethod}
                  onChange={(e) => setTxFormData({ ...txFormData, paymentMethod: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs mt-1"
                >
                  <option value="CASH">CASH (نقدی)</option>
                  <option value="BANK">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="ONLINE">ONLINE / JAZZCASH / EASYPAISA</option>
                </select>
              </div>
            </div>

            {/* Customer / Party Linking */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Link Customer / Client</Label>
                <select
                  value={txFormData.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    setTxFormData({
                      ...txFormData,
                      customerId: e.target.value,
                      party: cust ? (cust.companyName || cust.name) : txFormData.party,
                    });
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs mt-1"
                >
                  <option value="">-- None / Direct Counter --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name} ({c.city || "Client"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold">Party / Payer Name</Label>
                <HybridCombobox
                  value={txFormData.party}
                  onChange={(val) => setTxFormData({ ...txFormData, party: val })}
                  options={customers.map((c) => ({
                    value: c.companyName || c.name,
                    label: c.companyName || c.name,
                    sublabel: c.city || "Client",
                  }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Bilty Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Link Bilty # (Optional)</Label>
                <select
                  value={txFormData.biltyId}
                  onChange={(e) => {
                    const blt = bilties.find((b) => b.id === e.target.value);
                    setTxFormData({
                      ...txFormData,
                      biltyId: e.target.value,
                      biltyNumber: blt ? blt.biltyNumber : "",
                    });
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs mt-1"
                >
                  <option value="">-- None --</option>
                  {bilties.slice(0, 30).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.biltyNumber} ({b.origin} → {b.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold">Voucher / Receipt #</Label>
                <Input
                  placeholder=""
                  value={txFormData.voucherNumber}
                  onChange={(e) => setTxFormData({ ...txFormData, voucherNumber: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Description / Remarks</Label>
              <Input
                placeholder=""
                value={txFormData.description}
                onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            {/* Voucher Attachment */}
            <VoucherImageAttachment
              value={txFormData.attachment}
              onChange={(val) => setTxFormData({ ...txFormData, attachment: val })}
              label="Attach Voucher / Deposit Slip Proof (Optional)"
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCashInModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Cash IN (+ آمد)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: - CASH OUT (KHARCHA) WITH TRANSPORT LINKING */}
      {/* ======================================================== */}
      <Dialog open={cashOutModalOpen} onOpenChange={setCashOutModalOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto overflow-x-visible p-6 pb-28">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span>Record Cash OUT (- خرچہ / Adaigi)</span>
            </DialogTitle>
            <DialogDescription>
              Record diesel, driver advance, trip expenses, or maintenance from {selectedBook?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCashOut} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Date *</Label>
                <Input
                  type="date"
                  required
                  value={txFormData.date}
                  onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  Amount (PKR) *
                </Label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder=""
                  value={txFormData.amount}
                  onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                  className="h-9 text-sm font-mono font-bold border-rose-300 focus-visible:ring-rose-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Category *</Label>
                <HybridCombobox
                  value={txFormData.category}
                  onChange={(val) => setTxFormData({ ...txFormData, category: val })}
                  options={CASH_OUT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Payment Mode</Label>
                <select
                  value={txFormData.paymentMethod}
                  onChange={(e) => setTxFormData({ ...txFormData, paymentMethod: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs mt-1"
                >
                  <option value="CASH">CASH (نقدی)</option>
                  <option value="BANK">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="ONLINE">ONLINE / PETROL CARD</option>
                </select>
              </div>
            </div>

            {/* TRANSPORT LINKING SECTION */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Truck className="w-3.5 h-3.5 text-spd-blue" />
                <span>Transport-Specific Linking (Fleet & Trips)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Vehicle Selection */}
                <div>
                  <Label className="text-[11px] font-bold">Vehicle / Truck #</Label>
                  <HybridCombobox
                    value={txFormData.vehicleNumber}
                    onChange={(val) => {
                      const veh = vehicles.find((v) => v.vehicleNumber === val);
                      setTxFormData({
                        ...txFormData,
                        vehicleNumber: val,
                        vehicleId: veh ? veh.id : txFormData.vehicleId,
                      });
                    }}
                    options={vehicles.map((v) => ({
                      value: v.vehicleNumber,
                      label: v.vehicleNumber,
                      sublabel: v.ownerName || "Vehicle",
                    }))}
                    className="mt-1"
                  />
                </div>

                {/* Driver Selection */}
                <div>
                  <Label className="text-[11px] font-bold">Driver</Label>
                  <HybridCombobox
                    value={txFormData.driverName}
                    onChange={(val) => {
                      const d = drivers.find((drv) => drv.name === val);
                      setTxFormData({
                        ...txFormData,
                        driverName: val,
                        driverId: d ? d.id : txFormData.driverId,
                        party: !txFormData.party ? val : txFormData.party,
                      });
                    }}
                    options={drivers.map((d) => ({
                      value: d.name,
                      label: d.name,
                      sublabel: d.phone || "Driver",
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Challan Selection */}
                <div>
                  <Label className="text-[11px] font-bold">Link Challan # (Auto syncs expense)</Label>
                  <select
                    value={txFormData.challanId}
                    onChange={(e) => {
                      const ch = challans.find((c) => c.id === e.target.value);
                      setTxFormData({
                        ...txFormData,
                        challanId: e.target.value,
                        challanNumber: ch ? ch.challanNumber : "",
                        route: ch ? `${ch.origin} → ${ch.destination}` : txFormData.route,
                        vehicleNumber: ch && ch.truckNumber ? ch.truckNumber : txFormData.vehicleNumber,
                        driverName: ch && ch.driverName ? ch.driverName : txFormData.driverName,
                      });
                    }}
                    className="w-full h-8.5 rounded-md border border-input bg-background px-2.5 text-xs mt-1"
                  >
                    <option value="">-- Select Challan --</option>
                    {challans.slice(0, 30).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.challanNumber} ({ch.truckNumber} • {ch.origin} → {ch.destination})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route */}
                <div>
                  <Label className="text-[11px] font-bold">Route</Label>
                  <Input
                    placeholder=""
                    value={txFormData.route}
                    onChange={(e) => setTxFormData({ ...txFormData, route: e.target.value })}
                    className="h-8.5 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Vendor / Recipient & Voucher # */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Party / Vendor Name</Label>
                <HybridCombobox
                  value={txFormData.party}
                  onChange={(val) => setTxFormData({ ...txFormData, party: val })}
                  options={[
                    ...customers.map((c) => ({ value: c.companyName || c.name, label: c.companyName || c.name, sublabel: "Customer / Vendor" })),
                    ...drivers.map((d) => ({ value: d.name, label: d.name, sublabel: "Driver" })),
                  ]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Voucher / Slip #</Label>
                <Input
                  placeholder=""
                  value={txFormData.voucherNumber}
                  onChange={(e) => setTxFormData({ ...txFormData, voucherNumber: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Description / Details</Label>
              <Input
                placeholder=""
                value={txFormData.description}
                onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            {/* Voucher Attachment */}
            <VoucherImageAttachment
              value={txFormData.attachment}
              onChange={(val) => setTxFormData({ ...txFormData, attachment: val })}
              label="Attach Voucher / Fuel Slip / Expense Receipt Proof (Optional)"
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCashOutModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Cash OUT (- خرچہ)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: CREATE NEW CASH BOOK */}
      {/* ======================================================== */}
      <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-spd-blue" />
              <span>Create New Cash Book</span>
            </DialogTitle>
            <DialogDescription>
              Create a dedicated cash ledger for a branch, office, or terminal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4">
            <div>
              <Label className="text-xs font-bold">Cash Book Name *</Label>
              <Input
                required
                placeholder=""
                value={newBookData.name}
                onChange={(e) => setNewBookData({ ...newBookData, name: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">City / Station *</Label>
                <Input
                  required
                  placeholder=""
                  value={newBookData.city}
                  onChange={(e) => setNewBookData({ ...newBookData, city: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Opening Balance (PKR)</Label>
                <Input
                  type="number"
                  placeholder=""
                  value={newBookData.openingBalance}
                  onChange={(e) => setNewBookData({ ...newBookData, openingBalance: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Description / Purpose</Label>
              <Input
                placeholder=""
                value={newBookData.description}
                onChange={(e) => setNewBookData({ ...newBookData, description: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateBookOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Create Book
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 4: DELETE TRANSACTION CONFIRMATION */}
      {/* ======================================================== */}
      <Dialog open={!!deleteTx} onOpenChange={(open) => !open && setDeleteTx(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Cash Transaction</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry?
            </DialogDescription>
          </DialogHeader>

          {deleteTx && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1 font-mono">
              <p className="font-bold text-slate-900 dark:text-white">{deleteTx.description}</p>
              <p className="text-muted-foreground">Voucher: {deleteTx.voucherNumber || deleteTx.id.slice(0, 8)}</p>
              <p className="text-rose-600 font-bold">
                Amount: Rs {(deleteTx.debit > 0 ? deleteTx.debit : deleteTx.credit).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTx(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTransaction}
              disabled={deletingTx}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {deletingTx && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 5: ARCHIVE CASH BOOK */}
      {/* ======================================================== */}
      <Dialog open={archiveBookOpen} onOpenChange={setArchiveBookOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Archive className="w-5 h-5" />
              <span>Archive Cash Book</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{selectedBook?.name}&quot;? Existing transactions will be preserved in the archive.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveBookOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleArchiveBook}
              disabled={archivingBook}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {archivingBook && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Archive Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* LIGHTBOX: VIEW VOUCHER / RECEIPT PROOF IMAGE */}
      {/* ======================================================== */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-3xl p-4 bg-slate-950 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-200 flex items-center justify-between">
                <span>Voucher / Receipt Proof</span>
                <a
                  href={lightboxImage}
                  download="voucher-proof.jpg"
                  className="text-xs text-spd-blue hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 flex items-center justify-center max-h-[75vh] overflow-auto rounded-lg bg-black/40 p-2">
              <img
                src={lightboxImage}
                alt="Voucher Receipt Proof"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ======================================================== */}
      {/* MODAL: PARTY STATEMENT & QUICK ACTIONS */}
      {/* ======================================================== */}
      <Dialog open={!!partyStatementModal} onOpenChange={(open) => !open && setPartyStatementModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {partyStatementModal && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <DialogTitle className="flex items-center gap-2 text-base font-black uppercase text-slate-900 dark:text-white">
                    <Building2 className="w-5 h-5 text-spd-blue shrink-0" />
                    <span>Party Ledger Statement: {partyStatementModal.partyName}</span>
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportPartyExcel(partyStatementModal.partyName)}
                      className="gap-1.5 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel (.xlsx)</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePrintPartyStatement(partyStatementModal.partyName)}
                      className="gap-1.5 text-xs font-bold bg-spd-blue hover:bg-spd-blue/90 text-white"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF (A4)</span>
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  Consolidated chronological transaction history and running net balance for{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{partyStatementModal.partyName}</strong>
                </DialogDescription>
              </DialogHeader>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Entries</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {partyStatementModal.transactions.length}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Total Received (آمد)</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(partyStatementModal.totalIn)}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">Total Paid (خرچہ)</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                    -{formatCurrency(partyStatementModal.totalOut)}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 block">Net Balance (بقایا)</span>
                  <span className={cn(
                    "text-lg font-black",
                    partyStatementModal.balance >= 0 ? "text-blue-700 dark:text-blue-300" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {formatCurrency(partyStatementModal.balance)}
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800 text-[11px]">
                      <TableHead className="w-20 font-bold">Date</TableHead>
                      <TableHead className="w-24 font-bold">Voucher #</TableHead>
                      <TableHead className="font-bold">Description</TableHead>
                      <TableHead className="w-24 font-bold text-right text-emerald-700">Cash IN</TableHead>
                      <TableHead className="w-24 font-bold text-right text-rose-700">Cash OUT</TableHead>
                      <TableHead className="w-24 font-bold text-right font-black">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partyStatementModal.transactions.map((tx: any, idx: number) => (
                      <TableRow key={tx.id || idx} className="text-xs">
                        <TableCell className="font-mono text-[11px] whitespace-nowrap">
                          {tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "-"}
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          {tx.voucherNumber || tx.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{tx.description || tx.category}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {tx.category} • {tx.paymentMethod || "CASH"}
                            {tx.biltyNumber && ` • Bilty: ${tx.biltyNumber}`}
                            {tx.challanNumber && ` • Challan: ${tx.challanNumber}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600">
                          {tx.credit > 0 ? `+Rs ${tx.credit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-rose-600">
                          {tx.debit > 0 ? `-Rs ${tx.debit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-slate-900 dark:text-white">
                          Rs {(tx.partyRunningBalance ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Ledger Period: {partyStatementModal.dateRange}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setPartyStatementModal(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
