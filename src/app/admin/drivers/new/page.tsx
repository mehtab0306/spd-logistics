"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCog,
  Truck,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  CreditCard,
  Calendar,
  Lock,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSectionCard } from "@/components/shared/form-section-card";
import { SearchableSelect, SearchableOption } from "@/components/shared/searchable-select";
import {
  getStoredVehicles,
  getDeletedVehicleIds,
  saveStoredDriver,
  mergeLocalWithApi,
} from "@/lib/local-persistence";

export default function NewDriverPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingVehicles(true);
        let apiList: any[] = [];
        try {
          const res = await fetch("/api/admin/vehicles");
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            apiList = data.data;
          }
        } catch {}

        setVehicles(mergeLocalWithApi(getStoredVehicles(), apiList, getDeletedVehicleIds(), "registrationNumber"));
      } catch (err) {
        console.warn("Error fetching vehicles:", err);
        setVehicles(getStoredVehicles());
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

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
      console.log("[NewDriver] Validation warning: Driver name is missing");
      setFormError("Driver Full Name is required.");
      setSubmitting(false);
      return;
    }
    if (!formData.phone.trim()) {
      console.log("[NewDriver] Validation warning: Contact phone is missing");
      setFormError("Contact phone number is required.");
      setSubmitting(false);
      return;
    }

    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await handleUploadPhoto(photoFile);
      }

      const uniqueId = Date.now().toString();
      const timestamp = new Date().toISOString();
      const finalEmail = formData.email.trim() || "driver@gmail.com";
      const finalPassword = formData.password.trim() || "admin";
      const finalCnic = formData.cnic.trim() || "35202-0000000-0";
      const finalLicense = formData.licenseNumber.trim() || `LIC-${uniqueId.slice(-6)}`;

      const selectedVeh = vehicles.find((v) => String(v.id) === String(formData.assignedVehicleId));
      const finalVehicleNumber =
        formData.vehicleNumber || selectedVeh?.vehicleNumber || selectedVeh?.registrationNumber || "";

      const newDriverRecord = {
        id: uniqueId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: finalEmail,
        loginPassword: finalPassword,
        cnic: finalCnic,
        licenseNumber: finalLicense,
        licenseExpiry: formData.licenseExpiry || null,
        address: formData.address.trim() || null,
        emergencyContact: formData.emergencyContact.trim() || null,
        assignedVehicleId: formData.assignedVehicleId || null,
        vehicleNumber: finalVehicleNumber || null,
        status: formData.status || "AVAILABLE",
        photo: photoUrl || null,
        notes: formData.notes.trim() || null,
        isLocal: true,
        user: {
          id: `usr_${uniqueId}`,
          email: finalEmail,
          name: formData.name.trim(),
          role: "DRIVER",
          status: "ACTIVE",
          avatar: photoUrl || null,
        },
        vehicles: selectedVeh
          ? [
              {
                id: selectedVeh.id,
                vehicleNumber: finalVehicleNumber,
                registrationNumber: finalVehicleNumber,
                vehicleType: selectedVeh.vehicleType || selectedVeh.type || "Truck",
              },
            ]
          : [],
        consignments: [],
        _count: { consignments: 0, challans: 0, tripLogs: 0 },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 1. Immediately save to localStorage (spd_drivers & spd_local_drivers)
      saveStoredDriver(newDriverRecord);

      // 2. Try sending to backend API wrapped in try/catch (do NOT rollback or throw on serverless failure)
      try {
        await fetch("/api/admin/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            email: finalEmail,
            password: finalPassword,
            cnic: finalCnic,
            licenseNumber: finalLicense,
            vehicleNumber: finalVehicleNumber,
            photo: photoUrl || null,
          }),
        });
      } catch (apiErr) {
        console.warn("Serverless API fallback active — driver saved in localStorage:", apiErr);
      }

      setSuccessMessage(`Record created successfully! Driver ${newDriverRecord.name} registered.`);
      setTimeout(() => {
        router.push(`/admin/drivers?highlight=${uniqueId}`);
      }, 900);
    } catch (err: any) {
      console.error("[NewDriver] Error:", err);
      setFormError(err.message || "Failed to register driver.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <span className="text-slate-700 dark:text-slate-200">Register New Driver</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Register New Driver
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add verified commercial driver records, vehicle assignments & portal login access.
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

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* SECTION 1: PROFILE PHOTO */}
        <FormSectionCard
          title="Driver Profile Photograph"
          description="Upload clear passport size face photograph for ID badges"
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
                Initial Duty Status
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
              emptyMessage={loadingVehicles ? "Loading vehicles..." : "No vehicles available in database."}
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

        {/* SECTION 6: LOGIN CREDENTIALS */}
        <FormSectionCard
          title="Driver Portal Login Access"
          description="Direct credentials for driver consignment app access"
          icon={Lock}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-spd-blue">
                Driver Login Email *
              </Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl h-10 text-xs border-blue-200 dark:border-blue-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-spd-blue">
                Driver Portal Password *
              </Label>
              <Input
                required
                type="password"
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
            onClick={() => router.push("/admin/drivers")}
            className="rounded-xl text-xs font-semibold px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-spd-red hover:bg-spd-redHover text-white text-xs font-bold px-6 shadow-md gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
            <span>{submitting ? "Registering..." : "Register Driver"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
