"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  User,
  Mail,
  Phone,
  Shield,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Camera,
  Calendar,
  Clock,
  RefreshCw,
  Lock,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

function AdminProfileContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Security / Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setName(data.data.name || "");
        setEmail(data.data.email || "");
        setPhone(data.data.phone || "");
        setAvatar(data.data.avatar || null);
        setPreviewAvatar(data.data.avatar || null);
        setImageLoadFailed(false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setFeedback({ type: "error", message: "Failed to load admin profile data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFeedback({
        type: "error",
        message: "Invalid file type. Please select a valid JPG, PNG, or WebP image.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "Image exceeds 5MB. Please upload a smaller photo.",
      });
      return;
    }

    // Set local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatar(objectUrl);
    setImageLoadFailed(false);
    setFeedback(null);

    // Upload immediately to storage endpoint and persist to DB
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Automatically persist to user profile in DB
      const saveRes = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          avatar: data.url,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save profile photo reference");
      }

      // Reload profile from backend to guarantee fresh state
      await fetchProfile();

      // Dispatch global profile update event so sidebar and navbar update immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("spd-profile-updated", { detail: saveData.data }));
      }

      setFeedback({
        type: "success",
        message: "Profile photo uploaded and saved successfully!",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      setPreviewAvatar(avatar);
      setFeedback({
        type: "error",
        message: err.message || "Failed to upload photo. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setConfirmRemoveOpen(true);
  };

  const handleConfirmRemove = async () => {
    setConfirmRemoveOpen(false);
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          avatar: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove profile photo");
      }

      setUser(data.data);
      setAvatar(null);
      setPreviewAvatar(null);
      setImageLoadFailed(false);
      setFeedback({
        type: "success",
        message: "Profile photo successfully removed. Default avatar restored.",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("spd-profile-updated", { detail: data.data }));
      }
    } catch (err: any) {
      console.error("Remove photo error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to remove profile photo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.data);
      setName(data.data.name || "");
      setEmail(data.data.email || "");
      setPhone(data.data.phone || "");
      setAvatar(data.data.avatar || null);
      setPreviewAvatar(data.data.avatar || null);
      setImageLoadFailed(false);
      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });

      // Dispatch global profile update event so sidebar and navbar update immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("spd-profile-updated", { detail: data.data }));
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to save profile changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    // Client-side validation
    if (!currentPassword.trim()) {
      setPasswordFeedback({
        type: "error",
        message: "Current password is required.",
      });
      return;
    }

    if (!newPassword) {
      setPasswordFeedback({
        type: "error",
        message: "New password is required.",
      });
      return;
    }

    if (!confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Confirm New Password is required.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordFeedback({
        type: "error",
        message: "New password must be at least 4 characters long.",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordFeedback({
        type: "success",
        message: data.message || "Password changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      setPasswordFeedback({
        type: "error",
        message: err.message || "Failed to change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-spd-blue" />
        <p className="text-xs font-bold text-slate-400">Loading your admin profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <User className="w-6 h-6 text-spd-red" />
            Admin Profile & Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal administrative identity, contact details, and display photo.
          </p>
        </div>
        <Button
          onClick={fetchProfile}
          variant="outline"
          className="rounded-xl text-xs font-bold gap-2 h-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border animate-in fade-in duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo Avatar Section */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {previewAvatar && !imageLoadFailed ? (
                    <img
                      src={previewAvatar}
                      alt={name || "Admin"}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImageLoadFailed(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-spd-blue text-white shadow-md hover:bg-spd-blueHover transition-transform hover:scale-105"
                  title="Upload New Photo"
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Photo Actions & Overview */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {user?.name || "Administrator"}
                  </h2>
                  <Badge className="bg-spd-red/10 text-spd-red border border-spd-red/20 font-bold uppercase text-[10px] tracking-wider">
                    {user?.role || "ADMIN"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl text-xs font-bold gap-1.5 h-8 bg-white dark:bg-slate-800"
                  >
                    <Upload className="w-3.5 h-3.5 text-spd-blue" />
                    <span>{avatar ? "Change Photo" : "Upload Photo"}</span>
                  </Button>

                  {previewAvatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemovePhoto}
                      disabled={uploading}
                      className="rounded-xl text-xs font-bold gap-1.5 h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepted formats: JPG, PNG, WebP (Max 5MB). Photo is stored permanently on the server.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Full Name *
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Contact Phone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Email Address *
                </Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spd.com"
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-400">
                  System Role
                </Label>
                <Input
                  disabled
                  value={user?.role || "ADMIN"}
                  className="rounded-xl h-10 text-xs bg-slate-100 dark:bg-slate-800/60 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Account Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Account Created
                </p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last Active Session
                </p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Current Session"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" /> Account Status
                </p>
                <p className="font-black text-emerald-600 mt-0.5">
                  {user?.status || "ACTIVE"}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={saving || uploading}
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 px-6 h-10"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Security & Login Credentials Section */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Security / Login Credentials
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage your administrative login password. You must enter your current password to set a new one.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {passwordFeedback && (
            <div
              className={`p-4 mb-5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border animate-in fade-in duration-300 ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Current Password *
                </Label>
                <div className="relative">
                  <Input
                    required
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="rounded-xl h-10 text-xs pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    required
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="rounded-xl h-10 text-xs pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Confirm New Password *
                </Label>
                <div className="relative">
                  <Input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-xl h-10 text-xs pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">
                Minimum 4 characters. Passwords are encrypted with bcrypt (12 rounds) and never stored in plaintext.
              </p>
              <Button
                type="submit"
                disabled={changingPassword}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 px-6 h-10 shrink-0"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Change Password</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* REMOVE PHOTO CONFIRMATION MODAL */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Remove Profile Photo?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove your administrative profile photo?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">Account Safety:</p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Your administrative credentials, permissions, and account data will remain completely intact. The interface will simply display the standard default admin avatar.
            </p>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Yes, Remove Photo</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

class AdminProfileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || "An unexpected error occurred." };
  }

  componentDidCatch(error: any, info: any) {
    console.error("AdminProfile ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto p-6 my-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-base font-black text-red-900 dark:text-red-200">
            Profile View Recovery
          </h2>
          <p className="text-xs text-red-700 dark:text-red-400">
            {this.state.error || "A display error occurred. Your profile data and credentials remain completely safe."}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: "" });
              window.location.reload();
            }}
            variant="outline"
            className="rounded-xl text-xs font-bold"
          >
            Reload Profile
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminProfilePage() {
  return (
    <AdminProfileErrorBoundary>
      <AdminProfileContent />
    </AdminProfileErrorBoundary>
  );
}
