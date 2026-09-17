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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReceivable | null>(null);
  const [viewBiltiesOpen, setViewBiltiesOpen] = useState(false);
  const [viewLedgerOpen, setViewLedgerOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<string>("");
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
        setCustomers(data.data.customers || []);
        setSummary(data.data.summary || {});
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
      ? customer.bilties.find((b) => b.id === biltyId)?.remainingBalance || ""
      : customer.totalOutstandingBalance;
    setPaymentAmount(defaultAmount ? String(defaultAmount) : "");
    setPaymentReference(`REC-${Date.now().toString().slice(-6)}`);
    setPaymentNotes("");
    setPaymentSuccessMsg("");
    setPaymentErrorMsg("");
    setRecordPaymentOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      setPaymentErrorMsg("Please enter a valid payment amount");
      return;
    }

    try {
      setSubmittingPayment(true);
      setPaymentErrorMsg("");
      const res = await fetch("/api/admin/receivables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.customerId,
          consignmentId: paymentBiltyId || undefined,
          amount: num,
          paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
          cashBookId: selectedCashBookId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      setPaymentSuccessMsg("Payment recorded successfully! Balance updated.");
      window.dispatchEvent(new CustomEvent("spd-notifications-updated"));
      setTimeout(() => {
        setRecordPaymentOpen(false);
        fetchData();
      }, 1000);
    } catch (err: any) {
      setPaymentErrorMsg(err.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = [
      "Customer Name",
      "Company",
      "Phone",
      "City",
      "Total Bilties",
      "Total Invoiced (PKR)",
      "Total Paid (PKR)",
      "Outstanding Balance (PKR)",
      "Payment Status",
    ];

    const rows = customers.map((c) => [
      `"${c.customerName}"`,
      `"${c.companyName || ""}"`,
      `"${c.phone}"`,
      `"${c.city}"`,
      c.totalBiltiesCount,
      c.totalInvoicedAmount,
      c.totalPaidAmount,
      c.totalOutstandingBalance,
      c.paymentStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spd_receivables_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="bg-spd-blue hover:bg-blue-800 text-white gap-1.5">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">SPD LOGISTICS — RECEIVABLES REPORT</h2>
        <p className="text-sm text-gray-500">Super Pak Data Goods Transport Co. | Generated on {new Date().toLocaleDateString("en-PK")}</p>
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
          title="No receivables found"
          description="Customer receivables will appear automatically when bilties are booked."
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
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
                          Ledger
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

      {/* DIALOG 1: Bilty-Wise Breakdown */}
      <Dialog open={viewBiltiesOpen} onOpenChange={setViewBiltiesOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl font-bold">
              <span>Bilty Breakdown — {selectedCustomer?.customerName}</span>
              <Badge variant="outline" className="text-xs">
                {selectedCustomer?.bilties.length || 0} Bilties
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Detailed consignment breakdown and outstanding balances for {selectedCustomer?.customerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
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

            <div className="border rounded-xl overflow-hidden">
              <Table>
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

            <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Customer Outstanding:</span>
                <span className="font-bold text-spd-red">
                  {formatCurrency(selectedCustomer?.totalOutstandingBalance || 0)}
                </span>
              </div>
              {paymentBiltyId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Bilty:</span>
                  <span className="font-semibold text-foreground">
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
    </div>
  );
}
