"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Handshake,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Building2,
  Wallet,
  RefreshCw,
  Loader2,
  FileText,
  DollarSign,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
  CreditCard,
  Edit,
  Trash2,
  Save,
  FileSpreadsheet,
} from "lucide-react";
import {
  getStoredBrokers,
  getDeletedBrokerIds,
  saveStoredBroker,
  removeStoredBroker,
  mergeLocalWithApi,
  getStoredChallans,
  syncWithServer,
} from "@/lib/local-persistence";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import { exportToExcel } from "@/lib/export-excel";

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(brokers);
  const [challans, setChallans] = useState<any[]>([]);
  const [cashBooks, setCashBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Ledger Dialog State
  const [selectedBrokerForLedger, setSelectedBrokerForLedger] = useState<any | null>(null);

  // Payment Recording Dialog State
  const [paymentBroker, setPaymentBroker] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedCashBookId, setSelectedCashBookId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentVoucher, setPaymentVoucher] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchBrokersData();
    syncWithServer();
  }, []);

  const fetchBrokersData = async () => {
    setLoading(true);

    // 1. Load local brokers & challans immediately
    const localBrokers = getStoredBrokers();
    const deletedIds = getDeletedBrokerIds();
    const localChallans = getStoredChallans();
    setChallans(localChallans);

    if (localBrokers.length > 0) {
      setBrokers(localBrokers);
    }

    // 2. Fetch from API & sync
    try {
      const [brokerRes, cbRes, chRes] = await Promise.all([
        fetch("/api/admin/brokers"),
        fetch("/api/admin/cash-books"),
        fetch("/api/admin/challan"),
      ]);

      const brokerData = await brokerRes.json();
      if (brokerData.success && Array.isArray(brokerData.data)) {
        const merged = mergeLocalWithApi(localBrokers, brokerData.data, deletedIds);
        setBrokers(merged);
      }

      const cbData = await cbRes.json();
      if (cbData.success && Array.isArray(cbData.data)) {
        setCashBooks(cbData.data);
        if (cbData.data.length > 0 && !selectedCashBookId) {
          setSelectedCashBookId(cbData.data[0].id);
        }
      }

      const chData = await chRes.json();
      if (chData.success && Array.isArray(chData.data)) {
        setChallans(chData.data);
      }
    } catch (err) {
      console.warn("API broker query fallback to local state:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBroker) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentFeedback({ type: "error", text: "Please enter a valid payment amount greater than 0." });
      return;
    }

    setRecordingPayment(true);
    setPaymentFeedback(null);

    try {
      const selectedCb = cashBooks.find((cb) => cb.id === selectedCashBookId);
      const payload = {
        action: "RECORD_PAYMENT",
        brokerId: paymentBroker.id,
        brokerName: paymentBroker.name,
        amount: amountNum,
        cashBookId: selectedCashBookId,
        cashBookName: selectedCb?.name || "Main Cash Book",
        paymentMethod,
        voucherNumber: paymentVoucher.trim() || `VCH-BRK-${Date.now().toString().slice(-6)}`,
        notes: paymentNotes.trim(),
        date: new Date().toISOString(),
      };

      const res = await fetch("/api/admin/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to record broker payment.");
      }

      // Update local broker balance
      const updatedBrokers = brokers.map((b) => {
        if (b.id === paymentBroker.id) {
          const currentBal = b.netPayableBalance !== undefined ? b.netPayableBalance : (b.openingBalance || 0);
          return {
            ...b,
            netPayableBalance: Math.max(0, currentBal - amountNum),
          };
        }
        return b;
      });

      setBrokers(updatedBrokers);
      const updatedTarget = updatedBrokers.find((b) => b.id === paymentBroker.id);
      if (updatedTarget) saveStoredBroker(updatedTarget);

      setPaymentFeedback({
        type: "success",
        text: `Payment of ₨ ${amountNum.toLocaleString()} recorded and deducted from ${selectedCb?.name || "Cash Book"}!`,
      });

      setTimeout(() => {
        setPaymentBroker(null);
        setPaymentAmount("");
        setPaymentVoucher("");
        setPaymentNotes("");
        setPaymentFeedback(null);
      }, 1500);
    } catch (err: any) {
      setPaymentFeedback({ type: "error", text: err.message || "Failed to process payment." });
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteBroker = (brokerId: string, brokerName: string) => {
    if (!confirm(`Are you sure you want to archive broker "${brokerName}"?`)) return;
    removeStoredBroker(brokerId);
    setBrokers((prev) => prev.filter((b) => b.id !== brokerId));
    fetch(`/api/admin/brokers?id=${encodeURIComponent(brokerId)}`, { method: "DELETE" }).catch(() => {});
  };

  // Filtered List
  const filteredBrokers = useMemo(() => {
    return brokers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.contactPerson?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.cnic?.toLowerCase().includes(q);

      const matchesCity = cityFilter === "ALL" || b.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [brokers, searchQuery, cityFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = brokers.length;
    const active = brokers.filter((b) => b.status === "ACTIVE").length;
    const totalTrips = brokers.reduce((sum, b) => sum + (b.totalTrips || 0), 0);
    const totalPayable = brokers.reduce((sum, b) => sum + (b.netPayableBalance || b.openingBalance || 0), 0);
    return { total, active, totalTrips, totalPayable };
  }, [brokers]);

  // Challans assigned to selected broker in ledger
  const brokerLedgerChallans = useMemo(() => {
    if (!selectedBrokerForLedger) return [];
    return challans.filter(
      (c) =>
        c.brokerId === selectedBrokerForLedger.id ||
        (c.brokerName &&
          c.brokerName.toLowerCase().trim() === selectedBrokerForLedger.name.toLowerCase().trim())
    );
  }, [selectedBrokerForLedger, challans]);

  const handleExportExcel = () => {
    if (!filteredBrokers.length) return;
    const data = filteredBrokers.map((b) => ({
      "Broker Name": b.name || "",
      "Contact Person": b.contactPerson || "",
      "Phone": b.phone || "",
      "WhatsApp": b.whatsapp || b.phone || "",
      "City": b.city || "",
      "CNIC / NTN": b.cnic || "",
      "Commission Type": b.commissionType || "PERCENTAGE",
      "Commission Rate": b.commissionRate || 0,
      "Status": b.status || "ACTIVE",
      "Trips Assigned": b.totalTrips || 0,
      "Agreed Freight (PKR)": b.totalFreightAgreed || 0,
      "Advance Given (PKR)": b.totalAdvancePaid || 0,
      "Net Balance Payable (PKR)": b.netPayableBalance || b.openingBalance || 0,
      "Bank Details": b.bankDetails || "",
      "Notes": b.notes || "",
    }));
    exportToExcel(data, "SPD_Brokers_Directory");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Fleet Brokers & Commission Agents"
          description="Manage third-party transport brokers, market vehicle commissions, trip freight ledgers, and cash disbursements."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!filteredBrokers.length}
            className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchBrokersData}
            disabled={loading}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Sync Live</span>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
          >
            <Link href="/admin/brokers/new">
              <Plus className="w-4 h-4" />
              <span>Add Broker</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-spd-blue shrink-0">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Brokers</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Partners</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Market Trips Assigned</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{stats.totalTrips}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Payable Balance</p>
            <p className="text-lg font-black text-rose-600 mt-0.5">₨ {stats.totalPayable.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by broker agency, contact person, phone number, city..."
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

        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Stations</option>
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Partners</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading && brokers.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-spd-blue" />
          <p className="text-xs text-slate-400 font-semibold">Loading broker directory...</p>
        </div>
      ) : filteredBrokers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No brokers found"
          description="Register third-party commission agents and fleet suppliers to hire market vehicles."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Broker / Agency</TableHead>
                <TableHead className="text-xs font-bold">Contact Person & Phone</TableHead>
                <TableHead className="text-xs font-bold">Station / City</TableHead>
                <TableHead className="text-xs font-bold">Commission Terms</TableHead>
                <TableHead className="text-xs font-bold">Market Trips</TableHead>
                <TableHead className="text-xs font-bold">Net Balance Payable</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrokers.map((b) => {
                const whatsappUrl = b.phone
                  ? buildWhatsAppUrl(
                      b.whatsapp || b.phone,
                      `Assalam-o-Alaikum ${b.contactPerson || b.name}, SPD Logistics Pakistan regarding vehicle dispatch.`
                    )
                  : null;

                const payableAmount = b.netPayableBalance !== undefined ? b.netPayableBalance : (b.openingBalance || 0);

                return (
                  <TableRow
                    key={b.id}
                    id={`record-${b.id}`}
                    data-record-id={b.id}
                    className={cn(
                      "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors",
                      highlightClass(b.id)
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center font-bold text-xs shrink-0">
                          <Handshake className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                            {b.name}
                          </p>
                          {b.cnic && (
                            <p className="text-[10px] text-slate-400 font-mono">CNIC: {b.cnic}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {b.contactPerson || "Primary Contact"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-mono">{b.phone}</span>
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs font-semibold rounded-lg">
                        {b.city || "Lahore"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        {b.commissionType === "PERCENTAGE" ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {b.commissionRate || 5}% of Freight
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            ₨ {(b.commissionRate || 0).toLocaleString()} / Trip
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        <span>{b.totalTrips || 0} Trips</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className={cn(
                          "text-xs font-black font-mono",
                          payableAmount > 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                          ₨ {payableAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {payableAmount > 0 ? "Payable" : "Clear"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold rounded-lg px-2 py-0.5 uppercase tracking-wider",
                          b.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {b.status || "ACTIVE"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBrokerForLedger(b)}
                          className="h-8 rounded-xl text-xs font-semibold gap-1 text-spd-blue hover:text-spd-blueHover"
                          title="View Ledger & Trips"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaymentBroker(b);
                            setPaymentAmount(payableAmount > 0 ? String(payableAmount) : "");
                          }}
                          className="h-8 rounded-xl text-xs font-semibold gap-1 text-emerald-600 hover:text-emerald-700"
                          title="Record Cash Disbursement"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </Button>

                        <Link href={`/admin/brokers/${b.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-800">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBroker(b.id, b.name)}
                          className="h-8 w-8 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DIALOG 1: BROKER TRIP & ACCOUNT LEDGER */}
      {selectedBrokerForLedger && (
        <Dialog open={!!selectedBrokerForLedger} onOpenChange={() => setSelectedBrokerForLedger(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <Receipt className="w-5 h-5 text-spd-blue" />
                <span>Broker Trip & Account Ledger: {selectedBrokerForLedger.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                City: {selectedBrokerForLedger.city} • Contact: {selectedBrokerForLedger.contactPerson} ({selectedBrokerForLedger.phone})
              </DialogDescription>
            </DialogHeader>

            {/* Summary Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Opening Balance</p>
                <p className="text-sm font-bold mt-0.5">₨ {(selectedBrokerForLedger.openingBalance || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Commission Rate</p>
                <p className="text-sm font-bold text-indigo-600 mt-0.5">
                  {selectedBrokerForLedger.commissionType === "PERCENTAGE"
                    ? `${selectedBrokerForLedger.commissionRate || 5}%`
                    : `₨ ${(selectedBrokerForLedger.commissionRate || 0).toLocaleString()} / trip`}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Market Trips</p>
                <p className="text-sm font-bold text-amber-600 mt-0.5">{brokerLedgerChallans.length} Trips</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Net Balance Payable</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  ₨ {(selectedBrokerForLedger.netPayableBalance || selectedBrokerForLedger.openingBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Banking Details Box */}
            {selectedBrokerForLedger.bankDetails && (
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                <p className="font-bold text-blue-900 dark:text-blue-300">Bank / Payment Instructions:</p>
                <p className="text-blue-800 dark:text-blue-200 mt-0.5 font-mono">{selectedBrokerForLedger.bankDetails}</p>
              </div>
            )}

            {/* Assigned Trips / Challans Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Trips & Challans</h4>
              {brokerLedgerChallans.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No trips assigned to this broker yet. To assign, select this broker in the Challan dispatch form.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                      <TableRow>
                        <TableHead className="font-bold">Challan #</TableHead>
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold">Vehicle Plate</TableHead>
                        <TableHead className="font-bold">Route (From &rarr; To)</TableHead>
                        <TableHead className="font-bold">Freight Agreed</TableHead>
                        <TableHead className="font-bold">Advance Given</TableHead>
                        <TableHead className="font-bold text-right">Balance Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brokerLedgerChallans.map((ch: any) => {
                        const freight = parseFloat(ch.brokerFreight) || parseFloat(ch.totalAmount) || 0;
                        const advance = parseFloat(ch.brokerAdvance) || 0;
                        const balance = freight - advance;

                        return (
                          <TableRow key={ch.id || ch.challanNumber}>
                            <TableCell className="font-mono font-bold">{ch.challanNumber}</TableCell>
                            <TableCell>{formatDate(ch.date || ch.createdAt)}</TableCell>
                            <TableCell className="font-bold">{ch.truckNumber || ch.vehicleNumber || "Market Truck"}</TableCell>
                            <TableCell>
                              <span>{ch.origin}</span> &rarr; <span>{ch.destination}</span>
                            </TableCell>
                            <TableCell className="font-bold">₨ {freight.toLocaleString()}</TableCell>
                            <TableCell className="text-amber-600 font-semibold">₨ {advance.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-black text-rose-600">₨ {balance.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBrokerForLedger(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Close Ledger
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPaymentBroker(selectedBrokerForLedger);
                  setPaymentAmount(String(selectedBrokerForLedger.netPayableBalance || selectedBrokerForLedger.openingBalance || 0));
                  setSelectedBrokerForLedger(null);
                }}
                className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Record Payment to Broker</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 2: RECORD PAYMENT (CASH BOOK INTEGRATION) */}
      {paymentBroker && (
        <Dialog open={!!paymentBroker} onOpenChange={() => setPaymentBroker(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Record Broker Payment: {paymentBroker.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Disburse payment to broker and record expenditure in the selected Cash Book.
              </DialogDescription>
            </DialogHeader>

            {paymentFeedback && (
              <div
                className={cn(
                  "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                  paymentFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                )}
              >
                {paymentFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{paymentFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-[11px] text-slate-500">
                  Payment Amount (₨) *
                </label>
                <Input
                  required
                  type="number"
                  step="any"
                  placeholder=""
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-[11px] text-slate-500">
                  Select Cash Book (Deduct From) *
                </label>
                <select
                  value={selectedCashBookId}
                  onChange={(e) => setSelectedCashBookId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  {cashBooks.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name} (₨ {(cb.currentBalance || cb.openingBalance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[11px] text-slate-500">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online / Raast</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[11px] text-slate-500">
                    Voucher / Receipt #
                  </label>
                  <Input
                    placeholder=""
                    value={paymentVoucher}
                    onChange={(e) => setPaymentVoucher(e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-[11px] text-slate-500">
                  Payment Notes / Reference
                </label>
                <Input
                  placeholder=""
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentBroker(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={recordingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
                >
                  {recordingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Confirm & Deduct</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
