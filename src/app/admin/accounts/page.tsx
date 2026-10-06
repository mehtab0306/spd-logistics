"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Printer,
  Eye,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  Building2,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  FileText,
  CreditCard,
  Phone,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";

// LocalStorage Keys for complete system-wide cross-module sync
const LOCAL_ACCOUNTS_KEY = "spd_local_accounts";
const LOCAL_ACCOUNT_TXS_KEY = "spd_local_account_transactions";
const LOCAL_BILTIES_KEY = "spd_local_bilties";
const LOCAL_CASH_TXS_KEY = "spd_local_cash_txs";
const LOCAL_RECEIVABLES_PAYMENTS_KEY = "spd_local_receivables_payments";
const LOCAL_CUSTOMERS_KEY = "spd_local_customers";

interface Transaction {
  id: string;
  date: string;
  voucherNumber?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  source?: "OPENING" | "BILTY" | "CASH_BOOK" | "RECEIVABLES" | "MANUAL";
}

interface AccountItem {
  id: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  openingBalance: number;
  status: string;
  notes?: string;
  customerId?: string;
  customer?: {
    id?: string;
    name?: string;
    companyName?: string;
    city?: string;
    phone?: string;
    warehouse?: string;
  };
  transactions: Transaction[];
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const { highlightClass } = useSmartHighlight(accounts);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("ALL"); // ALL, WITH_BALANCE, ZERO_BALANCE, CREDIT_BALANCE
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [viewLedgerAccount, setViewLedgerAccount] = useState<AccountItem | null>(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [addVoucherOpen, setAddVoucherOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New Account Form State
  const [newAccountData, setNewAccountData] = useState({
    accountName: "",
    accountNumber: "",
    accountType: "CORPORATE_CLIENT",
    openingBalance: "0",
    customerId: "",
    notes: "",
  });

  // New Voucher / Transaction Form State
  const [newVoucherData, setNewVoucherData] = useState({
    accountId: "",
    type: "CREDIT", // DEBIT (Freight / Charge) or CREDIT (Payment / Received)
    date: new Date().toISOString().slice(0, 10),
    voucherNumber: "",
    amount: "",
    paymentMethod: "CASH",
    reference: "",
    description: "",
    notes: "",
  });

  // Modal-Specific Quick Payment Form State
  const [quickPaymentData, setQuickPaymentData] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: "CREDIT", // CREDIT (Payment) or DEBIT (Freight Adjustment)
    paymentMethod: "CASH",
    reference: "",
    description: "Received Payment / Settlement",
    notes: "",
  });

  // Load and merge accounts from API and LocalStorage
  const loadAccountsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch base accounts from API
      let baseAccounts: any[] = [];
      try {
        const res = await fetch("/api/admin/accounts");
        if (res.ok) {
          const json = await res.json();
          if (json.accounts && json.accounts.length > 0) {
            baseAccounts = json.accounts;
          }
        }
      } catch (err) {
        console.warn("API accounts fetch failed:", err);
      }

      // 2. Fetch customers list for quick select
      let custList: any[] = [];
      try {
        const cRes = await fetch("/api/admin/customers");
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson.customers) custList = cJson.customers;
        }
      } catch {}

      // Check local customers
      try {
        const localCustRaw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
        if (localCustRaw) {
          const localCusts = JSON.parse(localCustRaw);
          for (const lc of localCusts) {
            if (!custList.some((c) => c.id === lc.id)) {
              custList.push(lc);
            }
          }
        }
      } catch {}
      setCustomers(custList);

      // 3. Read LocalStorage accounts
      let localAccounts: any[] = [];
      try {
        const rawAcc = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
        if (rawAcc) localAccounts = JSON.parse(rawAcc);
      } catch {}

      // Combine base and local accounts
      const allAccMap = new Map<string, any>();
      for (const a of baseAccounts) allAccMap.set(a.id, a);
      for (const la of localAccounts) allAccMap.set(la.id, { ...allAccMap.get(la.id), ...la });

      let combinedAccounts = Array.from(allAccMap.values());

      // 4. Load sync sources: Bilties, Cash Transactions, Receivables Payments, Manual Account Txs
      let localBilties: any[] = [];
      try {
        const rawB = localStorage.getItem(LOCAL_BILTIES_KEY);
        if (rawB) localBilties = JSON.parse(rawB);
      } catch {}

      let localCashTxs: any[] = [];
      try {
        const rawC = localStorage.getItem(LOCAL_CASH_TXS_KEY);
        if (rawC) localCashTxs = JSON.parse(rawC);
      } catch {}

      let localReceivables: any[] = [];
      try {
        const rawR = localStorage.getItem(LOCAL_RECEIVABLES_PAYMENTS_KEY);
        if (rawR) localReceivables = JSON.parse(rawR);
      } catch {}

      let manualTxs: any[] = [];
      try {
        const rawM = localStorage.getItem(LOCAL_ACCOUNT_TXS_KEY);
        if (rawM) manualTxs = JSON.parse(rawM);
      } catch {}

      // 5. Build dynamic ledger transactions and calculate accurate running balance for each account
      const processed: AccountItem[] = combinedAccounts.map((acc) => {
        const txList: Transaction[] = [];
        let runningBalance = Number(acc.openingBalance) || 0;

        // Opening balance entry
        if (runningBalance !== 0) {
          txList.push({
            id: `tx-open-${acc.id}`,
            date: "2026-01-01T00:00:00.000Z",
            voucherNumber: "OB-001",
            description: "Opening Balance Brought Forward",
            debit: runningBalance > 0 ? runningBalance : 0,
            credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
            balance: runningBalance,
            paymentMethod: "LEDGER_OPENING",
            source: "OPENING",
          });
        }

        // Associated customer matching identifiers
        const accNameNorm = (acc.accountName || "").toLowerCase().trim();
        const custNameNorm = (acc.customer?.name || "").toLowerCase().trim();
        const custCompNorm = (acc.customer?.companyName || "").toLowerCase().trim();
        const custId = acc.customerId || acc.customer?.id;

        // A. Post newly generated and local bilties as DEBIT entries (Freight billed)
        const matchedBilties = localBilties.filter((b: any) => {
          const bCustId = b.customerId && b.customerId === custId;
          const sMatch =
            (custNameNorm && b.senderName?.toLowerCase().includes(custNameNorm)) ||
            (custCompNorm && b.senderName?.toLowerCase().includes(custCompNorm)) ||
            (accNameNorm && b.senderName?.toLowerCase().includes(accNameNorm));
          const rMatch =
            (custNameNorm && b.receiverName?.toLowerCase().includes(custNameNorm)) ||
            (custCompNorm && b.receiverName?.toLowerCase().includes(custCompNorm)) ||
            (accNameNorm && b.receiverName?.toLowerCase().includes(accNameNorm));
          return bCustId || sMatch || rMatch;
        });

        for (const b of matchedBilties) {
          const freight = Number(b.totalAmount) || 0;
          if (freight > 0) {
            runningBalance += freight;
            txList.push({
              id: `tx-bilty-deb-${b.id}`,
              date: b.date || new Date().toISOString(),
              voucherNumber: b.biltyNumber || `BL-${b.id.slice(-5)}`,
              description: `Consignment Bilty #${b.biltyNumber} (${b.origin || "Station"} to ${b.destination || "Destination"})`,
              debit: freight,
              credit: 0,
              balance: runningBalance,
              paymentMethod: "BILTY_INVOICE",
              reference: b.trackingId || b.biltyNumber,
              source: "BILTY",
            });
          }

          // If Bilty was paid advance or settled at booking, post CREDIT entry
          const advancePaid = Number(b.paidAmount) || 0;
          if (advancePaid > 0) {
            runningBalance -= advancePaid;
            txList.push({
              id: `tx-bilty-crd-${b.id}`,
              date: b.date || new Date().toISOString(),
              voucherNumber: `ADV-${b.biltyNumber}`,
              description: `Advance / Booking Payment for Bilty #${b.biltyNumber}`,
              debit: 0,
              credit: advancePaid,
              balance: runningBalance,
              paymentMethod: "CASH",
              reference: b.biltyNumber,
              source: "BILTY",
            });
          }
        }

        // B. Post Cash Books receipts as CREDIT entries (Money received from customer)
        const matchedCashTxs = localCashTxs.filter((ctx: any) => {
          if (ctx.type !== "CREDIT") return false; // Money received
          const person = (ctx.accountPerson || "").toLowerCase().trim();
          const desc = (ctx.description || "").toLowerCase().trim();
          return (
            (custNameNorm && (person.includes(custNameNorm) || desc.includes(custNameNorm))) ||
            (custCompNorm && (person.includes(custCompNorm) || desc.includes(custCompNorm))) ||
            (accNameNorm && (person.includes(accNameNorm) || desc.includes(accNameNorm)))
          );
        });

        for (const ctx of matchedCashTxs) {
          const amt = Number(ctx.amount) || 0;
          if (amt > 0) {
            runningBalance -= amt;
            txList.push({
              id: `tx-cash-${ctx.id}`,
              date: ctx.date || new Date().toISOString(),
              voucherNumber: ctx.voucherNumber || `CSH-${ctx.id.slice(-5)}`,
              description: `Cash Book Receipt: ${ctx.description || "Cash Received"} (${ctx.accountPerson || "Party"})`,
              debit: 0,
              credit: amt,
              balance: runningBalance,
              paymentMethod: ctx.paymentMethod || "CASH",
              reference: ctx.voucherNumber,
              source: "CASH_BOOK",
            });
          }
        }

        // C. Post Receivables Settlements as CREDIT entries
        const matchedReceivables = localReceivables.filter((r: any) => {
          const rCId = r.customerId && r.customerId === custId;
          const rName = (r.customerName || "").toLowerCase().trim();
          return (
            rCId ||
            (custNameNorm && rName.includes(custNameNorm)) ||
            (custCompNorm && rName.includes(custCompNorm)) ||
            (accNameNorm && rName.includes(accNameNorm))
          );
        });

        for (const r of matchedReceivables) {
          const amt = Number(r.amount) || 0;
          if (amt > 0) {
            runningBalance -= amt;
            txList.push({
              id: `tx-rec-${r.id}`,
              date: r.date || new Date().toISOString(),
              voucherNumber: r.reference || `REC-${r.id.slice(-5)}`,
              description: `Receivable Settlement via ${r.paymentMethod || "Bank"} (Ref: ${r.reference || "N/A"})`,
              debit: 0,
              credit: amt,
              balance: runningBalance,
              paymentMethod: r.paymentMethod || "ONLINE_TRANSFER",
              reference: r.reference,
              source: "RECEIVABLES",
            });
          }
        }

        // D. Post Manual Account Vouchers & Adjustments
        const matchedManual = manualTxs.filter((m: any) => m.accountId === acc.id);
        for (const m of matchedManual) {
          const deb = Number(m.debit) || 0;
          const crd = Number(m.credit) || 0;
          runningBalance = runningBalance + deb - crd;
          txList.push({
            id: `tx-man-${m.id}`,
            date: m.date || new Date().toISOString(),
            voucherNumber: m.voucherNumber || `VCH-${m.id.slice(-5)}`,
            description: m.description,
            debit: deb,
            credit: crd,
            balance: runningBalance,
            paymentMethod: m.paymentMethod || "CASH",
            reference: m.reference,
            notes: m.notes,
            source: "MANUAL",
          });
        }

        // If no dynamic transactions were added, keep initial API demo transactions
        if (txList.length === (runningBalance !== 0 ? 1 : 0) && acc.transactions && acc.transactions.length > 0) {
          let demoBal = Number(acc.openingBalance) || 0;
          for (const d of acc.transactions) {
            const deb = Number(d.debit) || 0;
            const crd = Number(d.credit) || 0;
            demoBal = demoBal + deb - crd;
            txList.push({
              id: d.id,
              date: d.date,
              voucherNumber: d.voucherNumber || "VCH",
              description: d.description,
              debit: deb,
              credit: crd,
              balance: demoBal,
              paymentMethod: d.paymentMethod,
              reference: d.reference,
              source: "MANUAL",
            });
          }
          runningBalance = demoBal;
        }

        // Sort transactions chronologically
        txList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Recalculate true running balances sequentially
        let seqBalance = 0;
        let debSum = 0;
        let crdSum = 0;
        for (const tx of txList) {
          debSum += tx.debit;
          crdSum += tx.credit;
          seqBalance = seqBalance + tx.debit - tx.credit;
          tx.balance = seqBalance;
        }

        return {
          ...acc,
          transactions: txList,
          totalDebits: debSum,
          totalCredits: crdSum,
          currentBalance: seqBalance,
        };
      });

      setAccounts(processed);

      // If view ledger modal is open, keep its state synced
      if (viewLedgerAccount) {
        const updatedCurrent = processed.find((p) => p.id === viewLedgerAccount.id);
        if (updatedCurrent) setViewLedgerAccount(updatedCurrent);
      }
    } catch (err) {
      console.error("Failed to compile accounts data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsData();

    // Listen for storage events (e.g. from Bilty creation or Cash Books in other tabs)
    const handleStorageChange = () => {
      loadAccountsData();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        search === "" ||
        acc.accountName.toLowerCase().includes(search.toLowerCase()) ||
        acc.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
        acc.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        acc.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        acc.customer?.phone?.includes(search);

      let matchBalance = true;
      if (balanceFilter === "WITH_BALANCE") {
        matchBalance = acc.currentBalance > 0;
      } else if (balanceFilter === "ZERO_BALANCE") {
        matchBalance = acc.currentBalance === 0;
      } else if (balanceFilter === "CREDIT_BALANCE") {
        matchBalance = acc.currentBalance < 0;
      }

      const matchType = typeFilter === "ALL" || acc.accountType === typeFilter;

      return matchSearch && matchBalance && matchType;
    });
  }, [accounts, search, balanceFilter, typeFilter]);

  // Overall Portfolio Statistics
  const stats = useMemo(() => {
    const totalOutstanding = accounts.reduce((sum, a) => sum + (a.currentBalance > 0 ? a.currentBalance : 0), 0);
    const totalDebits = accounts.reduce((sum, a) => sum + a.totalDebits, 0);
    const totalCredits = accounts.reduce((sum, a) => sum + a.totalCredits, 0);
    const totalWithBalance = accounts.filter((a) => a.currentBalance > 0).length;

    return { totalOutstanding, totalDebits, totalCredits, totalWithBalance };
  }, [accounts]);

  // Handle Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.accountName.trim()) {
      setFeedback({ type: "error", message: "Account Name is required." });
      return;
    }

    setSubmitting(true);
    try {
      const linkedCust = customers.find((c) => c.id === newAccountData.customerId);
      const accId = `acc-${Date.now()}`;
      const accNumber = newAccountData.accountNumber.trim() || `ACC-${Math.floor(1000 + Math.random() * 9000)}`;
      const openBal = parseFloat(newAccountData.openingBalance) || 0;

      const newAcc: AccountItem = {
        id: accId,
        accountName: newAccountData.accountName.trim(),
        accountNumber: accNumber,
        accountType: newAccountData.accountType,
        openingBalance: openBal,
        status: "ACTIVE",
        notes: newAccountData.notes,
        customerId: newAccountData.customerId || undefined,
        customer: linkedCust
          ? {
              id: linkedCust.id,
              name: linkedCust.name,
              companyName: linkedCust.companyName,
              city: linkedCust.city,
              phone: linkedCust.phone,
              warehouse: linkedCust.warehouse,
            }
          : undefined,
        transactions: [],
        totalDebits: openBal > 0 ? openBal : 0,
        totalCredits: openBal < 0 ? Math.abs(openBal) : 0,
        currentBalance: openBal,
      };

      // Save to localStorage
      const existingRaw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(newAcc);
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(existing));

      // Try API POST in background
      try {
        await fetch("/api/admin/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_account",
            ...newAcc,
          }),
        });
      } catch {}

      setFeedback({ type: "success", message: `Account "${newAcc.accountName}" successfully created!` });
      setCreateAccountOpen(false);
      setNewAccountData({
        accountName: "",
        accountNumber: "",
        accountType: "CORPORATE_CLIENT",
        openingBalance: "0",
        customerId: "",
        notes: "",
      });
      loadAccountsData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to create account" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Select Customer on Create Account
  const handleQuickSelectCustomer = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setNewAccountData((prev) => ({
        ...prev,
        customerId: cust.id,
        accountName: cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name,
        accountNumber: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
        openingBalance: cust.openingBalance ? String(cust.openingBalance) : "0",
      }));
    }
  };

  // Handle Add Voucher / General Transaction
  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherData.accountId) {
      setFeedback({ type: "error", message: "Please select an account." });
      return;
    }
    const amt = parseFloat(newVoucherData.amount);
    if (!amt || amt <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid positive amount." });
      return;
    }

    setSubmitting(true);
    try {
      const isDebit = newVoucherData.type === "DEBIT";
      const targetAcc = accounts.find((a) => a.id === newVoucherData.accountId);
      const vNumber = newVoucherData.voucherNumber.trim() || `VCH-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTx = {
        id: `tx-m-${Date.now()}`,
        accountId: newVoucherData.accountId,
        date: newVoucherData.date,
        voucherNumber: vNumber,
        description: newVoucherData.description.trim() || (isDebit ? "Freight Charge Posting" : "Received Payment"),
        debit: isDebit ? amt : 0,
        credit: !isDebit ? amt : 0,
        paymentMethod: newVoucherData.paymentMethod,
        reference: newVoucherData.reference.trim() || vNumber,
        notes: newVoucherData.notes,
      };

      // 1. Save to spd_local_account_transactions
      const existingRaw = localStorage.getItem(LOCAL_ACCOUNT_TXS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push(newTx);
      localStorage.setItem(LOCAL_ACCOUNT_TXS_KEY, JSON.stringify(existing));

      // 2. If it's a CREDIT (payment received), sync to Cash Books and Receivables!
      if (!isDebit) {
        try {
          const cashTxRaw = localStorage.getItem(LOCAL_CASH_TXS_KEY);
          const cashTxs = cashTxRaw ? JSON.parse(cashTxRaw) : [];
          cashTxs.push({
            id: `cash-sync-${Date.now()}`,
            bookId: "book-1",
            date: newTx.date,
            voucherNumber: newTx.voucherNumber,
            description: `Payment from ${targetAcc?.accountName || "Customer"} - ${newTx.description}`,
            accountPerson: targetAcc?.customer?.name || targetAcc?.accountName || "Customer",
            type: "CREDIT", // Inflow
            amount: amt,
            paymentMethod: newTx.paymentMethod,
            notes: newTx.notes,
          });
          localStorage.setItem(LOCAL_CASH_TXS_KEY, JSON.stringify(cashTxs));
        } catch {}

        try {
          const recPayRaw = localStorage.getItem(LOCAL_RECEIVABLES_PAYMENTS_KEY);
          const recPayments = recPayRaw ? JSON.parse(recPayRaw) : [];
          recPayments.push({
            id: `rec-sync-${Date.now()}`,
            customerId: targetAcc?.customerId || targetAcc?.id,
            customerName: targetAcc?.customer?.name || targetAcc?.accountName,
            amount: amt,
            paymentMethod: newTx.paymentMethod,
            reference: newTx.reference,
            date: newTx.date,
            notes: newTx.notes,
          });
          localStorage.setItem(LOCAL_RECEIVABLES_PAYMENTS_KEY, JSON.stringify(recPayments));
        } catch {}
      }

      setFeedback({ type: "success", message: `Voucher #${vNumber} posted successfully!` });
      setAddVoucherOpen(false);
      setNewVoucherData({
        accountId: "",
        type: "CREDIT",
        date: new Date().toISOString().slice(0, 10),
        voucherNumber: "",
        amount: "",
        paymentMethod: "CASH",
        reference: "",
        description: "",
        notes: "",
      });
      loadAccountsData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to post transaction" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Payment / Adjustment directly inside View Ledger Modal
  const handleAddQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewLedgerAccount) return;

    const amt = parseFloat(quickPaymentData.amount);
    if (!amt || amt <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount." });
      return;
    }

    setSubmitting(true);
    try {
      const isDebit = quickPaymentData.type === "DEBIT";
      const vNumber = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTx = {
        id: `tx-quick-${Date.now()}`,
        accountId: viewLedgerAccount.id,
        date: quickPaymentData.date,
        voucherNumber: vNumber,
        description: quickPaymentData.description.trim() || (isDebit ? "Debit Adjustment" : "Received Settlement"),
        debit: isDebit ? amt : 0,
        credit: !isDebit ? amt : 0,
        paymentMethod: quickPaymentData.paymentMethod,
        reference: quickPaymentData.reference.trim() || vNumber,
        notes: quickPaymentData.notes,
      };

      // 1. Save to account transactions
      const existingRaw = localStorage.getItem(LOCAL_ACCOUNT_TXS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push(newTx);
      localStorage.setItem(LOCAL_ACCOUNT_TXS_KEY, JSON.stringify(existing));

      // 2. Synchronize with Cash Books and Receivables if CREDIT
      if (!isDebit) {
        try {
          const cashTxRaw = localStorage.getItem(LOCAL_CASH_TXS_KEY);
          const cashTxs = cashTxRaw ? JSON.parse(cashTxRaw) : [];
          cashTxs.push({
            id: `cash-sync-${Date.now()}`,
            bookId: "book-1",
            date: newTx.date,
            voucherNumber: newTx.voucherNumber,
            description: `Payment from ${viewLedgerAccount.accountName} (${newTx.description})`,
            accountPerson: viewLedgerAccount.customer?.name || viewLedgerAccount.accountName,
            type: "CREDIT",
            amount: amt,
            paymentMethod: newTx.paymentMethod,
            notes: newTx.notes,
          });
          localStorage.setItem(LOCAL_CASH_TXS_KEY, JSON.stringify(cashTxs));
        } catch {}

        try {
          const recPayRaw = localStorage.getItem(LOCAL_RECEIVABLES_PAYMENTS_KEY);
          const recPayments = recPayRaw ? JSON.parse(recPayRaw) : [];
          recPayments.push({
            id: `rec-sync-${Date.now()}`,
            customerId: viewLedgerAccount.customerId || viewLedgerAccount.id,
            customerName: viewLedgerAccount.customer?.name || viewLedgerAccount.accountName,
            amount: amt,
            paymentMethod: newTx.paymentMethod,
            reference: newTx.reference,
            date: newTx.date,
            notes: newTx.notes,
          });
          localStorage.setItem(LOCAL_RECEIVABLES_PAYMENTS_KEY, JSON.stringify(recPayments));
        } catch {}
      }

      setFeedback({ type: "success", message: `Payment / Adjustment of ${formatCurrency(amt)} recorded!` });
      setAddPaymentOpen(false);
      setQuickPaymentData({
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        type: "CREDIT",
        paymentMethod: "CASH",
        reference: "",
        description: "Received Payment / Settlement",
        notes: "",
      });
      loadAccountsData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to record payment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Receipt className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-black text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Customer Ledgers & Accounts
            </h1>
            <Badge variant="outline" className="text-[11px] font-bold bg-blue-50 text-spd-blue border-blue-200">
              Transport ERP Ledger
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            General ledgers, automatic bilty debit postings, cash receipts, and single-page A4 statements.
          </p>
        </div>

        {/* Top Right Action Buttons & Outstanding Card */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-md border border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Outstanding Portfolio
              </p>
              <p className="text-lg font-black text-amber-400 leading-tight">
                {formatCurrency(stats.totalOutstanding)}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setAddVoucherOpen(true)}
            variant="outline"
            className="rounded-xl text-xs font-bold gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-spd-blue" />
            <span>+ Add Voucher</span>
          </Button>

          <Button
            onClick={() => setCreateAccountOpen(true)}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-2 shadow-md shadow-blue-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Account</span>
          </Button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Accounts</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-spd-blue">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {accounts.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {stats.totalWithBalance} accounts with pending balance
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-red-500">Total Billed (Debits)</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {formatCurrency(stats.totalDebits)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Bilty freight invoices & charges
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Total Paid (Credits)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(stats.totalCredits)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Cash, bank receipts & settlements
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-500">Net Portfolio Due</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(stats.totalOutstanding)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Receivable across general accounts
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by account name, ACC #, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filter by Balance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Accounts ({accounts.length})</SelectItem>
              <SelectItem value="WITH_BALANCE">With Balance ({stats.totalWithBalance})</SelectItem>
              <SelectItem value="ZERO_BALANCE">Zero / Settled (0)</SelectItem>
              <SelectItem value="CREDIT_BALANCE">Credit Balance (&lt; 0)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAccountsData}
            className="h-10 px-3 rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Refresh Ledger Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* ACCOUNTS LIST TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <Table className="min-w-[850px]">
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-xs font-bold">Account # & Name</TableHead>
              <TableHead className="text-xs font-bold">Linked Customer</TableHead>
              <TableHead className="text-xs font-bold text-right">Opening Balance</TableHead>
              <TableHead className="text-xs font-bold text-right text-red-600">Total Billed (Debits)</TableHead>
              <TableHead className="text-xs font-bold text-right text-emerald-600">Total Paid (Credits)</TableHead>
              <TableHead className="text-xs font-bold text-right">Current Running Balance</TableHead>
              <TableHead className="text-xs font-bold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-spd-blue" />
                    <span>Compiling dynamic transport accounts and ledgers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
                  <div className="space-y-1">
                    <BookOpen className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No accounts match the criteria</p>
                    <p className="text-[11px]">Try clearing your search terms or create a new ledger account above.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((a) => (
                <TableRow
                  key={a.id}
                  id={`record-${a.id}`}
                  data-record-id={a.id}
                  className={cn(
                    "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs transition-all",
                    highlightClass(a.id)
                  )}
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900 dark:text-white">{a.accountName}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono font-bold text-spd-blue border-blue-200">
                          {a.accountType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{a.accountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {a.customer?.companyName || a.customer?.name || "Independent Client"}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {a.customer?.city || "Station"} &bull; {a.customer?.phone || "No phone"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-600 dark:text-slate-300">
                    {formatCurrency(a.openingBalance)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(a.totalDebits)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(a.totalCredits)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-black text-sm ${
                        a.currentBalance > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : a.currentBalance < 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatCurrency(a.currentBalance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setViewLedgerAccount(a)}
                        className="h-7 px-3 text-xs font-bold gap-1 rounded-xl bg-spd-blue hover:bg-spd-blueHover text-white shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ledger</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewVoucherData((prev) => ({ ...prev, accountId: a.id }));
                          setAddVoucherOpen(true);
                        }}
                        className="h-7 px-2 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        title="Add Voucher for this Account"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: COMPREHENSIVE VIEW LEDGER STATEMENT & AUDIT TRAIL */}
      {/* ========================================================================= */}
      <Dialog open={!!viewLedgerAccount} onOpenChange={(open) => !open && setViewLedgerAccount(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header (Screen-only) */}
          <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                    {viewLedgerAccount?.accountName}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-spd-blue border-blue-200">
                    {viewLedgerAccount?.accountNumber}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Linked Customer: {viewLedgerAccount?.customer?.name || "General Client"} &bull; Station: {viewLedgerAccount?.customer?.city || "Station"} &bull; {viewLedgerAccount?.customer?.phone || "No phone"}
                </DialogDescription>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setAddPaymentOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Payment / Adjustment</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-spd-blue" />
                  <span>Print Statement</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Scrollable Body (Screen-only) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-2 print:hidden">
            {/* Financial Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase text-slate-400">Opening Balance</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(viewLedgerAccount?.openingBalance || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30">
                <p className="text-[10px] font-bold uppercase text-red-600">Total Billed (Debits)</p>
                <p className="text-base font-black text-red-700 dark:text-red-300 mt-0.5">
                  {formatCurrency(viewLedgerAccount?.totalDebits || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[10px] font-bold uppercase text-emerald-600">Total Paid (Credits)</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {formatCurrency(viewLedgerAccount?.totalCredits || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30">
                <p className="text-[10px] font-bold uppercase text-amber-600">Closing Running Balance</p>
                <p className="text-base font-black text-amber-700 dark:text-amber-300 mt-0.5">
                  {formatCurrency(viewLedgerAccount?.currentBalance || 0)}
                </p>
              </div>
            </div>

            {/* Itemized Transaction Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itemized General Ledger Postings ({viewLedgerAccount?.transactions?.length || 0} entries)
                </h3>
                <span className="text-[11px] text-slate-400 italic">
                  Synchronized with Bilties, Cash Books, and Receipts
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold">Date</TableHead>
                      <TableHead className="text-[11px] font-bold">Ref / Bilty #</TableHead>
                      <TableHead className="text-[11px] font-bold">Description / Particulars</TableHead>
                      <TableHead className="text-[11px] font-bold text-right text-red-600">Debit (Billed)</TableHead>
                      <TableHead className="text-[11px] font-bold text-right text-emerald-600">Credit (Paid)</TableHead>
                      <TableHead className="text-[11px] font-bold text-right">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!viewLedgerAccount?.transactions || viewLedgerAccount.transactions.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400 italic">
                          No transactions posted to this ledger yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      viewLedgerAccount.transactions.map((tx) => (
                        <TableRow key={tx.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                            {formatDate(tx.date)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-spd-blue">
                            {tx.voucherNumber || tx.reference || "N/A"}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-900 dark:text-white">
                            {formatCurrency(tx.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Footer (Screen-only) */}
          <DialogFooter className="shrink-0 border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewLedgerAccount(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl gap-2 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </Button>
          </DialogFooter>

          {/* ========================================================================= */}
          {/* DEDICATED A4 PRINTABLE ACCOUNT STATEMENT (Strict Single-Page Engine) */}
          {/* ========================================================================= */}
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
                    Commercial Customer Account Statement & General Ledger &bull; Est. 1996
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Central Terminal: Bhati Gate Transport Center, Lahore &bull; Karachi Port Terminal &bull; 0325 2024433 / 0300 2024433
                  </p>
                </div>
              </div>
              <div className="text-right border-2 border-slate-900 p-2 rounded-lg bg-slate-50">
                <p className="text-[9px] font-bold uppercase text-slate-500">STATEMENT DATE</p>
                <p className="text-xs font-black text-slate-900">
                  {new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}
                </p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                  ACC REF: {viewLedgerAccount?.accountNumber}
                </p>
              </div>
            </div>

            {/* Account Credentials Block */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase text-blue-900 border-b border-slate-200 pb-1 mb-2">
                Transport Customer Account Particulars
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Account Title</span>
                  <span className="font-bold text-slate-900">{viewLedgerAccount?.accountName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Account Code</span>
                  <span className="font-mono font-bold text-slate-900">{viewLedgerAccount?.accountNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Linked Customer</span>
                  <span className="font-bold text-slate-900">
                    {viewLedgerAccount?.customer?.name || "General Client"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Contact Phone</span>
                  <span className="font-mono font-bold text-slate-900">
                    {viewLedgerAccount?.customer?.phone || "0300 2024433"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Operating Hub</span>
                  <span className="font-semibold text-slate-800">{viewLedgerAccount?.customer?.city || "Nationwide"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Account Classification</span>
                  <span className="font-bold text-slate-900">
                    {viewLedgerAccount?.accountType?.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Opening Balance</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(viewLedgerAccount?.openingBalance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Account Status</span>
                  <span className="font-bold uppercase text-emerald-700">VERIFIED / ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Financial Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Opening Balance</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(viewLedgerAccount?.openingBalance || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-red-600 block">Total Freight Invoiced</span>
                <span className="text-sm font-black text-red-700">
                  {formatCurrency(viewLedgerAccount?.totalDebits || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Total Payments Received</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(viewLedgerAccount?.totalCredits || 0)}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-900 block">Net Balance Due</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(viewLedgerAccount?.currentBalance || 0)}
                </span>
              </div>
            </div>

            {/* Itemized Ledger Table */}
            <div>
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Itemized Transaction Ledger Postings
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-left">Ref / Voucher #</th>
                    <th className="border border-slate-300 p-1.5 text-left">Description / Particulars</th>
                    <th className="border border-slate-300 p-1.5 text-right text-red-700">Debit (Billed)</th>
                    <th className="border border-slate-300 p-1.5 text-right text-emerald-700">Credit (Paid)</th>
                    <th className="border border-slate-300 p-1.5 text-right font-black">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewLedgerAccount?.transactions || []).slice(0, 8).map((tx, i) => (
                    <tr key={tx.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-slate-300 p-1 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="border border-slate-300 p-1 font-mono font-bold text-spd-blue">
                        {tx.voucherNumber || tx.reference || "-"}
                      </td>
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
                  {(viewLedgerAccount?.transactions?.length || 0) > 8 && (
                    <tr className="bg-slate-50 text-[9px] text-slate-600 italic font-medium">
                      <td colSpan={6} className="border border-slate-300 p-1 text-center">
                        (+ {(viewLedgerAccount?.transactions?.length || 0) - 8} additional ledger entries recorded in SPD Portal)
                      </td>
                    </tr>
                  )}
                  {(!viewLedgerAccount?.transactions || viewLedgerAccount.transactions.length === 0) && (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                        No transactions on record for this account.
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
                <p className="text-[10px] text-slate-500 mt-0.5">SPD Logistics Ledger Office</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Customer Representative</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {viewLedgerAccount?.customer?.name || viewLedgerAccount?.accountName}
                </p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Chief Auditor & Stamp</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Official Stamp & Date</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NEW ACCOUNT */}
      {/* ========================================================================= */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-spd-blue">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Create Transport Ledger Account
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Open a new general ledger account for corporate or freight customers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-4 pt-2">
            {/* Quick Customer Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Quick Select Linked Customer (Optional)
              </Label>
              <Select onValueChange={handleQuickSelectCustomer}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select existing customer to auto-fill..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.name} ({c.city || "Station"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Title / Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Crescent Textile Mills (Corporate)"
                  value={newAccountData.accountName}
                  onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Number / Code
                </Label>
                <Input
                  placeholder="e.g. ACC-1005 (Auto if blank)"
                  value={newAccountData.accountNumber}
                  onChange={(e) => setNewAccountData({ ...newAccountData, accountNumber: e.target.value })}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Type
                </Label>
                <Select
                  value={newAccountData.accountType}
                  onValueChange={(val) => setNewAccountData({ ...newAccountData, accountType: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORPORATE_CLIENT">Corporate Client</SelectItem>
                    <SelectItem value="COMMERCIAL_CLIENT">Commercial Client</SelectItem>
                    <SelectItem value="FREIGHT_BROKER">Freight Broker</SelectItem>
                    <SelectItem value="VENDOR">Vendor / Fleet Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opening Balance (PKR)
                </Label>
                <Input
                  type="number"
                  placeholder="0 (Positive for receivable, negative for credit)"
                  value={newAccountData.openingBalance}
                  onChange={(e) => setNewAccountData({ ...newAccountData, openingBalance: e.target.value })}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notes & Terms
                </Label>
                <Textarea
                  placeholder="Payment credit terms, special cargo rates, branch notes..."
                  value={newAccountData.notes}
                  onChange={(e) => setNewAccountData({ ...newAccountData, notes: e.target.value })}
                  className="text-xs rounded-xl resize-none h-16"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateAccountOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD GENERAL VOUCHER / TRANSACTION */}
      {/* ========================================================================= */}
      <Dialog open={addVoucherOpen} onOpenChange={setAddVoucherOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Post Voucher / Transaction
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Post a manual debit (charge) or credit (payment) to any ledger account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddVoucher} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Account <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newVoucherData.accountId}
                onValueChange={(val) => setNewVoucherData({ ...newVoucherData, accountId: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Choose account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName} ({formatCurrency(a.currentBalance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Transaction Type
                </Label>
                <Select
                  value={newVoucherData.type}
                  onValueChange={(val) => setNewVoucherData({ ...newVoucherData, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT" className="text-emerald-600 font-bold">
                      CREDIT (Payment Received)
                    </SelectItem>
                    <SelectItem value="DEBIT" className="text-red-600 font-bold">
                      DEBIT (Freight / Charge)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  placeholder="0.00"
                  value={newVoucherData.amount}
                  onChange={(e) => setNewVoucherData({ ...newVoucherData, amount: e.target.value })}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Voucher Date
                </Label>
                <Input
                  type="date"
                  value={newVoucherData.date}
                  onChange={(e) => setNewVoucherData({ ...newVoucherData, date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Method
                </Label>
                <Select
                  value={newVoucherData.paymentMethod}
                  onValueChange={(val) => setNewVoucherData({ ...newVoucherData, paymentMethod: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Online Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque / Demand Draft</SelectItem>
                    <SelectItem value="ADJUSTMENT">Account Adjustment / Rebate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Description / Particulars
              </Label>
              <Input
                placeholder="e.g. Cheque payment clearance for Lahore consignments"
                value={newVoucherData.description}
                onChange={(e) => setNewVoucherData({ ...newVoucherData, description: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reference / Cheque #
              </Label>
              <Input
                placeholder="e.g. HBL-98421 or CHQ-1049"
                value={newVoucherData.reference}
                onChange={(e) => setNewVoucherData({ ...newVoucherData, reference: e.target.value })}
                className="h-9 text-xs rounded-xl font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddVoucherOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl"
              >
                {submitting ? "Posting..." : "Post Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: ADD QUICK PAYMENT / ADJUSTMENT (Directly from Ledger Modal) */}
      {/* ========================================================================= */}
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Add Payment / Adjustment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record an immediate credit settlement for {viewLedgerAccount?.accountName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddQuickPayment} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Type
                </Label>
                <Select
                  value={quickPaymentData.type}
                  onValueChange={(val) => setQuickPaymentData({ ...quickPaymentData, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT" className="text-emerald-600 font-bold">
                      Payment Received (Credit)
                    </SelectItem>
                    <SelectItem value="DEBIT" className="text-red-600 font-bold">
                      Charge Adjustment (Debit)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  placeholder="0.00"
                  value={quickPaymentData.amount}
                  onChange={(e) => setQuickPaymentData({ ...quickPaymentData, amount: e.target.value })}
                  className="h-9 text-xs rounded-xl font-black text-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Date
                </Label>
                <Input
                  type="date"
                  value={quickPaymentData.date}
                  onChange={(e) => setQuickPaymentData({ ...quickPaymentData, date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Mode
                </Label>
                <Select
                  value={quickPaymentData.paymentMethod}
                  onValueChange={(val) => setQuickPaymentData({ ...quickPaymentData, paymentMethod: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash in Hand</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Online Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque Clearance</SelectItem>
                    <SelectItem value="DISCOUNT">Settlement Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reference / Slip #
              </Label>
              <Input
                placeholder="e.g. Deposit Slip # or Bank Ref"
                value={quickPaymentData.reference}
                onChange={(e) => setQuickPaymentData({ ...quickPaymentData, reference: e.target.value })}
                className="h-9 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Description / Particulars
              </Label>
              <Input
                placeholder="e.g. Part payment received for August consignment bilties"
                value={quickPaymentData.description}
                onChange={(e) => setQuickPaymentData({ ...quickPaymentData, description: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddPaymentOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {submitting ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
