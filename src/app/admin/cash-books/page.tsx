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
  AlertOctagon,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CashBooksPage() {
  const [cashBooks, setCashBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals & Delete State (Entries)
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [deleteTx, setDeleteTx] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Safe Complete Cash Book Delete & Undo States
  const [bookToDelete, setBookToDelete] = useState<any>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | null>(null);
  const [lastDeletedBook, setLastDeletedBook] = useState<{ id: string; name: string } | null>(null);
  const [deletedBooksModalOpen, setDeletedBooksModalOpen] = useState(false);
  const [deletedBooks, setDeletedBooks] = useState<any[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // New Book Form
  const [newBookData, setNewBookData] = useState({
    name: "Hammad Cash Book",
    city: "Islamabad",
    description: "Operating cash book",
    openingBalance: "0",
  });

  // New Transaction Form
  const [txData, setTxData] = useState({
    date: new Date().toISOString().slice(0, 10),
    voucherNumber: "",
    description: "",
    accountPerson: "",
    type: "CREDIT", // CREDIT = Money Received / Inflow, DEBIT = Expense / Outflow
    amount: "",
    paymentMethod: "CASH",
    notes: "",
  });

  const fetchDeletedBooks = async () => {
    try {
      setLoadingDeleted(true);
      const res = await fetch("/api/admin/cash-books?status=DELETED");
      const data = await res.json();
      if (data.success) {
        setDeletedBooks(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching deleted cash books:", err);
    } finally {
      setLoadingDeleted(false);
    }
  };

  const fetchCashBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cash-books");
      const data = await res.json();
      if (data.success) {
        const books = data.data || [];
        setCashBooks(books);
        // Select first book by default if none selected or if selected was deleted
        setSelectedBook((prev: any) => {
          if (prev && books.some((b: any) => b.id === prev.id)) {
            return prev;
          }
          if (books.length > 0) {
            fetchBookDetails(books[0].id);
            return books[0];
          }
          return null;
        });
      }
      fetchDeletedBooks();
    } catch (err) {
      console.error("Error fetching cash books:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookDetails = async (id: string) => {
    try {
      setBookLoading(true);
      const res = await fetch(`/api/admin/cash-books?cashBookId=${id}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBook(data.data);
      }
    } catch (err) {
      console.error("Error fetching book details:", err);
    } finally {
      setBookLoading(false);
    }
  };

  useEffect(() => {
    fetchCashBooks();
    fetchDeletedBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchBookDetails(selectedBook.id);
    }
  }, [search]);

  // Two-Step Delete Flow Handlers
  const handleStartDeleteBook = (book: any) => {
    setBookToDelete(book);
    setDeleteStep(1);
  };

  const handleCancelDeleteBook = () => {
    setBookToDelete(null);
    setDeleteStep(null);
  };

  const handleStep1Continue = () => {
    setDeleteStep(2);
  };

  const handleConfirmDeleteBook = async () => {
    if (!bookToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cash-books?cashBookId=${bookToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete Cash Book");
      }

      setLastDeletedBook({ id: bookToDelete.id, name: bookToDelete.name });
      setFeedbackMsg({
        type: "success",
        text: `Cash Book deleted.`,
      });
      setDeleteStep(null);
      setBookToDelete(null);

      // Refresh list
      await fetchCashBooks();
      await fetchDeletedBooks();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to delete Cash Book" });
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreBook = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTORE_BOOK",
          cashBookId: id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to restore Cash Book");
      }

      setLastDeletedBook(null);
      setFeedbackMsg({
        type: "success",
        text: `Cash Book restored successfully.`,
      });

      await fetchCashBooks();
      await fetchDeletedBooks();
      fetchBookDetails(id);
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to restore Cash Book" });
    } finally {
      setRestoringId(null);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_BOOK",
          ...newBookData,
        }),
      });
      if (res.ok) {
        setCreateBookOpen(false);
        fetchCashBooks();
      }
    } catch (err) {
      console.error("Error creating book:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    setSubmitting(true);
    const amt = parseFloat(txData.amount) || 0;
    try {
      const res = await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashBookId: selectedBook.id,
          date: txData.date,
          voucherNumber: txData.voucherNumber,
          description: txData.description,
          accountPerson: txData.accountPerson,
          debit: txData.type === "DEBIT" ? amt : 0,
          credit: txData.type === "CREDIT" ? amt : 0,
          paymentMethod: txData.paymentMethod,
          notes: txData.notes,
        }),
      });

      if (res.ok) {
        setAddTxOpen(false);
        setTxData({
          date: new Date().toISOString().slice(0, 10),
          voucherNumber: "",
          description: "",
          accountPerson: "",
          type: "CREDIT",
          amount: "",
          paymentMethod: "CASH",
          notes: "",
        });
        fetchBookDetails(selectedBook.id);
        fetchCashBooks();
      }
    } catch (err) {
      console.error("Error adding transaction:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cash-books?id=${deleteTx.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete cash book entry");
      }

      setFeedbackMsg({ type: "success", text: "Cash Book entry deleted successfully." });
      setDeleteTx(null);
      if (selectedBook?.id) {
        await fetchBookDetails(selectedBook.id);
      }
      await fetchCashBooks();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Failed to delete entry" });
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleExportCSV = () => {
    if (!selectedBook || !selectedBook.transactions || selectedBook.transactions.length === 0) return;
    const headers = ["Date", "Voucher #", "Description", "Account/Party", "Debit (Expense)", "Credit (Receipt)", "Balance", "Payment Method"];
    const rows = selectedBook.transactions.map((t: any) => [
      t.date ? t.date.slice(0, 10) : "",
      `"${t.voucherNumber || ""}"`,
      `"${t.description || ""}"`,
      `"${t.accountPerson || ""}"`,
      t.debit,
      t.credit,
      t.runningBalance,
      t.paymentMethod || "CASH",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedBook.name.replace(/\s+/g, "_")}_${selectedBook.city}_CashBook.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Cash Books & Operating Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Strictly segregated financial accounts: Hammad Cash Book Lahore & Hammad Cash Book Karachi with running balances.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => {
              fetchDeletedBooks();
              setDeletedBooksModalOpen(true);
            }}
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2"
            title="View and restore deleted cash books"
          >
            <Archive className="w-4 h-4 text-slate-500" />
            <span>Deleted Cash Books</span>
            {deletedBooks.length > 0 && (
              <span className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {deletedBooks.length}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setCreateBookOpen(true)}
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2"
          >
            <Plus className="w-4 h-4 text-spd-blue" />
            <span>Add Cash Book</span>
          </Button>
          <Button
            onClick={() => setAddTxOpen(true)}
            disabled={!selectedBook}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Cash Entry</span>
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner with Undo Option */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
            {lastDeletedBook && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestoreBook(lastDeletedBook.id)}
                className="ml-2 h-7 px-3 bg-white dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-lg gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </Button>
            )}
          </div>
          <button
            onClick={() => {
              setFeedbackMsg(null);
              setLastDeletedBook(null);
            }}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cash Book Selector Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cashBooks.map((cb) => {
          const isSelected = selectedBook?.id === cb.id;
          const isKarachi = cb.city?.toUpperCase() === "KARACHI";

          return (
            <div
              key={cb.id}
              onClick={() => fetchBookDetails(cb.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? isKarachi
                    ? "border-spd-blue bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-spd-blue/20"
                    : "border-spd-red bg-red-50/50 dark:bg-red-950/20 shadow-md ring-2 ring-spd-red/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isKarachi
                        ? "bg-blue-100 text-spd-blue dark:bg-blue-950 dark:text-blue-400"
                        : "bg-red-100 text-spd-red dark:bg-red-950 dark:text-red-400"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {cb.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">{cb.city} Office</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? isKarachi
                          ? "bg-spd-blue text-white"
                          : "bg-spd-red text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isSelected ? "ACTIVE VIEW" : "SELECT"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartDeleteBook(cb);
                    }}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title={`Delete ${cb.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(cb.currentBalance || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Entries</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {cb.transactionCount} vouchers
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Cash Book Ledger View */}
      {selectedBook && (
        <div className="space-y-4">
          {/* Ledger Banner */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedBook.city} Hub
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedBook.name} &bull; {selectedBook.city} Ledger
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedBook.description}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-800 hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Credits</p>
                <p className="text-xs font-bold text-emerald-600">{formatCurrency(selectedBook.totalCredits || 0)}</p>
              </div>
              <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-800 hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Debits</p>
                <p className="text-xs font-bold text-red-600">{formatCurrency(selectedBook.totalDebits || 0)}</p>
              </div>
              <div className="text-right pr-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Running Balance</p>
                <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(selectedBook.currentBalance || 0)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  className="rounded-xl text-xs font-bold gap-1.5"
                  title="Export Excel / CSV Report"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel / CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartDeleteBook(selectedBook)}
                  className="rounded-xl text-xs font-bold gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                  title={`Delete ${selectedBook.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Book
                </Button>
              </div>
            </div>
          </div>

          {/* Search bar inside book */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search voucher, party, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          {/* Transactions Table */}
          {bookLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
              <p className="text-xs text-slate-400 font-semibold">Calculating ledger running balances...</p>
            </div>
          ) : selectedBook.transactions?.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No cash book transactions"
              description="Record your first debit or credit entry in this cash book."
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Date & Voucher #</TableHead>
                    <TableHead className="text-xs font-bold">Description</TableHead>
                    <TableHead className="text-xs font-bold">Party / Person</TableHead>
                    <TableHead className="text-xs font-bold">Method</TableHead>
                    <TableHead className="text-xs font-bold text-red-600">Debit (Expense Out)</TableHead>
                    <TableHead className="text-xs font-bold text-emerald-600">Credit (Income In)</TableHead>
                    <TableHead className="text-xs font-bold text-right">Running Balance</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBook.transactions?.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{formatDate(t.date)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.voucherNumber || "N/A"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t.description}</p>
                        {t.notes && <p className="text-[10px] text-slate-400">{t.notes}</p>}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.accountPerson || "General"}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t.paymentMethod || "CASH"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-red-600">
                        {t.debit > 0 ? formatCurrency(t.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600">
                        {t.credit > 0 ? formatCurrency(t.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(t.runningBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTx(t)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete Cash Book Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE CASH BOOK */}
      <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-spd-red" />
              Add New Cash Book
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create an isolated operating cash book for regional stations or offices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Book Title *
              </Label>
              <Input
                required
                placeholder="e.g. Hammad Cash Book"
                value={newBookData.name}
                onChange={(e) => setNewBookData({ ...newBookData, name: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                City / Station *
              </Label>
              <Input
                required
                placeholder="e.g. Islamabad / Multan / Faisalabad"
                value={newBookData.city}
                onChange={(e) => setNewBookData({ ...newBookData, city: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Initial Opening Balance (PKR)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={newBookData.openingBalance}
                onChange={(e) => setNewBookData({ ...newBookData, openingBalance: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Description
              </Label>
              <Input
                placeholder="Operating terminal cash flow"
                value={newBookData.description}
                onChange={(e) => setNewBookData({ ...newBookData, description: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateBookOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Cash Book"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ADD TRANSACTION */}
      <Dialog open={addTxOpen} onOpenChange={setAddTxOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Record Entry in {selectedBook?.city} Cash Book
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Post an income credit (cash received) or expense debit (cash payment) to recalculate running balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTransaction} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Transaction Type
                </Label>
                <select
                  value={txData.type}
                  onChange={(e) => setTxData({ ...txData, type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="CREDIT">Credit (Cash Received / In)</option>
                  <option value="DEBIT">Debit (Payment / Out)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Amount (PKR) *
                </Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 15000"
                  value={txData.amount}
                  onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
                  className="rounded-xl h-10 text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                Description / Purpose *
              </Label>
              <Input
                required
                placeholder="e.g. Freight received for Bilty #SPD-LHR-0012 or Fuel expense"
                value={txData.description}
                onChange={(e) => setTxData({ ...txData, description: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Party / Person Name
                </Label>
                <Input
                  placeholder="e.g. Malik Traders / Driver Ali"
                  value={txData.accountPerson}
                  onChange={(e) => setTxData({ ...txData, accountPerson: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Payment Method
                </Label>
                <select
                  value={txData.paymentMethod}
                  onChange={(e) => setTxData({ ...txData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE_JAZZCASH">JazzCash / EasyPaisa</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Date
                </Label>
                <Input
                  type="date"
                  value={txData.date}
                  onChange={(e) => setTxData({ ...txData, date: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Voucher # (Optional)
                </Label>
                <Input
                  placeholder="VCH-00123"
                  value={txData.voucherNumber}
                  onChange={(e) => setTxData({ ...txData, voucherNumber: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddTxOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONFIRM DELETE CASH BOOK ENTRY */}
      <Dialog open={!!deleteTx} onOpenChange={(open) => !deleting && !open && setDeleteTx(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Cash Book Entry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Are you sure you want to delete this Cash Book entry?
              </span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1.5 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTx && formatDate(deleteTx.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Voucher #:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{deleteTx?.voucherNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTx?.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Party / Person:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTx?.accountPerson || "General"}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Amount:</span>
                  <span className={`font-black ${deleteTx?.debit > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {deleteTx?.debit > 0 ? `Debit: ${formatCurrency(deleteTx.debit)}` : `Credit: ${formatCurrency(deleteTx?.credit || 0)}`}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                Deleting this entry will remove it from the Cash Book and recalculate the running balance. Any associated commercial bilties, customer accounts, or ledger records will remain safely preserved.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTx(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteTx}
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
                  <span>Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: STEP 1 - FIRST CONFIRMATION FOR COMPLETE CASH BOOK */}
      <Dialog open={deleteStep === 1} onOpenChange={(open) => !open && handleCancelDeleteBook()}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              Are you sure you want to delete this Cash Book?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-3">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                This action will remove the Cash Book from the active list. Please confirm before continuing.
              </span>
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-2 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Book:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{bookToDelete?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Office / Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{bookToDelete?.city} Station</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatCurrency(bookToDelete?.currentBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Entries:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{bookToDelete?.transactionCount || 0} vouchers</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDeleteBook}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStep1Continue}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: STEP 2 - SECOND FINAL CONFIRMATION FOR COMPLETE CASH BOOK */}
      <Dialog open={deleteStep === 2} onOpenChange={(open) => !deleting && !open && handleCancelDeleteBook()}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-red-200 dark:border-red-950/60 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
              Confirm Cash Book Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-3">
              <span className="text-sm font-bold text-red-600 dark:text-red-400 block">
                Are you absolutely sure you want to delete this Cash Book? This action affects the complete Cash Book and its transactions.
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                The Cash Book &ldquo;{bookToDelete?.name} ({bookToDelete?.city})&rdquo; will be safely deactivated and moved to Deleted Cash Books. All historical financial entries, ledger history, and running records will be preserved and can be restored at any time.
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={handleCancelDeleteBook}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDeleteBook}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting Cash Book...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Cash Book</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: DELETED CASH BOOKS RECOVERY AREA */}
      <Dialog open={deletedBooksModalOpen} onOpenChange={setDeletedBooksModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-spd-blue shrink-0" />
              Deleted Cash Books
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Recover previously deleted Cash Books. The original Cash Book and all its historical transactions and balances will be safely restored without duplication.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingDeleted ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-spd-blue" />
                <p className="text-xs text-slate-400">Loading deleted cash books...</p>
              </div>
            ) : deletedBooks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                <p className="font-semibold">No deleted cash books</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All created cash books are currently active.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Cash Book Name</TableHead>
                      <TableHead className="text-xs font-bold">Office / Location</TableHead>
                      <TableHead className="text-xs font-bold">Deleted Date</TableHead>
                      <TableHead className="text-xs font-bold text-right">Balance</TableHead>
                      <TableHead className="text-xs font-bold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedBooks.map((cb) => (
                      <TableRow key={cb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-bold text-xs text-slate-900 dark:text-white">
                          {cb.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {cb.city} Station
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {cb.updatedAt ? formatDate(cb.updatedAt) : "Recently"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(cb.currentBalance || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={restoringId === cb.id}
                            onClick={() => handleRestoreBook(cb.id)}
                            className="bg-spd-blue hover:bg-spd-blueHover text-white rounded-lg text-xs font-bold h-8 px-3 gap-1.5 shadow-sm"
                          >
                            {restoringId === cb.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Restore</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletedBooksModalOpen(false)}
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
