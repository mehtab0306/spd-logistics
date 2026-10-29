"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  UserCog,
  Truck,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect, SearchableOption } from "@/components/shared/searchable-select";
import {
  getStoredDrivers,
  saveStoredDriver,
  getStoredVehicles,
  getDeletedVehicleIds,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { supabase, isSupabaseConfigured, safeUpsertDriver } from "@/lib/supabase";

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    cnic: "",
    licenseNumber: "",
    licenseExpiry: "",
    address: "",
    emergencyContact: "",
    assignedVehicleId: "",
    vehicleNumber: "",
    status: "AVAILABLE",
    photo: "",
    notes: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoRemoved, setPhotoRemoved] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch vehicles
        let apiVehicles: any[] = [];
        try {
          const vRes = await fetch("/api/admin/vehicles");
          const vData = await vRes.json();
          if (vData.success && Array.isArray(vData.data)) {
            apiVehicles = vData.data;
          }
        } catch {}
        setVehicles(mergeLocalWithApi(getStoredVehicles(), apiVehicles, getDeletedVehicleIds(), "registrationNumber"));

        // Fetch driver from local storage first, then API
        let found: any = getStoredDrivers().find((d: any) => String(d.id) === String(driverId));

        if (!found) {
          try {
            const res = await fetch(`/api/admin/drivers?id=${driverId}`);
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
            phone: found.phone || found.contact || "",
            cnic: found.cnic || "",
            licenseNumber: found.licenseNumber || "",
            licenseExpiry: found.licenseExpiry ? found.licenseExpiry.slice(0, 10) : "",
            address: found.address || "",
            emergencyContact: found.emergencyContact || "",
            assignedVehicleId: found.assignedVehicleId || "",
            vehicleNumber: found.vehicleNumber || "",
            status: found.status || "AVAILABLE",
            photo: photoUrl,
            notes: found.notes || "",
          });
          setPhotoPreview(photoUrl);
        } else {
          setFormError("Driver record not found.");
        }
      } catch (err: any) {
        setFormError(err.message || "Failed to load driver details");
      } finally {
        setLoading(false);
      }
    };

    if (driverId) fetchData();
  }, [driverId]);

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
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `driver-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        } else {
          console.warn("Supabase driver avatar upload error:", uploadError);
        }
      } catch (err) {
        console.warn("Supabase driver avatar upload fallback:", err);
      }
    }
    return "";
  };

  const vehicleOptions: SearchableOption[] = vehicles.map((v) => ({
    value: v.id,
    label: v.vehicleNumber || v.registrationNumber || "Truck",
    subLabel: `${v.vehicleType || v.type || "Truck"} • ${v.make || ""} ${v.model || ""}`.trim(),
    meta: v,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      console.log("[EditDriver] Validation warning: Driver name missing");
      setFormError("Driver name is required.");
      setSubmitting(false);
      return;
    }
    if (!formData.phone.trim()) {
      console.log("[EditDriver] Validation warning: Contact phone missing");
      setFormError("Contact phone number is required.");
      setSubmitting(false);
      return;
    }

    try {
      let finalPhotoUrl = formData.photo;
      if (photoRemoved) {
        finalPhotoUrl = "";
      } else if (photoFile) {
        finalPhotoUrl = await handleUploadPhoto(photoFile);
      }

      const payload = {
        ...formData,
        id: driverId,
        photo: finalPhotoUrl || null,
      };

      // Immediately update localStorage
      saveStoredDriver(payload);

      // Supabase cloud direct update
      if (isSupabaseConfigured) {
        try {
          await safeUpsertDriver({
            id: driverId,
            name: payload.name,
            phone: payload.phone || null,
            cnic: payload.cnic || null,
            license_number: payload.licenseNumber || null,
            vehicle_number: payload.vehicleNumber || null,
            status: payload.status || "Active",
            avatar_url: finalPhotoUrl || null,
          });
        } catch (sbErr) {
          console.warn("Supabase driver update warning:", sbErr);
        }
      }

      try {
        await fetch("/api/admin/drivers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}

      setSuccessMessage(`Record updated successfully! Driver ${formData.name} saved.`);
      setTimeout(() => {
        router.push(`/admin/drivers?highlight=${driverId}`);
      }, 900);
    } catch (err: any) {
      setFormError(err.message || "Failed to update driver.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-spd-red" />
        <p className="text-xs font-semibold text-slate-500">Loading driver details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header / Breadcrumb / Back button */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/admin/drivers"
            className="inline-flex items-center gap-1.5 text-spd-blue hover:text-spd-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Drivers</span>
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">Edit Driver Profile</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Edit Driver:</span>
              <span className="text-spd-blue">{formData.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update commercial license details, duty status & vehicle assignments.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/drivers")}
            className="w-fit rounded-xl text-xs font-bold gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Drivers</span>
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
          title="Driver Profile Photograph"
          description="Upload clear passport size face photograph for ID badges"
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
                <UserCog className="w-10 h-10 text-slate-400" />
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

        {/* SECTION 2: DRIVER INFORMATION */}
        <FormSectionCard
          title="Driver Identification"
          description="Legal personal identity and operational status"
          icon={UserCog}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Driver Full Name *
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
                Contact Phone Number *
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
                CNIC Number *
              </Label>
              <Input
                required
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Duty Status
              </Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                <option value="ON_TRIP">ON_TRIP (En route on trip)</option>
                <option value="RESTING">RESTING (Off-duty rest period)</option>
                <option value="MAINTENANCE">MAINTENANCE (Assisting vehicle repair)</option>
                <option value="OFF_DUTY">OFF_DUTY (Leave / Off-duty)</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 3: LICENSE & EMERGENCY CONTACT */}
        <FormSectionCard
          title="License & Emergency Contact"
          description="Commercial driver license permits and next-of-kin contacts"
          icon={FileText}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Driving License Number *
              </Label>
              <Input
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                License Expiry Date
              </Label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Emergency Contact Phone
              </Label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </FormSectionCard>

        {/* SECTION 4: VEHICLE ASSIGNMENT */}
        <FormSectionCard
          title="Vehicle Assignment"
          description="Select existing fleet vehicle to assign to this driver"
          icon={Truck}
        >
          <div className="space-y-1.5 max-w-xl">
            <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Assigned Vehicle (Searchable Dropdown)
            </Label>
            <SearchableSelect
              options={vehicleOptions}
              value={formData.assignedVehicleId}
              onChange={(val, meta) => {
                setFormData({
                  ...formData,
                  assignedVehicleId: val,
                  vehicleNumber: meta?.vehicleNumber || "",
                });
              }}
              emptyMessage="No vehicles available in database."
            />
            {formData.vehicleNumber && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                Assigned: {formData.vehicleNumber}
              </p>
            )}
          </div>
        </FormSectionCard>

        {/* SECTION 5: ADDRESS & NOTES */}
        <FormSectionCard
          title="Address & Operational Notes"
          description="Permanent residential address and special notes"
          icon={MapPin}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Permanent Address
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Operational / Medical Notes
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
            onClick={() => router.push("/admin/drivers")}
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
