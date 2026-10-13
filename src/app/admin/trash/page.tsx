"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  getTrashItems,
  restoreFromTrash,
  permanentlyDeleteFromTrash,
  emptyTrash,
  TrashItem,
} from "@/lib/local-persistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RotateCcw,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Package,
  FileSpreadsheet,
  Users,
  Clock,
  ShieldAlert,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RecycleBinPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "bilty" | "challan" | "customer">("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Confirmation Modal states
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null);
  const [emptyModalOpen, setEmptyModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadItems = () => {
    const items = getTrashItems();
    setTrashItems(items);
  };

  useEffect(() => {
    loadItems();

    const handleUpdate = () => loadItems();
    window.addEventListener("spd-trash-updated", handleUpdate);
    return () => window.removeEventListener("spd-trash-updated", handleUpdate);
  }, []);

  const handleRestore = (item: TrashItem) => {
    const res = restoreFromTrash(item.id);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      loadItems();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleConfirmPurge = () => {
    if (!purgeTarget) return;
    setActionLoading(true);
    permanentlyDeleteFromTrash(purgeTarget.id);
    setFeedback({
      type: "success",
      message: `Permanently removed ${purgeTarget.title} from storage.`,
    });
    setPurgeTarget(null);
    setActionLoading(false);
    loadItems();
  };

  const handleConfirmEmpty = () => {
    setActionLoading(true);
    emptyTrash();
    setFeedback({
      type: "success",
      message: "Recycle Bin has been completely emptied.",
    });
    setEmptyModalOpen(false);
    setActionLoading(false);
    loadItems();
  };

  const filteredItems = trashItems.filter((item) => {
    if (filterType !== "ALL" && item.type !== filterType) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.party.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const biltyCount = trashItems.filter((i) => i.type === "bilty").length;
  const challanCount = trashItems.filter((i) => i.type === "challan").length;
  const customerCount = trashItems.filter((i) => i.type === "customer").length;

  const getTypeBadge = (type: TrashItem["type"]) => {
    switch (type) {
      case "bilty":
        return (
          <Badge className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800 gap-1 text-[10px]">
            <Package className="w-3 h-3" />
            <span>Bilty</span>
          </Badge>
        );
      case "challan":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1 text-[10px]">
            <FileSpreadsheet className="w-3 h-3" />
            <span>Trip Challan</span>
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1 text-[10px]">
            <Users className="w-3 h-3" />
            <span>Customer</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Recycle Bin & Recovery"
          description="Soft-delete recovery management: Restore accidentally deleted Bilties, Challan trips, and Customer records back to active service."
        />
        {trashItems.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setEmptyModalOpen(true)}
            className="rounded-xl font-bold text-xs gap-2 h-10 px-4 bg-rose-600 hover:bg-rose-700 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Recycle Bin</span>
          </Button>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border shadow-sm animate-in fade-in duration-300",
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Entity Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType("ALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              filterType === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            All Deleted ({trashItems.length})
          </button>
          <button
            onClick={() => setFilterType("bilty")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              filterType === "bilty"
                ? "bg-red-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Bilties ({biltyCount})</span>
          </button>
          <button
            onClick={() => setFilterType("challan")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              filterType === "challan"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Challans ({challanCount})</span>
          </button>
          <button
            onClick={() => setFilterType("customer")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              filterType === "customer"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customerCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search deleted records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Main Trash Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Archive className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Recycle Bin is Empty
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              No soft-deleted records match your filter. Any Bilty, Challan, or Customer deleted from active tables will appear here for immediate recovery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Record & ID</th>
                  <th className="p-4">Original Details & Route</th>
                  <th className="p-4">Deletion Date</th>
                  <th className="p-4 text-right">Recovery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => {
                  const delDate = new Date(item.deletedAt);
                  const formattedDate = !isNaN(delDate.getTime())
                    ? delDate.toLocaleString("en-PK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : item.deletedAt;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block font-mono text-sm">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          ID: {item.id}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          {item.party}
                        </span>
                        {item.amount ? (
                          <span className="text-[11px] font-mono text-emerald-600 font-bold block mt-0.5">
                            PKR {item.amount.toLocaleString()}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Restore Button */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleRestore(item)}
                            className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore / Recover</span>
                          </Button>

                          {/* 2. Permanent Delete Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setPurgeTarget(item)}
                            className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Permanently</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Delete Permanently */}
      <Dialog open={!!purgeTarget} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Confirm Permanent Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-2">
              Are you sure you want to completely erase <strong>{purgeTarget?.title}</strong>? This action cannot be undone and will permanently remove this record from all backups and local stores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPurgeTarget(null)}
              className="rounded-xl text-xs font-bold h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmPurge}
              disabled={actionLoading}
              className="rounded-xl text-xs font-bold h-9 bg-rose-600 hover:bg-rose-700"
            >
              Yes, Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Empty All Trash */}
      <Dialog open={emptyModalOpen} onOpenChange={setEmptyModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Empty Entire Recycle Bin?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-2">
              This will permanently wipe all {trashItems.length} deleted bilties, challans, and customer records. None of these items can be recovered afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmptyModalOpen(false)}
              className="rounded-xl text-xs font-bold h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmEmpty}
              disabled={actionLoading}
              className="rounded-xl text-xs font-bold h-9 bg-rose-600 hover:bg-rose-700"
            >
              Purge All Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
