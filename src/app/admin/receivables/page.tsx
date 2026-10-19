"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ArrowDownLeft,
  Search,
  RefreshCw,
  Printer,
  Download,
  CreditCard,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Phone,
  Eye,
  Wallet,
  FileText,
  ChevronRight,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/export-excel";
import { PrintHeader, PrintFooter } from "@/components/shared/print-letterhead";
import { MonthlyBillStatementModal } from "@/components/customers/monthly-bill-statement-modal";

interface BiltyDetail {
  id: string;
  biltyNumber: string;
  trackingId: string;
  date: string;
  senderName: string;
  receiverName: string;
  senderPhone: string;
  receiverPhone: string;
  origin: string;
  destination: string;
  freight: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: string;
  shipmentStatus: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  paymentMethod: string;
  reference: string;
  notes?: string;
  type: string;
}

interface CustomerReceivable {
  customerId: string;
  customerName: string;
  phone: string;
  city: string;
  companyName: string;
  totalBiltiesCount: number;
  totalFreightAmount: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingBalance: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  bilties: BiltyDetail[];
  payments: PaymentRecord[];
}

export default function ReceivablesPage() {
  const [customers, setCustomers] = useState<CustomerReceivable[]>([]);
  const [monthlyBillCustomer, setMonthlyBillCustomer] = useState<any | null>(null);
  const [summary, setSummary] = useState({
    totalInvoiced: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    totalBilties: 0,
    unpaidCustomerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PARTIAL" | "PAID">("ALL");

  // Cash books for payment modal
  const [cashBooks, setCashBooks] = useState<any[]>([]);

  // Storage Keys for Offline & Netlify Resilience
  const LOCAL_RECEIVABLES_PAYMENTS_KEY = "spd_local_receivables_payments";
  const LOCAL_TXS_KEY = "spd_local_cash_transactions";

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReceivable | null>(null);
  const [viewBiltiesOpen, setViewBiltiesOpen] = useState(false);
  const [viewLedgerOpen, setViewLedgerOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentBiltyId, setPaymentBiltyId] = useState<string>("");
  const [selectedCashBookId, setSelectedCashBookId] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/receivables?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let custList: CustomerReceivable[] = data.data.customers || [];

        // Merge locally created bilties to ensure dynamic history
        if (typeof window !== "undefined") {
          try {
            const rawBilties = localStorage.getItem("spd_local_bilties");
            const localBilties = rawBilties ? JSON.parse(rawBilties) : [];
            if (Array.isArray(localBilties) && localBilties.length > 0) {
              custList = custList.map((cust) => {
                const cNameNorm = (cust.customerName || "").toLowerCase().trim();
                const cCompNorm = (cust.companyName || "").toLowerCase().trim();

                const matchingLocal = localBilties.filter((b: any) => {
                  const bCId = b.customerId && b.customerId === cust.customerId;
                  const bSender = (cNameNorm && b.senderName?.toLowerCase().includes(cNameNorm)) || (cCompNorm && b.senderName?.toLowerCase().includes(cCompNorm));
                  return bCId || bSender;
                });

                const existingBilties = [...cust.bilties];
                for (const lb of matchingLocal) {
                  const exists = existingBilties.some((b) => b.id === lb.id || b.biltyNumber === lb.biltyNumber);
                  if (!exists) {
                    const total = lb.totalAmount || 0;
                    const paid = lb.paidAmount || 0;
                    const rem = Math.max(0, total - paid);
                    existingBilties.unshift({
                      id: lb.id,
                      biltyNumber: lb.biltyNumber,
                      trackingId: lb.trackingId,
                      date: lb.date,
                      senderName: lb.senderName,
                      receiverName: lb.receiverName,
                      senderPhone: lb.senderPhone || "",
                      receiverPhone: lb.receiverPhone || "",
                      origin: lb.origin,
                      destination: lb.destination,
                      freight: lb.freight || total,
                      additionalCharges: lb.additionalCharges || 0,
                      discount: lb.discount || 0,
                      totalAmount: total,
                      paidAmount: paid,
                      remainingBalance: rem,
                      paymentStatus: rem <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
                      shipmentStatus: lb.shipmentStatus || "BOOKED",
                    });
                  }
                }

                const totalInv = existingBilties.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const totalPaid = existingBilties.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
                const totalRem = Math.max(0, totalInv - totalPaid);

                return {
                  ...cust,
                  bilties: existingBilties,
                  totalBiltiesCount: existingBilties.length,
                  totalInvoicedAmount: totalInv,
                  totalPaidAmount: totalPaid,
                  totalOutstandingBalance: totalRem,
                  paymentStatus: totalRem <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID",
                };
              });
            }
          } catch (e) {}
        }

        // Apply locally stored payment settlements
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(LOCAL_RECEIVABLES_PAYMENTS_KEY);
            const localPmts = raw ? JSON.parse(raw) : [];
            if (Array.isArray(localPmts) && localPmts.length > 0) {
              custList = custList.map((cust) => {
                const pList = localPmts.filter((p: any) => p.customerId === cust.customerId);
                if (pList.length === 0) return cust;

                let additionalPaid = 0;
                const existingPmts = [...(cust.payments || [])];
                let updatedBilties = [...cust.bilties];

                for (const lp of pList) {
                  const exists = existingPmts.some((p) => p.id === lp.id || p.reference === lp.reference);
                  if (!exists) {
                    additionalPaid += lp.amount;
                    existingPmts.unshift({
                      id: lp.id,
                      amount: lp.amount,
                      date: lp.date,
                      paymentMethod: lp.paymentMethod,
                      reference: lp.reference,
                      notes: lp.notes,
                      type: "RECEIPT",
                    });

                    // Update linked bilty if applicable
                    if (lp.consignmentId) {
                      updatedBilties = updatedBilties.map((b) => {
                        if (b.id === lp.consignmentId) {
                          const bPaid = (b.paidAmount || 0) + lp.amount;
                          const bRem = Math.max(0, (b.totalAmount || 0) - bPaid);
                          return {
                            ...b,
                            paidAmount: bPaid,
                            remainingBalance: bRem,
                            paymentStatus: bRem <= 0 ? "PAID" : "PARTIAL",
                          };
                        }
                        return b;
                      });
                    }
                  }
                }

                if (additionalPaid > 0) {
                  const newPaid = (cust.totalPaidAmount || 0) + additionalPaid;
                  const newRemaining = Math.max(0, (cust.totalOutstandingBalance || 0) - additionalPaid);
                  const newStatus: "PAID" | "PARTIAL" | "UNPAID" = newRemaining <= 0 ? "PAID" : "PARTIAL";
                  return {
                    ...cust,
                    totalPaidAmount: newPaid,
                    totalOutstandingBalance: newRemaining,
                    paymentStatus: newStatus,
                    payments: existingPmts,
                    bilties: updatedBilties,
                  };
                }
                return cust;
              });
            }
          } catch (e) {}
        }

        if (statusFilter !== "ALL") {
          custList = custList.filter((c) => c.paymentStatus === statusFilter);
        }

        setCustomers(custList);

        // Recalculate summary stats
        const totInvoiced = custList.reduce((sum, c) => sum + (c.totalInvoicedAmount || 0), 0);
        const totReceived = custList.reduce((sum, c) => sum + (c.totalPaidAmount || 0), 0);
        const totOutstanding = custList.reduce((sum, c) => sum + (c.totalOutstandingBalance || 0), 0);
        const totBilties = custList.reduce((sum, c) => sum + (c.totalBiltiesCount || 0), 0);
        const unpaidCount = custList.filter((c) => c.totalOutstandingBalance > 0).length;

        setSummary({
          totalInvoiced: totInvoiced,
          totalReceived: totReceived,
          totalOutstanding: totOutstanding,
          totalBilties: totBilties,
          unpaidCustomerCount: unpaidCount,
        });
      }
    } catch (err) {
      console.error("Failed to load receivables:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Load cash books for dropdown
  useEffect(() => {
    fetchData();
    fetch("/api/admin/cash-books")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCashBooks(d.data || []);
      })
      .catch(() => {});
  }, [fetchData]);

  // Open Record Payment modal
  const handleOpenPayment = (customer: CustomerReceivable, biltyId?: string) => {
    setSelectedCustomer(customer);
    setPaymentBiltyId(biltyId || "");
    const defaultAmount = biltyId
      ? customer.bilties.find((b) => b.id === biltyId)?.remainingBalance || 0
      : customer.totalOutstandingBalance;
    setPaymentAmount(defaultAmount ? String(defaultAmount) : "");
    setPaymentReference(`REC-${Date.now().toString().slice(-6)}`);
    setPaymentNotes("");
    setPaymentSuccessMsg("");
    setPaymentErrorMsg("");
    setRecordPaymentOpen(true);
  };

  // Submit Payment Settlement
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      setPaymentErrorMsg("Please enter a valid positive payment amount");
      return;
    }

    try {
      setSubmittingPayment(true);
      setPaymentErrorMsg("");

      const paymentRef = paymentReference || `REC-${Date.now().toString().slice(-6)}`;
      const newPayment: PaymentRecord & { customerId: string; consignmentId?: string; cashBookId?: string } = {
        id: `rec_pmt_${Date.now()}`,
        amount: num,
        date: new Date().toISOString(),
        paymentMethod,
        reference: paymentRef,
        notes: paymentNotes || undefined,
        type: "RECEIPT",
        customerId: selectedCustomer.customerId,
        consignmentId: paymentBiltyId || undefined,
        cashBookId: selectedCashBookId || undefined,
      };

      // 1. Save to localStorage immediately
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_RECEIVABLES_PAYMENTS_KEY);
          const existing = raw ? JSON.parse(raw) : [];
          existing.unshift(newPayment);
          localStorage.setItem(LOCAL_RECEIVABLES_PAYMENTS_KEY, JSON.stringify(existing));

          // If deposited to cash book, record in local cash transactions
          if (selectedCashBookId) {
            const rawTxs = localStorage.getItem(LOCAL_TXS_KEY);
            const txs = rawTxs ? JSON.parse(rawTxs) : [];
            txs.unshift({
              id: `ctx_rec_${Date.now()}`,
              cashBookId: selectedCashBookId,
              date: new Date().toISOString(),
              voucherNumber: paymentRef,
              description: `Receivable from ${selectedCustomer.customerName} (${paymentMethod})${paymentNotes ? ` - ${paymentNotes}` : ""}`,
              credit: num,
              debit: 0,
              paymentMethod,
              notes: paymentNotes,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem(LOCAL_TXS_KEY, JSON.stringify(txs));
          }
        } catch (e) {}
      }

      // 2. Update state optimistically
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.customerId !== selectedCustomer.customerId) return c;
          const newPaid = (c.totalPaidAmount || 0) + num;
          const newRemaining = Math.max(0, (c.totalOutstandingBalance || 0) - num);
          const newStatus: "PAID" | "PARTIAL" | "UNPAID" = newRemaining <= 0 ? "PAID" : "PARTIAL";

          const updatedBilties = c.bilties.map((b) => {
            if (paymentBiltyId && b.id === paymentBiltyId) {
              const bPaid = (b.paidAmount || 0) + num;
              const bRem = Math.max(0, (b.totalAmount || 0) - bPaid);
              return {
                ...b,
                paidAmount: bPaid,
                remainingBalance: bRem,
                paymentStatus: bRem <= 0 ? "PAID" : "PARTIAL",
              };
            }
            return b;
          });

          return {
            ...c,
            totalPaidAmount: newPaid,
            totalOutstandingBalance: newRemaining,
            paymentStatus: newStatus,
            bilties: updatedBilties,
            payments: [newPayment, ...(c.payments || [])],
          };
        })
      );

      // 3. Update summary stats optimistically
      setSummary((prev) => ({
        ...prev,
        totalReceived: prev.totalReceived + num,
        totalOutstanding: Math.max(0, prev.totalOutstanding - num),
      }));

      setPaymentSuccessMsg(`Payment of PKR ${num.toLocaleString()} recorded successfully! Balance updated.`);
      window.dispatchEvent(new CustomEvent("spd-notifications-updated"));

      // 4. Background API sync (resilient)
      fetch("/api/admin/receivables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.customerId,
          consignmentId: paymentBiltyId || undefined,
          amount: num,
          paymentMethod,
          reference: paymentRef,
          notes: paymentNotes,
          cashBookId: selectedCashBookId || undefined,
        }),
      }).catch((err) => console.warn("Background receivables payment sync warning:", err));

      setTimeout(() => {
        setRecordPaymentOpen(false);
      }, 900);
    } catch (err: any) {
      setPaymentErrorMsg(err.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Universal Excel Export
  const handleExportExcel = () => {
    if (customers.length === 0) return;
    const data = customers.map((c) => ({
      "Customer Name": c.customerName || "",
      "Company": c.companyName || "",
      "Phone": c.phone || "",
      "City": c.city || "",
      "Total Bilties": c.totalBiltiesCount || 0,
      "Total Invoiced (PKR)": c.totalInvoicedAmount || 0,
      "Total Paid (PKR)": c.totalPaidAmount || 0,
      "Outstanding Balance (PKR)": c.totalOutstandingBalance || 0,
      "Payment Status": c.paymentStatus || "UNPAID",
    }));

    exportToExcel(data, "SPD_Receivables_Summary");
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: "PAID" | "PARTIAL" | "UNPAID") => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
            PAID
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
            PARTIAL
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-spd-red hover:bg-red-700 text-white font-semibold">
            UNPAID
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Receivables & Customer Ledgers"
          description="Track money owed by customers, bilty-wise balances, payments, and outstanding credits."
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
              disabled={customers.length === 0}
              className="w-full sm:w-auto gap-1.5 bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export Excel
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="w-full sm:w-auto bg-spd-blue hover:bg-blue-800 text-white gap-1.5">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block">
        <PrintHeader
          title="ACCOUNTS RECEIVABLE & CUSTOMER OUTSTANDING LEDGER"
          subtitle="Customer Ledger Balances, Active Consignments & Credit Summary"
          station="Nationwide Operations"
        />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <StatsCard
          title="Total Invoiced Freight"
          value={formatCurrency(summary.totalInvoiced || 0)}
          icon={ArrowDownLeft}
          description="All active bilties billed"
        />
        <StatsCard
          title="Total Paid / Received"
          value={formatCurrency(summary.totalReceived || 0)}
          icon={CreditCard}
          description="Cash and bank collections"
        />
        <div className="rounded-xl border p-6 bg-gradient-to-br from-red-500/10 via-card to-card border-spd-red/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-spd-red uppercase tracking-wider">Outstanding Receivable</span>
            <span className="p-2 rounded-lg bg-spd-red/10 text-spd-red">
              <ArrowDownLeft className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-spd-red tracking-tight">
              {formatCurrency(summary.totalOutstanding || 0)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Pending customer settlement</p>
          </div>
        </div>
        <StatsCard
          title="Active Consignments"
          value={summary.totalBilties || 0}
          icon={Package}
          description={`${summary.unpaidCustomerCount || 0} customer(s) have balances`}
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by customer name, phone, or bilty #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background focus-visible:ring-spd-red"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl shrink-0">
          {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "ALL" ? "All Customers" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Customers Breakdown Table */}
      {loading && customers.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3 bg-card rounded-xl border">
          <RefreshCw className="h-8 w-8 animate-spin text-spd-red" />
          <p className="text-sm font-medium">Calculating live balances from database...</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={ArrowDownLeft}
          title="No records found"
          description="Click '+ Add New' to create your first entry."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold">Customer / Dealer</TableHead>
                  <TableHead className="font-bold">Phone / City</TableHead>
                  <TableHead className="font-bold text-center">Bilties</TableHead>
                  <TableHead className="font-bold text-right">Total Invoiced</TableHead>
                  <TableHead className="font-bold text-right">Paid Amount</TableHead>
                  <TableHead className="font-bold text-right text-spd-red">Outstanding Balance</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-center print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customerId} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{customer.customerName}</div>
                          {customer.companyName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{customer.companyName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="text-muted-foreground">{customer.city}</div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-bold">
                      <span className="px-2 py-1 rounded-full bg-muted text-xs font-semibold">
                        {customer.totalBiltiesCount}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalInvoicedAmount)}
                    </TableCell>

                    <TableCell className="text-right text-emerald-600 font-semibold">
                      {formatCurrency(customer.totalPaidAmount)}
                    </TableCell>

                    <TableCell className="text-right font-black text-spd-red text-base">
                      {formatCurrency(customer.totalOutstandingBalance)}
                    </TableCell>

                    <TableCell className="text-center">
                      {getStatusBadge(customer.paymentStatus)}
                    </TableCell>

                    <TableCell className="text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setViewBiltiesOpen(true);
                          }}
                          className="h-8 text-xs gap-1"
                          title="View Bilty breakdown"
                        >
                          <Package className="h-3.5 w-3.5" />
                          Bilties ({customer.bilties.length})
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setViewLedgerOpen(true);
                          }}
                          className="h-8 text-xs gap-1"
                          title="View Payment History"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Ledger</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMonthlyBillCustomer({
                              id: customer.customerId,
                              name: customer.customerName,
                              companyName: customer.companyName,
                              phone: customer.phone,
                              city: customer.city,
                            });
                          }}
                          className="h-8 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                          title="Monthly Freight Bill Statement (A4 & Excel)"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Bill</span>
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenPayment(customer)}
                          className="h-8 text-xs bg-spd-red hover:bg-red-700 text-white gap-1"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay
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

      {/* Main Report Printable Footer */}
      <div className="hidden print:block">
        <PrintFooter
          notes="Official Accounts Receivable ledger generated from Super Pak Data Goods Transport Co. Core Ledger. Confirmed freight charges are legally recoverable under standard carriage agreements."
          preparedByLabel="Prepared By"
          checkedByLabel="Checked By"
          authorizedLabel="Authorized Signature"
        />
      </div>

      {/* DIALOG 1: Bilty-Wise Breakdown */}
      <Dialog open={viewBiltiesOpen} onOpenChange={setViewBiltiesOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Bilty Breakdown & Receivables — {selectedCustomer?.customerName}
                </DialogTitle>
                <DialogDescription>
                  Detailed consignment breakdown and outstanding balances for {selectedCustomer?.customerName}.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedCustomer?.bilties.length || 0} Bilties
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-2 print:hidden">
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-xl text-center">
              <div>
                <span className="text-xs text-muted-foreground block">Total Freight</span>
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(selectedCustomer?.totalInvoicedAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Paid Advance</span>
                <span className="text-base font-bold text-emerald-600">
                  {formatCurrency(selectedCustomer?.totalPaidAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                <span className="text-base font-black text-spd-red">
                  {formatCurrency(selectedCustomer?.totalOutstandingBalance || 0)}
                </span>
              </div>
            </div>

            <div className="border rounded-xl overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead>Bilty / Tracking #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receiver & Route</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right text-spd-red">Balance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer?.bilties.map((b) => (
                    <TableRow key={b.id} className="text-xs">
                      <TableCell>
                        <div className="font-bold text-spd-red">{b.biltyNumber}</div>
                        <div className="text-[11px] text-muted-foreground">{b.trackingId}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(b.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{b.receiverName}</div>
                        <div className="text-muted-foreground text-[11px]">{b.origin} &rarr; {b.destination}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(b.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">
                        {formatCurrency(b.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-black text-spd-red">
                        {formatCurrency(b.remainingBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={b.remainingBalance <= 0 ? "secondary" : "outline"}
                          className={`text-[10px] font-bold ${
                            b.remainingBalance <= 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : b.paidAmount > 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                          }`}
                        >
                          {b.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {b.remainingBalance > 0 ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setViewBiltiesOpen(false);
                              handleOpenPayment(selectedCustomer, b.id);
                            }}
                            className="h-7 text-[11px] px-2.5 bg-spd-red hover:bg-red-700 text-white"
                          >
                            Pay
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-medium flex items-center justify-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Settled
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewBiltiesOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedCustomer) {
                    setMonthlyBillCustomer({
                      id: selectedCustomer.customerId,
                      name: selectedCustomer.customerName,
                      companyName: selectedCustomer.companyName,
                      phone: selectedCustomer.phone,
                      city: selectedCustomer.city,
                    });
                  }
                }}
                className="font-bold text-xs rounded-xl gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Monthly Bill (A4)</span>
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
            </div>
          </DialogFooter>

          {/* DEDICATED A4 PRINTABLE RECEIVABLES STATEMENT */}
          <div
            id="printable-statement"
            data-print-target="true"
            className="printable-document hidden print:block font-sans text-black p-4 space-y-3 bg-white"
          >
            {/* Header */}
            <PrintHeader
              title="Customer Consignment & Receivable Statement"
              documentNumber={selectedCustomer?.customerId}
              station={selectedCustomer?.city || "Nationwide"}
            />

            {/* Customer Information Block */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase text-blue-900 border-b border-slate-200 pb-1 mb-2">
                Customer Receivable Profile
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Client / Account</span>
                  <span className="font-bold text-slate-900">{selectedCustomer?.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Firm / Business</span>
                  <span className="font-bold text-slate-900">{selectedCustomer?.companyName || "Commercial Freight Client"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Phone Contact</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCustomer?.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Terminal Hub / City</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer?.city || "Nationwide"}</span>
                </div>
              </div>
            </div>

            {/* Receivables Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Total Invoiced Freight</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(selectedCustomer?.totalInvoicedAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Settled / Paid Advance</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(selectedCustomer?.totalPaidAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-red-600 block">Outstanding Receivable</span>
                <span className="text-sm font-black text-red-700">
                  {formatCurrency(selectedCustomer?.totalOutstandingBalance || 0)}
                </span>
              </div>
            </div>

            {/* Bilty Breakdown Table - 100% fixed auto-fit */}
            <div className="w-full overflow-hidden">
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Consignment Bilty Itemized Ledger Breakdown
              </p>
              <table
                className="w-full border-collapse border border-black text-[9px] table-fixed"
                style={{ width: "100%", tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100 text-black font-bold text-center">
                    <th className="border border-black p-1">Bilty #</th>
                    <th className="border border-black p-1">Date</th>
                    <th className="border border-black p-1 text-left">Receiver & Route</th>
                    <th className="border border-black p-1 text-right">Freight</th>
                    <th className="border border-black p-1 text-right">Paid</th>
                    <th className="border border-black p-1 text-right font-black text-red-700">Balance</th>
                    <th className="border border-black p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCustomer?.bilties || []).slice(0, 8).map((b: any, i: number) => (
                    <tr key={b.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-black p-1 font-mono font-bold text-red-700 truncate">
                        {b.biltyNumber}
                        <div className="text-[8px] text-slate-500 font-normal truncate">{b.trackingId}</div>
                      </td>
                      <td className="border border-black p-1 text-center whitespace-nowrap font-mono truncate">{formatDate(b.date)}</td>
                      <td className="border border-black p-1 truncate">
                        <div className="font-semibold text-slate-900 truncate">{b.receiverName}</div>
                        <div className="text-[8px] text-slate-500 truncate">{b.origin} &rarr; {b.destination}</div>
                      </td>
                      <td className="border border-black p-1 text-right font-medium font-mono truncate">{formatCurrency(b.totalAmount)}</td>
                      <td className="border border-black p-1 text-right font-semibold text-emerald-700 font-mono truncate">{formatCurrency(b.paidAmount)}</td>
                      <td className="border border-black p-1 text-right font-black text-red-700 font-mono truncate">{formatCurrency(b.remainingBalance)}</td>
                      <td className="border border-black p-1 text-center font-bold uppercase text-[8.5px] truncate">{b.paymentStatus}</td>
                    </tr>
                  ))}
                  {(selectedCustomer?.bilties?.length || 0) > 8 && (
                    <tr className="bg-slate-50 text-[8.5px] text-slate-600 italic font-medium">
                      <td colSpan={7} className="border border-black p-1 text-center">
                        (+ {(selectedCustomer?.bilties?.length || 0) - 8} additional bilties recorded in SPD Portal)
                      </td>
                    </tr>
                  )}
                  {(!selectedCustomer?.bilties || selectedCustomer?.bilties?.length === 0) && (
                    <tr>
                      <td colSpan={7} className="border border-black p-3 text-center text-slate-400 italic">
                        No bilties recorded for this customer yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Row */}
            <PrintFooter
              notes="This customer account statement itemizes all commercial consignments, settled payments, and outstanding balances on record with SPD Logistics."
              preparedByLabel="Prepared By"
              checkedByLabel="Checked By"
              authorizedLabel="Authorized Signature"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Customer Ledger / Payment History */}
      <Dialog open={viewLedgerOpen} onOpenChange={setViewLedgerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Payment History — {selectedCustomer?.customerName}
            </DialogTitle>
            <DialogDescription>
              Record of payments and receipts for {selectedCustomer?.customerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {(!selectedCustomer?.payments || selectedCustomer.payments.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground border rounded-xl">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-semibold text-sm">No recorded payments found</p>
                <p className="text-xs">Payments recorded against this customer will appear here.</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.payments.map((p) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell className="font-mono font-medium">{p.reference || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {p.paymentMethod || "CASH"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.notes || "—"}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter className="shrink-0 border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewLedgerOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCustomer) {
                      setMonthlyBillCustomer({
                        id: selectedCustomer.customerId,
                        name: selectedCustomer.customerName,
                        companyName: selectedCustomer.companyName,
                        phone: selectedCustomer.phone,
                        city: selectedCustomer.city,
                      });
                    }
                  }}
                  className="font-bold text-xs rounded-xl gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Monthly Bill (A4)</span>
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
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Record Payment Modal */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-spd-red" />
              <span>Record Customer Payment</span>
            </DialogTitle>
            <DialogDescription>
              Record a cash or bank payment for {selectedCustomer?.customerName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            {paymentErrorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{paymentErrorMsg}</span>
              </div>
            )}

            {paymentSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Invoiced / Freight:</span>
                <span className="font-semibold">{formatCurrency(selectedCustomer?.totalInvoicedAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previously Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(selectedCustomer?.totalPaidAmount || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                <span className="font-bold text-foreground">Total Outstanding Balance:</span>
                <span className="font-black text-spd-red text-sm">
                  {formatCurrency(paymentBiltyId ? (selectedCustomer?.bilties.find((b) => b.id === paymentBiltyId)?.remainingBalance || 0) : (selectedCustomer?.totalOutstandingBalance || 0))}
                </span>
              </div>
              {paymentBiltyId && (
                <div className="flex justify-between text-[11px] pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-muted-foreground">Settling Linked Bilty:</span>
                  <span className="font-mono font-bold text-spd-blue">
                    #{selectedCustomer?.bilties.find((b) => b.id === paymentBiltyId)?.biltyNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payAmount" className="text-xs font-bold uppercase tracking-wider">
                Payment Amount (PKR) *
              </Label>
              <Input
                id="payAmount"
                type="number"
                step="any"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="h-11 rounded-xl text-base font-bold focus-visible:ring-spd-red"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payMethod" className="text-xs font-bold uppercase tracking-wider">
                  Payment Method
                </Label>
                <select
                  id="payMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-11 px-3 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-spd-red"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online Portal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cashBook" className="text-xs font-bold uppercase tracking-wider">
                  Deposit Cash Book
                </Label>
                <select
                  id="cashBook"
                  value={selectedCashBookId}
                  onChange={(e) => setSelectedCashBookId(e.target.value)}
                  className="w-full h-11 px-3 bg-background border border-input rounded-xl text-xs font-medium focus:ring-2 focus:ring-spd-red"
                >
                  <option value="">No Cash Book (Direct)</option>
                  {cashBooks.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name} ({cb.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payRef" className="text-xs font-bold uppercase tracking-wider">
                Reference / Receipt #
              </Label>
              <Input
                id="payRef"
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="REC-00123"
                className="h-11 rounded-xl text-xs focus-visible:ring-spd-red font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payNotes" className="text-xs font-bold uppercase tracking-wider">
                Notes / Memo
              </Label>
              <Input
                id="payNotes"
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Advance payment / Balance clearance"
                className="h-11 rounded-xl text-xs focus-visible:ring-spd-red"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecordPaymentOpen(false)}
                disabled={submittingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPayment}
                className="bg-spd-red hover:bg-red-700 text-white font-bold gap-2"
              >
                {submittingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CUSTOMER MONTHLY FREIGHT BILL STATEMENT (A4 & EXCEL) */}
      <MonthlyBillStatementModal
        customer={monthlyBillCustomer}
        isOpen={!!monthlyBillCustomer}
        onClose={() => setMonthlyBillCustomer(null)}
      />
    </div>
  );
}
