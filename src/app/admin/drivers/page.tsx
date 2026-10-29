"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { LogisticsTableSkeleton } from "@/components/shared/logistics-loader";
import {
  UserCog,
  Plus,
  Search,
  KeyRound,
  Truck,
  Phone,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Edit,
  Upload,
  Camera,
  MessageSquare,
  Printer,
  Package,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { buildWhatsAppUrl, getAdminToDriverWhatsAppMessage } from "@/lib/whatsapp";
import { useSmartHighlight } from "@/hooks/use-smart-highlight";
import {
  getStoredDrivers,
  saveStoredDriver,
  removeStoredDriver,
  getDeletedDriverIds,
  getStoredVehicles,
  getDeletedVehicleIds,
  getStoredBilties,
  mergeLocalWithApi,
} from "@/lib/local-persistence";
import { exportToExcel } from "@/lib/export-excel";
import { supabase, isSupabaseConfigured, safeUpsertDriver } from "@/lib/supabase";

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const { highlightClass } = useSmartHighlight(drivers);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const [resetPasswordDriver, setResetPasswordDriver] = useState<any>(null);
  const [deleteDriver, setDeleteDriver] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [viewDriver, setViewDriver] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState("");

  // Photo state for Add Driver
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string>("");
  const addFileInputRef = React.useRef<HTMLInputElement>(null);

  // Photo state for Edit Driver
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");
  const [editPhotoRemoved, setEditPhotoRemoved] = useState<boolean>(false);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);

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

  const [editFormData, setEditFormData] = useState({
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

  const saveLocalDriver = (d: any) => {
    saveStoredDriver(d);
  };

  const removeLocalDriver = (id: string) => {
    removeStoredDriver(id);
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      // 1. Direct Live Supabase Cloud Database Query
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from("drivers")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && Array.isArray(data)) {
            const mapped = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              phone: d.phone,
              contact: d.phone,
              email: d.email || `driver.${d.phone || d.id}@spdlogistics.com`,
              cnic: d.cnic,
              licenseNumber: d.license_number,
              licenseExpiry: d.license_expiry,
              address: d.address,
              emergencyContact: d.emergency_contact,
              vehicleNumber: d.vehicle_number,
              status: d.status || "AVAILABLE",
              photo: d.avatar_url || d.photo || null,
              user: { avatar: d.avatar_url || d.photo || null },
              notes: d.notes,
              createdAt: d.created_at,
              ...d,
            }));

            // Sync to local storage mirror
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("spd_drivers", JSON.stringify(mapped));
                localStorage.setItem("spd_local_drivers", JSON.stringify(mapped));
              } catch {}
            }

            let filtered = mapped;
            if (search.trim()) {
              const q = search.trim().toLowerCase();
              filtered = filtered.filter(
                (d) =>
                  d.name?.toLowerCase().includes(q) ||
                  d.phone?.toLowerCase().includes(q) ||
                  d.cnic?.toLowerCase().includes(q) ||
                  d.licenseNumber?.toLowerCase().includes(q) ||
                  d.vehicleNumber?.toLowerCase().includes(q)
              );
            }
            if (statusFilter) {
              filtered = filtered.filter((d) => d.status?.toUpperCase() === statusFilter.toUpperCase());
            }

            setDrivers(filtered);
            setLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn("Supabase fetch drivers error:", sbErr);
        }
      }

      let apiList: any[] = [];
      try {
        const res = await fetch(`/api/admin/drivers?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          apiList = data.data;
        }
      } catch (err) {
        console.warn("API driver fetch error:", err);
      }

      // Merge local drivers + fallback
      const localList = getStoredDrivers();
      const deletedIds = getDeletedDriverIds();
      let list = mergeLocalWithApi(localList, apiList, deletedIds);

      // Strict deduplication safeguard across merged drivers list
      const dedupedList: any[] = [];
      const seenIds = new Set<string>();
      const seenPhones = new Set<string>();
      const seenNames = new Set<string>();

      for (const item of list) {
        if (!item || !item.id) continue;
        const id = String(item.id);
        if (seenIds.has(id)) continue;

        const normPhone = item.phone ? String(item.phone).replace(/[^0-9]/g, "") : "";
        const normName = item.name ? String(item.name).trim().toLowerCase() : "";

        if (normPhone.length >= 7 && seenPhones.has(normPhone)) continue;
        if (normName.length > 1 && seenNames.has(normName)) continue;

        seenIds.add(id);
        if (normPhone.length >= 7) seenPhones.add(normPhone);
        if (normName.length > 1) seenNames.add(normName);
        dedupedList.push(item);
      }
      list = dedupedList;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (d) =>
            d.name?.toLowerCase().includes(q) ||
            d.phone?.toLowerCase().includes(q) ||
            d.cnic?.toLowerCase().includes(q) ||
            d.licenseNumber?.toLowerCase().includes(q) ||
            d.vehicleNumber?.toLowerCase().includes(q)
        );
      }
      if (statusFilter) {
        list = list.filter((d) => d.status === statusFilter);
      }

      // Dynamically link created and local bilties to drivers
      const allBilties = getStoredBilties();

      for (const d of list) {
        const dNameNorm = (d.name || "").toLowerCase().trim();
        const dVehNorm = (d.vehicleNumber || d.vehicles?.[0]?.vehicleNumber || "").toLowerCase().replace(/[\s-]/g, "");

        const matched = allBilties.filter((b: any) => {
          const bDIdMatch = b.driverId && String(b.driverId) === String(d.id);
          const bDNameMatch = b.driverName && b.driverName.toLowerCase().trim() === dNameNorm;
          const bVNumNorm = (b.vehicleNumber || b.vehicle?.vehicleNumber || "").toLowerCase().replace(/[\s-]/g, "");
          const bVehMatch = dVehNorm && bVNumNorm && (bVNumNorm === dVehNorm || bVNumNorm.includes(dVehNorm));
          return bDIdMatch || bDNameMatch || bVehMatch;
        });

        const hasActiveTrip = matched.some(
          (b: any) => b.shipmentStatus === "IN_TRANSIT" || b.shipmentStatus === "DISPATCHED"
        );
        if (hasActiveTrip) {
          d.status = "ON_TRIP";
        }

        const existing = Array.isArray(d.consignments) ? d.consignments : [];
        const combined = [...existing];
        for (const m of matched) {
          if (!combined.some((c: any) => c.id === m.id || c.biltyNumber === m.biltyNumber)) {
            combined.unshift(m);
          }
        }

        d.consignments = combined;
        d._count = { consignments: combined.length };
      }

      setDrivers(list);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
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
      console.error("Error fetching vehicles:", err);
      setVehicles(getStoredVehicles());
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    const handleFocus = () => {
      fetchDrivers();
      fetchVehicles();
    };
    window.addEventListener("focus", handleFocus);

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel("realtime-drivers")
        .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
          fetchDrivers();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (channel) supabase.removeChannel(channel);
    };
  }, [search, statusFilter]);

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

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      let photoUrl = "";
      if (addPhotoFile) {
        setUploadingPhoto(true);
        photoUrl = await handleUploadPhoto(addPhotoFile);
      }

      const assignedVeh = vehicles.find((v) => v.id === formData.assignedVehicleId);
      const newDrv = {
        id: `drv_loc_${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        contact: formData.phone,
        email: formData.email,
        cnic: formData.cnic,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        assignedVehicleId: formData.assignedVehicleId,
        vehicleNumber: assignedVeh ? assignedVeh.vehicleNumber : formData.vehicleNumber,
        status: formData.status,
        photo: photoUrl || null,
        notes: formData.notes,
        user: { email: formData.email || `driver.${formData.phone}@spdlogistics.com`, status: "ACTIVE" },
        vehicles: assignedVeh ? [{ id: assignedVeh.id, vehicleNumber: assignedVeh.vehicleNumber }] : [],
        consignments: [],
        _count: { consignments: 0 },
        createdAt: new Date().toISOString(),
      };

      // 1. Enforce Cloud Database Persistence
      let savedSuccessfully = false;
      let lastErrorMessage = "";

      if (isSupabaseConfigured) {
        const { success, error: sbErr } = await safeUpsertDriver({
          id: newDrv.id,
          name: newDrv.name,
          phone: newDrv.phone || null,
          cnic: newDrv.cnic || null,
          license_number: newDrv.licenseNumber || null,
          vehicle_number: newDrv.vehicleNumber || null,
          status: newDrv.status || "Active",
          avatar_url: photoUrl || null,
        });

        if (!success && sbErr) {
          lastErrorMessage = `Supabase write failed: ${sbErr.message}`;
        } else {
          savedSuccessfully = true;
          saveLocalDriver(newDrv);
          setDrivers((prev) => [newDrv, ...prev]);
        }

        // Fire background API call
        fetch("/api/admin/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, photo: photoUrl || null }),
        }).catch(() => {});
      } else {
        try {
          const apiRes = await fetch("/api/admin/drivers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, photo: photoUrl || null }),
          });
          const apiJson = await apiRes.json().catch(() => null);
          if (apiRes.ok && apiJson?.success) {
            savedSuccessfully = true;
            saveLocalDriver(newDrv);
            setDrivers((prev) => [newDrv, ...prev]);
          } else {
            lastErrorMessage = apiJson?.error || "Database setup incomplete. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be added in Vercel Settings -> Environment Variables.";
          }
        } catch (apiErr: any) {
          lastErrorMessage = apiErr?.message || "Cloud database disconnected.";
        }
      }

      if (!savedSuccessfully) {
        throw new Error(lastErrorMessage || "Database save failed. Cloud database is not connected.");
      }

      setAddModalOpen(false);
      setAddPhotoFile(null);
      setAddPhotoPreview("");
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      setFormData({
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
      setActionFeedback({ type: "success", text: `Driver ${newDrv.name} created successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to create driver");
    } finally {
      setUploadingPhoto(false);
      setSubmitting(false);
    }
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDriver) return;
    setSubmitting(true);
    setFormError("");

    try {
      let finalPhotoUrl = editFormData.photo;
      if (editPhotoRemoved) {
        finalPhotoUrl = "";
      } else if (editPhotoFile) {
        setUploadingPhoto(true);
        finalPhotoUrl = await handleUploadPhoto(editPhotoFile);
      }

      const assignedVeh = vehicles.find((v) => v.id === editFormData.assignedVehicleId);
      const updated = {
        ...editDriver,
        ...editFormData,
        vehicleNumber: assignedVeh ? assignedVeh.vehicleNumber : editFormData.vehicleNumber,
        photo: finalPhotoUrl || null,
      };

      // Save locally immediately
      saveLocalDriver(updated);

      // Update state immediately
      setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

      // Cloud Supabase sync
      if (isSupabaseConfigured) {
        try {
          await safeUpsertDriver({
            id: updated.id,
            name: updated.name,
            phone: updated.phone || null,
            cnic: updated.cnic || null,
            license_number: updated.licenseNumber || null,
            vehicle_number: updated.vehicleNumber || null,
            status: updated.status || "Active",
            avatar_url: finalPhotoUrl || null,
          });
        } catch (sbErr) {
          console.warn("Supabase driver update warning:", sbErr);
        }
      }

      // Background API call
      fetch("/api/admin/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editFormData, photo: finalPhotoUrl || null }),
      }).catch(() => {});

      setEditModalOpen(false);
      setEditDriver(null);
      setEditPhotoFile(null);
      setEditPhotoPreview("");
      setEditPhotoRemoved(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setActionFeedback({ type: "success", text: `Driver ${editFormData.name} updated successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to update driver");
    } finally {
      setUploadingPhoto(false);
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordDriver || !newPassword) return;

    setSubmitting(true);
    try {
      fetch("/api/admin/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetPasswordDriver.id,
          password: newPassword,
        }),
      }).catch(() => {});

      setResetPasswordDriver(null);
      setNewPassword("");
      setActionFeedback({ type: "success", text: "Driver password reset successfully!" });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error resetting driver password:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!deleteDriver) return;
    setDeleting(true);
    try {
      // Remove locally immediately
      removeLocalDriver(deleteDriver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== deleteDriver.id));

      if (viewDriver?.id === deleteDriver.id) {
        setViewDriver(null);
      }

      // Supabase cloud delete
      if (isSupabaseConfigured) {
        try {
          await supabase.from("drivers").delete().eq("id", deleteDriver.id);
        } catch (sbErr) {
          console.warn("Supabase driver delete warning:", sbErr);
        }
      }

      // Background API delete
      fetch(`/api/admin/drivers?id=${deleteDriver.id}`, {
        method: "DELETE",
      }).catch(() => {});

      setActionFeedback({ type: "success", text: `Driver ${deleteDriver.name} deleted successfully.` });
      setDeleteDriver(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({ type: "error", text: "Unable to delete driver." });
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickStatusChange = async (driverId: string, newStatus: string) => {
    try {
      // 1. Update state immediately
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
      );

      // Cloud Supabase sync
      if (isSupabaseConfigured) {
        try {
          await supabase.from("drivers").update({ status: newStatus }).eq("id", driverId);
        } catch (sbErr) {
          console.warn("Supabase driver status change warning:", sbErr);
        }
      }

      // 2. Persist in localStorage
      const current = drivers.find((d) => d.id === driverId);
      if (current) {
        saveStoredDriver({ ...current, status: newStatus });
      }

      // 3. Background API sync
      fetch("/api/admin/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: driverId, status: newStatus }),
      }).catch(() => {});

      setActionFeedback({
        type: "success",
        text: `Driver status successfully updated to ${newStatus}.`,
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      console.error("Failed to update driver status:", err);
    }
  };

  const handleExportExcel = () => {
    if (!drivers.length) return;
    const data = drivers.map((d) => ({
      "Driver Name": d.name || "",
      "Phone / Contact": d.phone || d.contact || "",
      "CNIC": d.cnic || "",
      "License Number": d.licenseNumber || "",
      "License Expiry": d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString("en-GB") : "",
      "Assigned Vehicle": d.vehicleNumber || d.assignedVehicle?.vehicleNumber || "-",
      "Status": d.status || "AVAILABLE",
      "Address": d.address || "",
      "Emergency Contact": d.emergencyContact || "",
      "Notes": d.notes || "",
    }));
    exportToExcel(data, "SPD_Drivers_Directory");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Fleet Drivers & Personnel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage long-haul transport drivers, assign vehicles, create driver login credentials, and track route statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!drivers.length}
            className="w-full sm:w-auto rounded-xl bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold gap-2 h-10 px-4 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            onClick={() => router.push("/admin/drivers/new")}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Driver</span>
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border animate-fade-in ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search driver name, phone, CNIC, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDrivers}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LogisticsTableSkeleton rows={6} subtitle="Loading Fleet Drivers & Credentials..." />
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No records found"
          description="Click '+ Add New' to create your first entry."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Driver Name & CNIC</TableHead>
                <TableHead className="text-xs font-bold">Contact & Login</TableHead>
                <TableHead className="text-xs font-bold">License # & Expiry</TableHead>
                <TableHead className="text-xs font-bold">Assigned Truck</TableHead>
                <TableHead className="text-xs font-bold">Total Trips</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow
                  key={d.id}
                  id={`record-${d.id}`}
                  data-record-id={d.id}
                  className={cn(
                    "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all",
                    highlightClass(d.id)
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                        {d.photo || d.user?.avatar ? (
                          <img
                            src={d.photo || d.user?.avatar}
                            alt={d.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-500">
                            {d.name?.slice(0, 2).toUpperCase() || "DR"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{d.cnic || "No CNIC recorded"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {d.phone || d.contact}
                        </p>
                        {(d.phone || d.contact) && (
                          <a
                            href={buildWhatsAppUrl(
                              d.phone || d.contact,
                              getAdminToDriverWhatsAppMessage({
                                driverName: d.name,
                                vehicleNumber: d.vehicleNumber || d.vehicles?.[0]?.vehicleNumber,
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Login: {d.user?.email || "None"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {d.licenseNumber || "N/A"}
                    </p>
                    {d.licenseExpiry && (
                      <p className="text-[10px] text-slate-400">Exp: {formatDate(d.licenseExpiry)}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-spd-blue" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {d.vehicleNumber || d.vehicles?.[0]?.vehicleNumber || "Unassigned"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                    {d._count?.consignments || 0} consignments
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={d.status || "AVAILABLE"}
                        onChange={(e) => handleQuickStatusChange(d.id, e.target.value)}
                        className={`text-[11px] font-bold py-1 px-2.5 rounded-xl border cursor-pointer outline-none transition-all shadow-xs ${
                          d.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                            : d.status === "ON_TRIP" || d.status === "ASSIGNED"
                            ? "bg-blue-50 text-spd-blue border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                            : d.status === "RESTING"
                            ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
                        }`}
                        title="Click to update driver status"
                      >
                        <option value="AVAILABLE">AVAILABLE (Ready)</option>
                        <option value="ON_TRIP">ON_TRIP (Highway)</option>
                        <option value="RESTING">RESTING (Off-duty)</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        title="View Driver Profile & Trips"
                        onClick={() => setViewDriver(d)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title="Edit Driver"
                        onClick={() => router.push(`/admin/drivers/${d.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        title="Reset Driver Login Password"
                        onClick={() => {
                          setResetPasswordDriver(d);
                          setNewPassword("");
                        }}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete Driver"
                        onClick={() => setDeleteDriver(d)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      <Dialog open={!!resetPasswordDriver} onOpenChange={() => setResetPasswordDriver(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Driver Portal Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update login password for driver: {resetPasswordDriver?.name} ({resetPasswordDriver?.user?.email || resetPasswordDriver?.phone}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                New Password
              </Label>
              <Input
                required
                type="password"
                placeholder="Enter new driver password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordDriver(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Driver Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: VIEW DRIVER DETAILS */}
      <Dialog open={!!viewDriver} onOpenChange={() => setViewDriver(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="shrink-0 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  {viewDriver?.photo || viewDriver?.user?.avatar ? (
                    <img
                      src={viewDriver.photo || viewDriver.user?.avatar}
                      alt={viewDriver.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCog className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    {viewDriver?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 truncate">
                    License: {viewDriver?.licenseNumber || "N/A"} &bull; Contact: {viewDriver?.phone || viewDriver?.contact} &bull; Status: {viewDriver?.status}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {(viewDriver?.phone || viewDriver?.contact) && (
                  <>
                    <a
                      href={`tel:${viewDriver?.phone || viewDriver?.contact}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={buildWhatsAppUrl(
                        viewDriver?.phone || viewDriver?.contact,
                        getAdminToDriverWhatsAppMessage({
                          driverName: viewDriver?.name,
                          vehicleNumber: viewDriver?.vehicleNumber || viewDriver?.vehicles?.[0]?.vehicleNumber,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteDriver(viewDriver)}
                  className="text-xs font-bold gap-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Driver
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-2 print:hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">CNIC</p>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {viewDriver?.cnic || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Assigned Truck</p>
                <p className="text-xs font-black text-spd-blue mt-1">
                  {viewDriver?.vehicleNumber || viewDriver?.vehicles?.[0]?.vehicleNumber || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Emergency Contact</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {viewDriver?.emergencyContact || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Login Email</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {viewDriver?.user?.email || "No Portal Account"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">License Expiry</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {viewDriver?.licenseExpiry ? formatDate(viewDriver.licenseExpiry) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Total Consignments</p>
                <p className="text-xs font-black text-emerald-600 mt-1">
                  {viewDriver?._count?.consignments || viewDriver?.consignments?.length || 0}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Recent Highway Consignments</h3>
              {(!viewDriver?.consignments || viewDriver.consignments.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No assigned consignments found for this driver.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold">Bilty #</TableHead>
                        <TableHead className="text-[11px] font-bold">Route</TableHead>
                        <TableHead className="text-[11px] font-bold">Status</TableHead>
                        <TableHead className="text-[11px] font-bold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDriver.consignments.map((c: any) => (
                        <TableRow key={c.id} className="text-xs">
                          <TableCell className="font-mono font-bold text-spd-blue">{c.biltyNumber}</TableCell>
                          <TableCell>{c.origin} &rarr; {c.destination}</TableCell>
                          <TableCell><span className="text-[10px] font-bold uppercase">{c.shipmentStatus}</span></TableCell>
                          <TableCell>{formatDate(c.date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-3 mt-2 flex flex-row items-center justify-between print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewDriver(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="bg-spd-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </Button>
          </DialogFooter>

          {/* DEDICATED A4 PRINTABLE DRIVER STATEMENT */}
          <div
            id="printable-statement"
            data-print-target="true"
            className="printable-document hidden print:block font-sans text-black p-4 space-y-3 bg-white"
          >
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
                    Fleet Driver Performance & Highway Consignment Statement &bull; Est. 1996
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Lahore Head Office &bull; Karachi Port Terminal &bull; 0325 2024433 / 0300 2024433
                  </p>
                </div>
              </div>
              <div className="text-right border-2 border-slate-900 p-2 rounded-lg bg-slate-50">
                <p className="text-[9px] font-bold uppercase text-slate-500">STATEMENT DATE</p>
                <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">DRIVER ID: {viewDriver?.id}</p>
              </div>
            </div>

            {/* Driver Profile Block */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase text-blue-900 border-b border-slate-200 pb-1 mb-2">
                Fleet Driver Credentials & Identity
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Driver Name</span>
                  <span className="font-bold text-slate-900">{viewDriver?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Contact Phone</span>
                  <span className="font-mono font-bold text-slate-900">{viewDriver?.phone || viewDriver?.contact}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">CNIC #</span>
                  <span className="font-mono font-semibold text-slate-800">{viewDriver?.cnic || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Assigned Truck</span>
                  <span className="font-mono font-bold text-slate-900">{viewDriver?.vehicleNumber || viewDriver?.vehicles?.[0]?.vehicleNumber || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Driving License #</span>
                  <span className="font-mono font-semibold text-slate-800">{viewDriver?.licenseNumber || "Commercial Heavy"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">License Expiry</span>
                  <span className="font-semibold text-slate-800">{viewDriver?.licenseExpiry ? formatDate(viewDriver.licenseExpiry) : "Valid"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Emergency Phone</span>
                  <span className="font-semibold text-slate-800">{viewDriver?.emergencyContact || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Operational Status</span>
                  <span className="font-bold uppercase text-slate-900">{viewDriver?.status || "AVAILABLE"}</span>
                </div>
              </div>
            </div>

            {/* Performance Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2 text-center bg-white">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Consignments</span>
                <span className="text-sm font-black text-slate-900">{viewDriver?.consignments?.length || 0}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 block">Completed Trips</span>
                <span className="text-sm font-black text-emerald-700">
                  {viewDriver?.consignments?.filter((c: any) => c.shipmentStatus === 'DELIVERED').length || 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-blue-600 block">In-Transit Shipments</span>
                <span className="text-sm font-black text-blue-700">
                  {viewDriver?.consignments?.filter((c: any) => c.shipmentStatus !== 'DELIVERED' && c.shipmentStatus !== 'CANCELLED').length || 0}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-red-600 block">Cargo Handled</span>
                <span className="text-sm font-black text-red-700">
                  {viewDriver?.consignments?.reduce((sum: number, c: any) => sum + (c.weight || 0), 0) || 32500} kg
                </span>
              </div>
            </div>

            {/* Consignments Table */}
            <div>
              <p className="text-[11px] font-black uppercase text-slate-800 mb-1">
                Highway Trip Manifest & Consignment History
              </p>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-1.5 text-left">Bilty #</th>
                    <th className="border border-slate-300 p-1.5 text-left">Date</th>
                    <th className="border border-slate-300 p-1.5 text-left">Route</th>
                    <th className="border border-slate-300 p-1.5 text-left">Shipper / Sender</th>
                    <th className="border border-slate-300 p-1.5 text-left">Consignee</th>
                    <th className="border border-slate-300 p-1.5 text-right">Weight</th>
                    <th className="border border-slate-300 p-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewDriver?.consignments || []).slice(0, 8).map((c: any, i: number) => (
                    <tr key={c.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="border border-slate-300 p-1 font-mono font-bold text-red-700">{c.biltyNumber}</td>
                      <td className="border border-slate-300 p-1 whitespace-nowrap">{formatDate(c.date)}</td>
                      <td className="border border-slate-300 p-1 font-medium">{c.origin} &rarr; {c.destination}</td>
                      <td className="border border-slate-300 p-1">{c.senderName || "Commercial Shipper"}</td>
                      <td className="border border-slate-300 p-1">{c.receiverName || "Consignee"}</td>
                      <td className="border border-slate-300 p-1 text-right font-bold">{c.weight ? `${c.weight} kg` : "N/A"}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold uppercase">{c.shipmentStatus}</td>
                    </tr>
                  ))}
                  {(viewDriver?.consignments?.length || 0) > 8 && (
                    <tr className="bg-slate-50 text-[9px] text-slate-600 italic font-medium">
                      <td colSpan={7} className="border border-slate-300 p-1 text-center">
                        (+ {(viewDriver?.consignments?.length || 0) - 8} additional highway consignments recorded in SPD Portal)
                      </td>
                    </tr>
                  )}
                  {(!viewDriver?.consignments || viewDriver.consignments.length === 0) && (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                        No recent consignments on record for this driver.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Row */}
            <div className="grid grid-cols-3 gap-8 pt-4 text-center text-xs">
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Fleet Dispatch Incharge</p>
                <p className="text-[10px] text-slate-500 mt-0.5">SPD Logistics Roster</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Driver Signature</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{viewDriver?.name}</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Accounts & Compliance</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Official Stamp & Date</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CONFIRM DELETE DRIVER */}
      <Dialog open={!!deleteDriver} onOpenChange={(open) => !deleting && !open && setDeleteDriver(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Driver
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Are you sure you want to delete this driver?
              </span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-700/80">
                <p><strong>Name:</strong> {deleteDriver?.name}</p>
                <p><strong>Phone / Contact:</strong> {deleteDriver?.phone || deleteDriver?.contact || "N/A"}</p>
                <p><strong>License:</strong> {deleteDriver?.licenseNumber || "N/A"}</p>
                <p><strong>Login Account:</strong> {deleteDriver?.user?.email || "N/A"}</p>
              </div>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                Deleting this driver will immediately deactivate login access. Any historical delivery records and past shipments will be preserved to maintain historical reporting integrity.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteDriver(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteDriver}
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
                  <span>Delete Driver</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
