"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { saveStoredCustomer, getStoredCustomers } from "@/lib/local-persistence";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function NewCustomerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phone: "",
    whatsapp: "",
    email: "",
    password: "",
    cnic: "",
    businessRef: "",
    address: "",
    city: "Lahore",
    warehouse: "LAHORE",
    creditLimit: "",
    openingBalance: "0",
    photo: "",
    notes: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      return "Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit. Please choose a smaller photo.";
    }
    return null;
  };

  const handleUploadPhoto = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent concurrent / double execution
    if (submitting) return;

    if (!formData.name.trim()) {
      console.log("[NewCustomer] Validation warning: Customer name is missing");
      setFormError("Customer / Dealer Name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      console.log("[NewCustomer] Validation warning: Phone number is missing");
      setFormError("Phone number is required.");
      return;
    }

    // Client-side deduplication check before proceeding
    const normPhone = formData.phone.trim().replace(/[^0-9]/g, "");
    const normName = formData.name.trim().toLowerCase();
    const existingCust = getStoredCustomers().find((c: any) => {
      if (!c || c.status === "DELETED") return false;
      const cPhone = (c.phone || "").replace(/[^0-9]/g, "");
      const cName = (c.name || "").trim().toLowerCase();
      const phoneMatch = normPhone.length >= 7 && cPhone.length >= 7 && normPhone === cPhone;
      const nameMatch = normName.length > 1 && normName === cName;
      return phoneMatch || nameMatch;
    });

    if (existingCust) {
      setFormError(`Customer already exists with this name or phone number (${existingCust.name} - ${existingCust.phone || "N/A"}).`);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await handleUploadPhoto(photoFile);
      }

      const uniqueId = Date.now().toString();
      const timestamp = new Date().toISOString();
      const openBal = parseFloat(formData.openingBalance) || 0;
      const credLim = parseFloat(formData.creditLimit) || 0;
      const finalEmail =
        formData.email.trim() ||
        `${formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "cust"}${uniqueId.slice(-4)}@spdcustomer.com`;
      const finalPassword = formData.password.trim() || "admin";

      const newCustomerRecord = {
        id: uniqueId,
        accountId: `CUST-${uniqueId.slice(-6)}`,
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || null,
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        email: finalEmail,
        loginPassword: finalPassword,
        cnic: formData.cnic.trim() || null,
        businessRef: formData.businessRef.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || "Lahore",
        warehouse: formData.warehouse || "LAHORE",
        creditLimit: credLim,
        openingBalance: openBal,
        photo: photoUrl || null,
        notes: formData.notes.trim() || null,
        status: "ACTIVE",
        isLocal: true,
        user: {
          id: `usr_${uniqueId}`,
          email: finalEmail,
          name: formData.name.trim(),
          role: "CUSTOMER",
          status: "ACTIVE",
          avatar: photoUrl || null,
        },
        account: {
          id: `acc_${uniqueId}`,
          currentBalance: openBal,
          transactions: openBal
            ? [
                {
                  id: `tx-open-${uniqueId}`,
                  date: timestamp,
                  description: "Opening Balance Brought Forward",
                  debit: openBal > 0 ? openBal : 0,
                  credit: openBal < 0 ? Math.abs(openBal) : 0,
                  balance: openBal,
                },
              ]
            : [],
        },
        _count: { consignmentsAsCustomer: 0, payments: 0 },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 1. Immediately persist to localStorage (spd_customers & spd_local_customers)
      saveStoredCustomer(newCustomerRecord);

      // 1b. Upsert into Supabase cloud database
      if (isSupabaseConfigured) {
        try {
          await supabase.from("customers").upsert([
            {
              id: newCustomerRecord.id,
              name: newCustomerRecord.name || newCustomerRecord.companyName,
              phone: newCustomerRecord.phone,
              city: newCustomerRecord.city,
            },
          ]);
        } catch (sbErr) {
          console.warn("Supabase customer upsert warning:", sbErr);
        }
      }

      // 2. Also save portal login credentials in localStorage so /customer-login works immediately
      try {
        const credsRaw = localStorage.getItem("spd_customer_credentials");
        const creds = credsRaw ? JSON.parse(credsRaw) : [];
        creds.unshift({
          id: uniqueId,
          email: finalEmail.toLowerCase(),
          password: finalPassword,
          name: newCustomerRecord.name,
          companyName: newCustomerRecord.companyName || "Registered Dealer",
          phone: newCustomerRecord.phone,
        });
        localStorage.setItem("spd_customer_credentials", JSON.stringify(creds));
        localStorage.setItem("spd_customers_auth", JSON.stringify(creds));
      } catch (credErr) {
        console.warn("Could not save customer credentials to localStorage:", credErr);
      }

      // 3. Try sending to backend API wrapped in try/catch (do NOT rollback or throw on serverless failure)
      try {
        await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            email: finalEmail,
            password: finalPassword,
            creditLimit: credLim,
            openingBalance: openBal,
            photo: photoUrl || null,
          }),
        });
      } catch (apiErr) {
        console.warn("Serverless API fallback active — customer saved in localStorage:", apiErr);
      }

      setSuccessMessage(`Record created successfully! Customer ${newCustomerRecord.name} registered.`);
      setTimeout(() => {
        router.push(`/admin/customers?highlight=${uniqueId}`);
      }, 900);
    } catch (err: any) {
      console.error("[NewCustomer] Error:", err);
      setFormError(err.message || "Failed to create customer record.");
    } finally {
      setTimeout(() => {
        setSubmitting(false);
      }, 800);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header / Breadcrumb / Back button */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1.5 text-spd-blue hover:text-spd-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customers</span>
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">Register New Customer</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Register New Customer / Dealer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add a verified customer account, configure credit terms & create portal credentials.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/customers")}
            className="w-fit rounded-xl text-xs font-bold gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* SECTION 1: PROFILE PHOTO */}
        <FormSectionCard
          title="Customer Profile Photo"
          description="Upload photograph or business identity stamp"
          icon={Camera}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-xs">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const err = validateImageFile(file);
                  if (err) {
                    setFormError(err);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                  }
                  setFormError("");
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Camera className="w-4 h-4 text-spd-red" />
                  <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                </Button>
                {photoPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">JPG, JPEG, PNG, or WebP up to 5MB.</p>
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 2: CUSTOMER INFORMATION */}
        <FormSectionCard
          title="Customer & Business Information"
          description="Primary legal party identification details"
          icon={Building2}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Customer / Dealer Name *
              </Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Company / Firm Name
              </Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                CNIC / NTN Number
              </Label>
              <Input
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Assigned Warehouse Hub
              </Label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="LAHORE">Lahore Central Hub</option>
                <option value="KARACHI">Karachi South Hub</option>
                <option value="RAWALPINDI">Rawalpindi / Islamabad Hub</option>
                <option value="FAISALABAD">Faisalabad Hub</option>
                <option value="MULTAN">Multan Hub</option>
                <option value="PESHAWAR">Peshawar Hub</option>
                <option value="QUETTA">Quetta Hub</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                City
              </Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Business Reference / Alias
              </Label>
              <Input
                value={formData.businessRef}
                onChange={(e) => setFormData({ ...formData, businessRef: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 3: CONTACT & LOCATION */}
        <FormSectionCard
          title="Contact & Address"
          description="Direct telephone numbers and dispatch locations"
          icon={Phone}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Phone Number *
              </Label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                WhatsApp Number
              </Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Complete Office / Godown Address
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 4: FINANCIAL & ACCOUNT */}
        <FormSectionCard
          title="Account & Financial Terms"
          description="Credit parameters and opening balance allocation"
          icon={CreditCard}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Credit Limit (PKR)
              </Label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Opening Balance (PKR)
              </Label>
              <Input
                type="number"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Internal Account Notes
              </Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 5: LOGIN CREDENTIALS */}
        <FormSectionCard
          title="Customer Portal Login"
          description="Direct access credentials for customer consignment tracking & ledgers (defaults to customer@gmail.com / admin if left blank)"
          icon={Lock}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-spd-blue">
                Login Email Address
              </Label>
              <Input
                type="email"
                placeholder="customer@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl h-10 text-xs border-blue-200 dark:border-blue-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-spd-blue">
                Login Password
              </Label>
              <Input
                type="password"
                placeholder="admin"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl h-10 text-xs border-blue-200 dark:border-blue-900"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* Sticky Action Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md flex items-center justify-end gap-3 sticky bottom-4 z-30">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/customers")}
            className="rounded-xl text-xs font-semibold px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-spd-red hover:bg-spd-redHover text-white text-xs font-bold px-6 shadow-md gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            <span>{submitting ? "Registering..." : "Register Customer"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
