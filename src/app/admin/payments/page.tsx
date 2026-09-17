"use client";

import React, { useState, useEffect } from "react";
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
import { CreditCard, Plus, Search, RefreshCw, Loader2, Wallet, Package, CheckCircle2, Download, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [consignments, setConsignments] = useState<any[]>([]);
  const [cashBooks, setCashBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    consignmentId: "",
    cashBookId: "",
    amount: "",
    type: "RECEIPT",
    paymentMethod: "CASH",
    reference: "",
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, bRes, cbRes] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/admin/bilty"),
        fetch("/api/admin/cash-books"),
      ]);
      const [cData, bData, cbData] = await Promise.all([
        cRes.json(),
        bRes.json(),
        cbRes.json(),
      ]);
      if (cData.success) setCustomers(cData.data);
      if (bData.success) setConsignments(bData.data);
      if (cbData.success) setCashBooks(cbData.data);
    } catch (err) {
      console.error("Error fetching dependencies:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchDependencies();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      setAddPaymentOpen(false);
      setFormData({
        customerId: "",
        consignmentId: "",
        cashBookId: "",
        amount: "",
        type: "RECEIPT",
        paymentMethod: "CASH",
        reference: "",
        notes: "",
      });
      fetchPayments();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Payments & Cash Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record customer freight payments, auto-update customer ledgers, bilty balances, and operating cash books.
          </p>
        </div>
        <Button
          onClick={() => setAddPaymentOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment Receipt</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-400 font-semibold">Loading payment transactions...</p>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments recorded"
          description="Record freight payments received from shippers, consignees, or customer accounts."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Date & Reference</TableHead>
                <TableHead className="text-xs font-bold">Party / Customer</TableHead>
                <TableHead className="text-xs font-bold">Linked Bilty</TableHead>
                <TableHead className="text-xs font-bold">Type & Method</TableHead>
                <TableHead className="text-xs font-bold">Amount</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <TableCell>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{formatDate(p.date)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.reference || "N/A"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p.customer?.companyName || p.customer?.name || "Walk-in Shipper"}
                    </p>
                    <p className="text-[10px] text-slate-400">{p.notes || "Freight settlement"}</p>
                  </TableCell>
                  <TableCell>
                    {p.consignment ? (
                      <span className="text-xs font-bold text-spd-blue">
                        {p.consignment.biltyNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Direct Account</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.type === "RECEIPT"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-red-100 text-spd-red dark:bg-red-950/60 dark:text-red-400"
                        }`}
                      >
                        {p.type}
                      </span>
                      <p className="text-[10px] text-slate-400">{p.paymentMethod}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-black text-slate-900 dark:text-white">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {p.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Record Payment Receipt
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record cash, bank transfer, or cheque receipt. Auto-updates bilty balance and customer ledger.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Customer Account
              </Label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">-- Direct / Walk-in Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name} &bull; {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Link to Consignment Bilty (Optional)
              </Label>
              <select
                value={formData.consignmentId}
                onChange={(e) => {
                  const b = consignments.find((con) => con.id === e.target.value);
                  setFormData({
                    ...formData,
                    consignmentId: e.target.value,
                    amount: b && b.remainingBalance > 0 ? b.remainingBalance.toString() : formData.amount,
                  });
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">-- General Account Payment --</option>
                {consignments.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.biltyNumber} &bull; Bal: {formatCurrency(b.remainingBalance)} ({b.origin} &rarr; {b.destination})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Post to Cash Book (Optional)
              </Label>
              <select
                value={formData.cashBookId}
                onChange={(e) => setFormData({ ...formData, cashBookId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">-- Do Not Post To Cash Book --</option>
                {cashBooks.map((cb) => (
                  <option key={cb.id} value={cb.id}>
                    {cb.name} &bull; {cb.city} Hub
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-emerald-600">
                  Amount Received (PKR) *
                </Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 25000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="rounded-xl h-10 text-xs font-black border-emerald-200 dark:border-emerald-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Payment Method
                </Label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE_JAZZCASH">JazzCash / EasyPaisa</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Reference # / Notes
              </Label>
              <Input
                placeholder="Bank receipt # or deposit slip"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddPaymentOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
