"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Handshake,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { getStoredBrokers, saveStoredBroker } from "@/lib/local-persistence";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function EditBrokerPage() {
  const router = useRouter();
  const params = useParams();
  const brokerId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    cnic: "",
    ntn: "",
    city: "Lahore",
    commissionType: "FIXED" as "FIXED" | "PERCENTAGE",
    commissionRate: "",
    openingBalance: "",
    bankDetails: "",
    notes: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  useEffect(() => {
    if (brokerId) {
      loadBroker();
    }
  }, [brokerId]);

  const loadBroker = async () => {
    setLoading(true);
    // 1. Try local storage
    const localBrokers = getStoredBrokers();
    const foundLocal = localBrokers.find((b: any) => b.id === brokerId);

    if (foundLocal) {
      setFormData({
        id: foundLocal.id,
        name: foundLocal.name || "",
        contactPerson: foundLocal.contactPerson || "",
        phone: foundLocal.phone || "",
        whatsapp: foundLocal.whatsapp || "",
        cnic: foundLocal.cnic || "",
        ntn: foundLocal.ntn || "",
        city: foundLocal.city || "Lahore",
        commissionType: foundLocal.commissionType || "FIXED",
        commissionRate: foundLocal.commissionRate !== undefined ? String(foundLocal.commissionRate) : "",
        openingBalance: foundLocal.openingBalance !== undefined ? String(foundLocal.openingBalance) : "0",
        bankDetails: foundLocal.bankDetails || "",
        notes: foundLocal.notes || "",
        status: foundLocal.status || "ACTIVE",
      });
      setLoading(false);
      return;
    }

    // 2. Fallback to API
    try {
      const res = await fetch("/api/admin/brokers");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const found = result.data.find((b: any) => b.id === brokerId);
        if (found) {
          setFormData({
            id: found.id,
            name: found.name || "",
            contactPerson: found.contactPerson || "",
            phone: found.phone || "",
            whatsapp: found.whatsapp || "",
            cnic: found.cnic || "",
            ntn: found.ntn || "",
            city: found.city || "Lahore",
            commissionType: found.commissionType || "FIXED",
            commissionRate: found.commissionRate !== undefined ? String(found.commissionRate) : "",
            openingBalance: found.openingBalance !== undefined ? String(found.openingBalance) : "0",
            bankDetails: found.bankDetails || "",
            notes: found.notes || "",
            status: found.status || "ACTIVE",
          });
        } else {
          setFormError("Broker not found.");
        }
      }
    } catch (err) {
      console.error("Error fetching broker:", err);
      setFormError("Failed to load broker details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) {
      setFormError("Broker Name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setFormError("Mobile phone number is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        id: brokerId,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || formData.name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        cnic: formData.cnic.trim(),
        ntn: formData.ntn.trim(),
        city: formData.city,
        commissionType: formData.commissionType,
        commissionRate: parseFloat(formData.commissionRate) || 0,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        bankDetails: formData.bankDetails.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save immediately to local dual-persistence store
      saveStoredBroker(payload);

      // 2. Background API update
      try {
        await fetch("/api/admin/brokers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (apiErr) {
        console.warn("Background API broker update fallback:", apiErr);
      }

      setFormSuccess("Record created successfully!");
      setTimeout(() => {
        router.push(`/admin/brokers?highlight=${brokerId}`);
      }, 600);
    } catch (err: any) {
      setFormError(err.message || "Failed to update broker.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = formData.phone
    ? buildWhatsAppUrl(
        formData.whatsapp || formData.phone,
        `Assalam-o-Alaikum ${formData.contactPerson || formData.name}, SPD Logistics Pakistan here.`
      )
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-blue" />
        <p className="text-xs font-semibold text-slate-500">Loading broker details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/brokers">
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
                Fleet Management
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-spd-blue">Edit Broker</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Handshake className="w-6 h-6 text-spd-blue" />
              Edit Broker: {formData.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/brokers">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-broker-form"
            disabled={submitting}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      <form id="edit-broker-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Profile */}
        <FormSectionCard
          title="Broker / Agency Profile"
          badge="Partner Identity"
          description="Commission agent or transport agency legal name, contact person, and operational station"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Broker / Agency Name *
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
              Contact Person *
            </Label>
            <Input
              required
              placeholder=""
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Station / City *
            </Label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Mobile Phone Number *</span>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 normal-case text-[11px]"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}
            </Label>
            <Input
              required
              placeholder=""
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              WhatsApp Number
            </Label>
            <Input
              placeholder=""
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>
        </FormSectionCard>

        {/* Section 2: Financial Terms */}
        <FormSectionCard
          title="Commission Rates & Ledger Status"
          badge="Commercial Terms"
          description="Rate structure for hiring market vehicles and starting balance ledger status"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Commission Type *
            </Label>
            <select
              value={formData.commissionType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commissionType: e.target.value as "FIXED" | "PERCENTAGE",
                })
              }
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="FIXED">Fixed Amount per Trip (₨)</option>
              <option value="PERCENTAGE">Percentage of Trip Freight (%)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Commission Rate {formData.commissionType === "PERCENTAGE" ? "(%)" : "(₨)"}
            </Label>
            <Input
              type="number"
              step="any"
              placeholder=""
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Opening Balance (₨)
            </Label>
            <Input
              type="number"
              step="any"
              placeholder=""
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Partnership Status
            </Label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
              }
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ACTIVE">Active Partner</option>
              <option value="INACTIVE">Inactive / On Hold</option>
            </select>
          </div>
        </FormSectionCard>

        {/* Section 3: Legal & Banking */}
        <FormSectionCard
          title="Taxation, Bank & Payment Details"
          badge="Banking"
          description="Bank accounts for freight payments, tax registration, and notes"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              CNIC Number
            </Label>
            <Input
              placeholder=""
              value={formData.cnic}
              onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              NTN / Tax ID (Optional)
            </Label>
            <Input
              placeholder=""
              value={formData.ntn}
              onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Bank Account Details (Bank Name, Title, A/C or IBAN)
            </Label>
            <Input
              placeholder=""
              value={formData.bankDetails}
              onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              Operational Notes
            </Label>
            <Input
              placeholder=""
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/admin/brokers">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-6"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Broker Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
