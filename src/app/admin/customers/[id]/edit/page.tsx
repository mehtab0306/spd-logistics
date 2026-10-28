"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  CreditCard,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { getStoredCustomers, saveStoredCustomer } from "@/lib/local-persistence";
import { LogisticsFormSkeleton } from "@/components/shared/logistics-loader";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    companyName: "",
    phone: "",
    whatsapp: "",
    email: "",
    cnic: "",
    businessRef: "",
    address: "",
    city: "Lahore",
    warehouse: "LAHORE",
    creditLimit: "",
    photo: "",
    notes: "",
    status: "ACTIVE",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoRemoved, setPhotoRemoved] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!customerId) return;

    const fetchCustomer = async () => {
      try {
        setLoading(true);
        let found: any = null;

        // Check local storage first so local edits/creations take precedence
        const localList = getStoredCustomers();
        found = localList.find((c: any) => String(c.id) === String(customerId));

        // Try API if not found locally
        if (!found) {
          try {
            const res = await fetch(`/api/admin/customers?id=${customerId}`);
            const data = await res.json();
            if (data.success && data.data) {
              found = data.data;
            }
          } catch {}
        }

        if (found) {
          const photoUrl = found.photo || found.user?.avatar || "";
          setFormData({
            id: found.id,
            name: found.name || "",
            companyName: found.companyName || "",
            phone: found.phone || "",
            whatsapp: found.whatsapp || "",
            email: found.email || found.user?.email || "",
            cnic: found.cnic || "",
            businessRef: found.businessRef || "",
            address: found.address || "",
            city: found.city || "Lahore",
            warehouse: found.warehouse || "LAHORE",
            creditLimit: found.creditLimit !== undefined && found.creditLimit !== null ? String(found.creditLimit) : "",
            photo: photoUrl,
            notes: found.notes || "",
            status: found.status || "ACTIVE",
          });
          setPhotoPreview(photoUrl);
        } else {
          setFormError("Customer not found.");
        }
      } catch (err: any) {
        setFormError(err.message || "Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

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

    if (submitting) return;

    if (!formData.name.trim()) {
      console.log("[EditCustomer] Validation warning: Customer name is missing");
      setFormError("Customer name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      console.log("[EditCustomer] Validation warning: Phone number is missing");
      setFormError("Phone number is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      let finalPhotoUrl = formData.photo;
      if (photoRemoved) {
        finalPhotoUrl = "";
      } else if (photoFile) {
        finalPhotoUrl = await handleUploadPhoto(photoFile);
      }

      const credLim = parseFloat(formData.creditLimit) || 0;
      const payload = {
        ...formData,
        id: customerId,
        creditLimit: credLim,
        photo: finalPhotoUrl || null,
      };

      // Immediately update local storage
      saveStoredCustomer(payload);

      // API call wrapped in try/catch
      try {
        await fetch("/api/admin/customers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}

      setSuccessMessage(`Record updated successfully! Customer ${formData.name} saved.`);
      setTimeout(() => {
        router.push(`/admin/customers?highlight=${customerId}`);
      }, 900);
    } catch (err: any) {
      setFormError(err.message || "Failed to update customer.");
    } finally {
      setTimeout(() => {
        setSubmitting(false);
      }, 800);
    }
  };

  if (loading) {
    return (
      <div className="py-6 max-w-5xl mx-auto">
        <LogisticsFormSkeleton subtitle="Loading Customer & Party Account Ledger..." />
      </div>
    );
  }

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
          <span className="text-slate-700 dark:text-slate-200">Edit Customer Profile</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Edit Customer:</span>
              <span className="text-spd-blue">{formData.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update legal party details, account limits, contact information & status.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/customers")}
            className="w-fit rounded-xl text-xs font-bold gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PROFILE PHOTO */}
        <FormSectionCard
          title="Customer Profile Photo"
          description="Upload photograph or business identity stamp"
          icon={Camera}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-blue-500/40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-xs">
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
                  setPhotoRemoved(false);
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
                  <Camera className="w-4 h-4 text-spd-blue" />
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
                      setPhotoRemoved(true);
                      setFormData({ ...formData, photo: "" });
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
                Account Status
              </Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
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

            <div className="space-y-1.5 sm:col-span-2">
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
          description="Credit limits and operational billing terms"
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
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 shadow-md gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
