"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Building2,
  CreditCard,
  MapPin,
  Bell,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Loader2,
  RotateCcw,
  Shield,
  User,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  Check,
  Phone,
  Mail,
  Globe,
  Truck,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Logo upload preview
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("/images/spd-logo.jpg");

  // Safeguard Reset Modal state
  const [resetModalCategory, setResetModalCategory] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Fetch Settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
        if (data.data.companyLogo) {
          setLogoPreview(data.data.companyLogo);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setFeedback({ type: "error", message: "Could not load settings from server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save Settings for a Category
  const handleSave = async (category: string, specificKeys?: string[]) => {
    setSaving(true);
    setFeedback(null);

    try {
      const payloadSettings: Record<string, string> = {};
      if (specificKeys && specificKeys.length > 0) {
        for (const k of specificKeys) {
          if (settings[k] !== undefined) {
            payloadSettings[k] = settings[k];
          }
        }
      } else {
        Object.assign(payloadSettings, settings);
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          settings: payloadSettings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSettings(data.data);
      setFeedback({
        type: "success",
        message: `${category} settings saved and permanently persisted!`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setFeedback({
        type: "error",
        message: "Invalid file format. Please choose a JPG, PNG, or WebP logo.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "File exceeds 5MB limit. Please choose a smaller logo image.",
      });
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Logo upload failed");
      }

      setSettings((prev) => ({ ...prev, companyLogo: data.url }));
      setLogoPreview(data.url);
      setFeedback({
        type: "success",
        message: "Logo uploaded. Click 'Save Company Settings' to finalize.",
      });
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to upload logo. Please try again.",
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Reset Category Confirmation
  const handleConfirmReset = async () => {
    if (!resetModalCategory) return;
    setResetting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/settings?category=${encodeURIComponent(resetModalCategory)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset settings");
      }

      setSettings(data.data);
      if (data.data.companyLogo) {
        setLogoPreview(data.data.companyLogo);
      }
      setFeedback({
        type: "success",
        message: `${resetModalCategory} settings safely restored to standard defaults. All business records remain untouched.`,
      });
      setResetModalCategory(null);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Reset settings error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to reset settings.",
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-spd-red" />
        <p className="text-xs font-bold text-slate-400">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with quick navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-spd-red" />
            System & Enterprise Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure global logistics operational preferences, branding, billing prefixes, and security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/profile">
            <Button
              variant="outline"
              className="rounded-xl text-xs font-bold gap-2 h-9 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <User className="w-3.5 h-3.5 text-spd-blue" />
              <span>Admin Profile & Photo</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Button>
          </Link>
          <Button
            onClick={fetchSettings}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            title="Reload Settings"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border shadow-sm animate-in fade-in duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <TabsTrigger
            value="general"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-spd-red shadow-none data-[state=active]:shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General</span>
          </TabsTrigger>

          <TabsTrigger
            value="company"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-spd-blue shadow-none data-[state=active]:shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Company</span>
          </TabsTrigger>

          <TabsTrigger
            value="billing"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 shadow-none data-[state=active]:shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing</span>
          </TabsTrigger>

          <TabsTrigger
            value="tracking"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 shadow-none data-[state=active]:shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Tracking</span>
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-purple-600 shadow-none data-[state=active]:shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </TabsTrigger>

          <TabsTrigger
            value="theme"
            className="rounded-xl py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. GENERAL SETTINGS */}
        <TabsContent value="general" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-spd-red" />
                    General Application Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Global identity and regional locale preferences across the portal.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: GENERAL
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Application Name *
                  </Label>
                  <Input
                    value={settings.appName || "SPD Logistics"}
                    onChange={(e) => handleChange("appName", e.target.value)}
                    placeholder="SPD Logistics"
                    className="rounded-xl h-10 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Displayed on browser titles and header banners.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Base Operating Currency *
                  </Label>
                  <Input
                    value={settings.currency || "PKR"}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    placeholder="PKR"
                    className="rounded-xl h-10 text-xs font-bold"
                  />
                  <p className="text-[11px] text-slate-400">Default currency symbol used across vouchers and cash books.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Operational Timezone *
                  </Label>
                  <select
                    value={settings.timezone || "Asia/Karachi"}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT +05:00 - Pakistan Standard Time)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +04:00 - Gulf Standard Time)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Used for consignment tracking timestamps and audit logs.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Date Display Format *
                  </Label>
                  <select
                    value={settings.dateDisplayFormat || "DD/MM/YYYY"}
                    onChange={(e) => handleChange("dateDisplayFormat", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 16/09/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-16)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/16/2026)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Standard date format for printable bilties and ledgers.</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetModalCategory("GENERAL")}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSave("General", ["appName", "currency", "timezone", "dateDisplayFormat"])}
                className="bg-spd-red hover:bg-spd-redHover text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save General Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 2. COMPANY SETTINGS */}
        <TabsContent value="company" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-spd-blue" />
                    Company & Enterprise Branding
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Official business registration, contact coordinates, warehouse hub addresses, and corporate logo.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: COMPANY
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Logo Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-sm">
                  <img
                    src={logoPreview || "/images/spd-logo.jpg"}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/spd-logo.jpg";
                    }}
                  />
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Official Company Logo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Appears on official Bilty print vouchers, public website navbar, and invoice headers.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="rounded-xl text-xs font-bold gap-1.5 h-8 bg-white dark:bg-slate-800"
                    >
                      <Upload className="w-3.5 h-3.5 text-spd-blue" />
                      <span>Upload New Logo</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, companyLogo: "/images/spd-logo.jpg" }));
                        setLogoPreview("/images/spd-logo.jpg");
                      }}
                      className="rounded-xl text-xs font-medium h-8 text-slate-500 hover:text-slate-800"
                    >
                      Use Default SPD Logo
                    </Button>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Company Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Company Registered Name *
                  </Label>
                  <Input
                    value={settings.companyName || "Super Pak Data Goods Transport Co."}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    className="rounded-xl h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Company Tagline / Slogan
                  </Label>
                  <Input
                    value={settings.companyTagline || "Nationwide Cargo & Highway Transport — Est. 1996"}
                    onChange={(e) => handleChange("companyTagline", e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-spd-blue" /> Primary Company Email *
                  </Label>
                  <Input
                    type="email"
                    value={settings.companyEmail || "superpakdatawale@gmail.com"}
                    onChange={(e) => handleChange("companyEmail", e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Main Office Phone *
                  </Label>
                  <Input
                    value={settings.companyPhone || "0325 2024433"}
                    onChange={(e) => handleChange("companyPhone", e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    WhatsApp Click-to-Chat Number
                  </Label>
                  <Input
                    value={settings.whatsappNumber || "03252024433"}
                    onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono"
                    placeholder="03252024433"
                  />
                  <p className="text-[11px] text-slate-400">Used for pre-filled manual click-to-chat links.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Official Website
                  </Label>
                  <Input
                    value={settings.website || "https://spdlogistics.com"}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Hub Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-spd-red" /> Lahore Head Terminal Address *
                  </Label>
                  <textarea
                    rows={2}
                    value={
                      settings.lahoreWarehouseAddress ||
                      "Main Bhati Gate Goods Transport Terminal, Circular Road, Lahore"
                    }
                    onChange={(e) => handleChange("lahoreWarehouseAddress", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-spd-blue" /> Karachi Port Terminal Address *
                  </Label>
                  <textarea
                    rows={2}
                    value={
                      settings.karachiWarehouseAddress ||
                      "Plot 45-B, Transport Nagar, Mauripur Road, Port Qasim Terminal, Karachi"
                    }
                    onChange={(e) => handleChange("karachiWarehouseAddress", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Business Description / About Text
                </Label>
                <textarea
                  rows={2}
                  value={
                    settings.businessDescription ||
                    "Premier logistics and freight transport services operating across Pakistan with dedicated fleet trucks and nationwide distribution terminals."
                  }
                  onChange={(e) => handleChange("businessDescription", e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetModalCategory("COMPANY")}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving || uploadingLogo}
                onClick={() =>
                  handleSave("Company", [
                    "companyName",
                    "companyTagline",
                    "companyEmail",
                    "companyPhone",
                    "whatsappNumber",
                    "website",
                    "karachiWarehouseAddress",
                    "lahoreWarehouseAddress",
                    "businessDescription",
                    "companyLogo",
                  ])
                }
                className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Company Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 3. BILLING SETTINGS */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Billing, Vouchers & Payment Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Configure Bilty prefix formatting, default payment terms, and ledger voucher defaults.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: BILLING
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Bilty Voucher Prefix *
                  </Label>
                  <Input
                    value={settings.biltyPrefix || "SPD-"}
                    onChange={(e) => handleChange("biltyPrefix", e.target.value)}
                    placeholder="SPD-"
                    className="rounded-xl h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-400">
                    Applied to newly created consignment numbers (e.g. <strong>{settings.biltyPrefix || "SPD-"}LHR-2026-0001</strong>). Existing bilties remain unchanged.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Default Payment Status *
                  </Label>
                  <select
                    value={settings.defaultPaymentStatus || "PENDING"}
                    onChange={(e) => handleChange("defaultPaymentStatus", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="PENDING">PENDING (Unpaid upon booking)</option>
                    <option value="PARTIAL">PARTIAL (Advance paid)</option>
                    <option value="PAID">PAID (Full freight paid)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Default status assigned before advance payment is entered.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Default Payment Method *
                  </Label>
                  <select
                    value={settings.defaultPaymentMethod || "CASH"}
                    onChange={(e) => handleChange("defaultPaymentMethod", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="ONLINE">ONLINE / DIGITAL</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Default method for cash book transaction logging.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Credit Due Days
                  </Label>
                  <Input
                    type="number"
                    value={settings.dueDays || "15"}
                    onChange={(e) => handleChange("dueDays", e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Days allowed before customer receivable is marked overdue.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Default Service / Tax Charge (%)
                  </Label>
                  <Input
                    type="number"
                    value={settings.defaultTaxRate || "0"}
                    onChange={(e) => handleChange("defaultTaxRate", e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Percentage for additional loading/handling surcharge.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Standard Payment Terms
                </Label>
                <Input
                  value={settings.paymentTerms || "Payment due on delivery or credit terms within 15 days."}
                  onChange={(e) => handleChange("paymentTerms", e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Default Bilty Voucher Carriage Terms & Notes
                </Label>
                <textarea
                  rows={2}
                  value={
                    settings.defaultNotes ||
                    "Goods transported under company standard carriage conditions. Inspection required upon delivery."
                  }
                  onChange={(e) => handleChange("defaultNotes", e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetModalCategory("BILLING")}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSave("Billing", [
                    "biltyPrefix",
                    "defaultPaymentStatus",
                    "defaultPaymentMethod",
                    "dueDays",
                    "defaultTaxRate",
                    "paymentTerms",
                    "defaultNotes",
                  ])
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Billing Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 4. TRACKING SETTINGS */}
        <TabsContent value="tracking" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    Shipment Tracking & Status Workflow
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Configure public visibility, tracking ID formatting, and manual dispatch checkpoints.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: TRACKING
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Reliable Manual Tracking Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">100% Reliable Manual Dispatch Tracking</p>
                  <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                    SPD Logistics operates verified physical hub-to-hub checkpoint updates. No unreliable GPS simulations or fake coordinates are utilized.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Tracking ID Prefix *
                  </Label>
                  <Input
                    value={settings.trackingPrefix || "SPD-"}
                    onChange={(e) => handleChange("trackingPrefix", e.target.value)}
                    placeholder="SPD-"
                    className="rounded-xl h-10 text-xs font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-400">
                    Used for newly generated tracking numbers (e.g. <strong>{settings.trackingPrefix || "SPD-"}2026-000142</strong>).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Default Initial Status *
                  </Label>
                  <select
                    value={settings.defaultShipmentStatus || "BOOKED"}
                    onChange={(e) => handleChange("defaultShipmentStatus", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="BOOKED">BOOKED (Dispatched at Origin)</option>
                    <option value="PICKED_UP">PICKED UP</option>
                    <option value="IN_TRANSIT">IN TRANSIT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Customer Visibility Level
                  </Label>
                  <select
                    value={settings.customerTrackingVisibility || "FULL"}
                    onChange={(e) => handleChange("customerTrackingVisibility", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="FULL">FULL (Show all transit history & timeline)</option>
                    <option value="CURRENT_ONLY">CURRENT ONLY (Show current status & destination)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Enable Public Website Tracking</p>
                    <p className="text-[11px] text-slate-500">Allow customers to look up consignments via /tracking without logging in</p>
                  </div>
                  <Switch
                    checked={settings.publicTrackingEnabled !== "false"}
                    onCheckedChange={(checked) => handleChange("publicTrackingEnabled", String(checked))}
                  />
                </div>
              </div>

              {/* Status Reference Table */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Active Manual Shipment Status Workflow
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { status: "BOOKED", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" },
                    { status: "PICKED UP", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300" },
                    { status: "IN TRANSIT", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
                    { status: "ARRIVED AT DESTINATION", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300" },
                    { status: "OUT FOR DELIVERY", color: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300" },
                    { status: "DELIVERED", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
                    { status: "ON HOLD", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300" },
                    { status: "DELIVERY FAILED", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
                    { status: "RETURNED", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" },
                    { status: "CANCELLED", color: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" },
                  ].map((s) => (
                    <div key={s.status} className={`p-2 rounded-xl border text-center font-bold text-[10px] ${s.color}`}>
                      {s.status}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetModalCategory("TRACKING")}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSave("Tracking", [
                    "publicTrackingEnabled",
                    "trackingPrefix",
                    "defaultShipmentStatus",
                    "customerTrackingVisibility",
                  ])
                }
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Tracking Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 5. NOTIFICATION SETTINGS */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    Notification & Communication Preferences
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Configure alert preferences, admin recipient email, and click-to-chat visibility.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: NOTIFICATIONS
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Admin Alert Recipient Email *
                </Label>
                <Input
                  type="email"
                  value={settings.adminNotificationEmail || "superpakdatawale@gmail.com"}
                  onChange={(e) => handleChange("adminNotificationEmail", e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono"
                  placeholder="superpakdatawale@gmail.com"
                />
                <p className="text-[11px] text-slate-400">
                  Official recipient address for automated inquiries and dispatch alerts.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Email Notifications Enabled</p>
                    <p className="text-[11px] text-slate-500">Send confirmation emails on key milestone events</p>
                  </div>
                  <Switch
                    checked={settings.emailNotificationsEnabled !== "false"}
                    onCheckedChange={(checked) => handleChange("emailNotificationsEnabled", String(checked))}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Click-to-Chat Buttons</p>
                    <p className="text-[11px] text-slate-500">
                      Provide 1-click pre-filled WhatsApp action buttons for Admin dispatchers
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsappClickToChatEnabled !== "false"}
                    onCheckedChange={(checked) => handleChange("whatsappClickToChatEnabled", String(checked))}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">New Consignment Booking Alert</p>
                    <p className="text-[11px] text-slate-500">Notify dispatch desk when a new consignment bilty is saved</p>
                  </div>
                  <Switch
                    checked={settings.newBiltyNotification !== "false"}
                    onCheckedChange={(checked) => handleChange("newBiltyNotification", String(checked))}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Delivery Completed Alert</p>
                    <p className="text-[11px] text-slate-500">Notify upon successful consignee delivery sign-off</p>
                  </div>
                  <Switch
                    checked={settings.deliveryNotification !== "false"}
                    onCheckedChange={(checked) => handleChange("deliveryNotification", String(checked))}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Website Contact Form Notifications</p>
                    <p className="text-[11px] text-slate-500">Forward public contact inquiries directly to admin recipient email</p>
                  </div>
                  <Switch
                    checked={settings.contactFormNotification !== "false"}
                    onCheckedChange={(checked) => handleChange("contactFormNotification", String(checked))}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetModalCategory("NOTIFICATIONS")}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSave("Notifications", [
                    "adminNotificationEmail",
                    "emailNotificationsEnabled",
                    "whatsappClickToChatEnabled",
                    "newBiltyNotification",
                    "deliveryNotification",
                    "contactFormNotification",
                  ])
                }
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Notification Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 6. THEME SETTINGS */}
        <TabsContent value="theme" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-spd-red" />
                    Theme & Visual Display Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Select your preferred interface color mode. Both modes feature high-contrast readability.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  CATEGORY: THEME
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Theme Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Mode Card */}
                <div
                  onClick={() => {
                    setTheme("light");
                    handleChange("themeMode", "light");
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-3 ${
                    theme === "light"
                      ? "border-spd-red bg-red-50/50 dark:bg-red-950/20 ring-2 ring-spd-red/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Light Mode</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clean white background with crisp, dark text for daylight operations.
                    </p>
                  </div>
                  {theme === "light" && (
                    <Badge className="bg-spd-red text-white text-[10px] font-bold">Active Theme</Badge>
                  )}
                </div>

                {/* Dark Mode Card */}
                <div
                  onClick={() => {
                    setTheme("dark");
                    handleChange("themeMode", "dark");
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-3 ${
                    theme === "dark"
                      ? "border-spd-blue bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-spd-blue/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deep slate background with bright, readable white text for night shifts.
                    </p>
                  </div>
                  {theme === "dark" && (
                    <Badge className="bg-spd-blue text-white text-[10px] font-bold">Active Theme</Badge>
                  )}
                </div>

                {/* System Mode Card */}
                <div
                  onClick={() => {
                    setTheme("system");
                    handleChange("themeMode", "system");
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-3 ${
                    theme === "system"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-600/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">System Default</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Automatically syncs with your operating system or device display settings.
                    </p>
                  </div>
                  {theme === "system" && (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Active Theme</Badge>
                  )}
                </div>
              </div>

              {/* Theme Contrast Guarantee Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-2 text-xs">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> High-Contrast Readability Guarantee
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border text-[11px]">
                    <span className="font-bold block text-slate-900 dark:text-white">Light Mode Quality:</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Guaranteed dark text on light surfaces. Never washed out or hard to read.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-white border text-[11px]">
                    <span className="font-bold block text-white">Dark Mode Quality:</span>
                    <span className="text-slate-300">
                      Guaranteed white text on dark surfaces with clear border separations.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTheme("system");
                  setResetModalCategory("THEME");
                }}
                className="text-xs text-slate-500 hover:text-red-600 rounded-xl gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </Button>

              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSave("Theme", ["themeMode", "themePersistence"])}
                className="bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md gap-2 px-5 h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Theme Preference</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SAFEGUARD RESET CONFIRMATION MODAL */}
      <Dialog open={!!resetModalCategory} onOpenChange={() => setResetModalCategory(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Reset {resetModalCategory} Settings?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Are you sure you want to restore standard system defaults for this category?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-200">Safeguard Guarantee:</p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Resetting configuration settings will <strong>NEVER</strong> delete or alter any operational data:
            </p>
            <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5">
              <li>Consignments and Bilty records are safe</li>
              <li>Customers, Drivers, and Vehicles are safe</li>
              <li>Ledgers, Payments, and Cash Books are safe</li>
              <li>Historical tracking timelines remain intact</li>
            </ul>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetModalCategory(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={resetting}
              onClick={handleConfirmReset}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Confirm & Reset Settings</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
