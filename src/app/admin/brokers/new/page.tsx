"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Phone,
  MessageSquare,
  Building2,
  Wallet,
} from "lucide-react";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { PAKISTAN_CITIES } from "@/lib/constants";
import { saveStoredBroker } from "@/lib/local-persistence";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { supabase, isSupabaseConfigured, safeUpsertBroker, generateUUID } from "@/lib/supabase";

export default function NewBrokerPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    whatsapp: "",
    cnic: "",
    ntn: "",
    city: "Karachi",
    commissionType: "FIXED" as "FIXED" | "PERCENTAGE",
    commissionRate: "",
    openingBalance: "",
    bankDetails: "",
    notes: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) {
      setFormError("Broker or Agency Name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setFormError("Mobile contact number is required.");
      return;
    }

    setSubmitting(true);

    try {
      const brokerId = generateUUID();
      const openBal = parseFloat(formData.openingBalance) || 0;
      const commRate = parseFloat(formData.commissionRate) || 0;

      const brokerPayload = {
        id: brokerId,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || formData.name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        cnic: formData.cnic.trim(),
        ntn: formData.ntn.trim(),
        city: formData.city,
        commissionType: formData.commissionType,
        commissionRate: commRate,
        openingBalance: openBal,
        netPayableBalance: openBal,
        bankDetails: formData.bankDetails.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
        totalTrips: 0,
        totalFreightAgreed: 0,
        totalAdvancePaid: 0,
        totalDeductions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Enforce Cloud Database Persistence
      if (isSupabaseConfigured) {
        try {
          const { success, data: sbData } = await safeUpsertBroker({
            name: brokerPayload.name,
            phone: brokerPayload.phone || null,
            company_name: brokerPayload.contactPerson || brokerPayload.name,
            city: brokerPayload.city || "Karachi",
            balance: openBal,
            status: brokerPayload.status || "ACTIVE",
            created_at: brokerPayload.createdAt,
          });
          if (success && sbData?.id) {
            brokerPayload.id = sbData.id;
          }
        } catch (sbErr) {
          console.warn("Supabase broker write warning:", sbErr);
        }
      }

      // 2. Immediately save to local dual-persistence store
      saveStoredBroker(brokerPayload);

      // 2. Sync to centralized server store in background
      try {
        await fetch("/api/admin/brokers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brokerPayload),
        });
      } catch (apiErr) {
        console.warn("Background API broker registration fallback:", apiErr);
      }

      setFormSuccess("Record created successfully!");
      setTimeout(() => {
        router.push(`/admin/brokers?highlight=${brokerId}`);
      }, 600);
    } catch (err: any) {
      setFormError(err.message || "Failed to register broker.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = formData.phone
    ? buildWhatsAppUrl(
        formData.whatsapp || formData.phone,
        `Assalam-o-Alaikum ${formData.contactPerson || formData.name}, SPD Logistics Pakistan here regarding fleet partnership.`
      )
    : null;

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
              <span className="text-xs font-bold text-spd-blue">Brokers</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Handshake className="w-6 h-6 text-spd-blue" />
              Add New Broker / Commission Agent
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
            form="new-broker-form"
            disabled={submitting}
            className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Broker</span>
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

      <form id="new-broker-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Broker & Agency Identification */}
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
              WhatsApp Number (Optional)
            </Label>
            <Input
              placeholder=""
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="rounded-xl h-10 text-xs font-mono"
            />
          </div>
        </FormSectionCard>

        {/* Section 2: Financial Terms & Commission Structure */}
        <FormSectionCard
          title="Commission Rates & Ledger Opening Balance"
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
              Default Commission Rate {formData.commissionType === "PERCENTAGE" ? "(%)" : "(₨)"}
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
            <p className="text-[10px] text-slate-400">
              Enter positive value for balance payable to broker; 0 for fresh account.
            </p>
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

        {/* Section 3: Legal & Banking Details */}
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
              Operational Notes / Fleet Categories Provided
            </Label>
            <Input
              placeholder=""
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </FormSectionCard>

        {/* Submit Actions */}
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
            <span>Save Broker Profile</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
