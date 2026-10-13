"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";

export default function NewCashBookPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    description: "",
    openingBalance: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Cash book title is required.");
      return;
    }
    if (!formData.city.trim()) {
      setFormError("City / Station is required.");
      return;
    }

    setSubmitting(true);
    const openBal = parseFloat(formData.openingBalance) || 0;
    const tempId = `cb-${Date.now()}`;
    const newBookObj = {
      id: tempId,
      name: formData.name.trim(),
      city: formData.city.trim(),
      description: formData.description.trim() || `Cash book operations for ${formData.city.trim()}`,
      openingBalance: openBal,
      totalCredits: 0,
      totalDebits: 0,
      currentBalance: openBal,
      transactionCount: 0,
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage immediately
    try {
      const stored = localStorage.getItem("spd_cash_books");
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem("spd_cash_books", JSON.stringify([...existing, newBookObj]));
    } catch {}

    try {
      await fetch("/api/admin/cash-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_BOOK",
          name: formData.name.trim(),
          city: formData.city.trim(),
          description: formData.description.trim() || `Cash book operations for ${formData.city.trim()}`,
          openingBalance: openBal,
        }),
      });
    } catch (err: any) {
      console.warn("API sync error:", err);
    } finally {
      setSubmitting(false);
      router.push("/admin/cash-books");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/cash-books">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Accounts & Ledgers
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-spd-red">New Cash Book</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-spd-red" />
              Create Regional Cash Book
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/cash-books">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="new-cashbook-form"
            disabled={submitting}
            className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Cash Book</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form id="new-cashbook-form" onSubmit={handleSubmit} className="space-y-6">
        <FormSectionCard
          title="Account Details & Station"
          badge="General"
          description="Designate an isolated cash register for a specific regional station or office"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Cash Book Title *
            </Label>
            <Input
              required
              placeholder=""
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl h-10 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              City / Station *
            </Label>
            <Input
              required
              placeholder=""
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl h-10 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Initial Opening Balance (PKR)
            </Label>
            <Input
              type="number"
              step="any"
              placeholder=""
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono font-bold"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Operational Scope / Description
            </Label>
            <Input
              placeholder=""
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/admin/cash-books">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Create Cash Book</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
