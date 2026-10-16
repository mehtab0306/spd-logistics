"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageCircle,
  Building2,
  CheckCircle2,
  Package,
  Truck,
  Loader2,
  Code2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<"customer" | "broker">("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Customer Form State
  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
    originCity: "",
    destinationCity: "",
    cargoDescription: "",
    estimatedWeight: "",
    message: "",
  });

  // Broker Form State
  const [brokerForm, setBrokerForm] = useState({
    brokerName: "",
    whatsapp: "",
    email: "",
    operatingCity: "",
    vehicleType: "22-Wheeler Trailer",
    vehicleRegNo: "",
    preferredRoutes: "Karachi ➔ Lahore Corridor",
    expectedTerms: "",
  });

  // Phone validation helper for Pakistani numbers (03XX or +923XX)
  const isValidPkPhone = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, "");
    return clean.length >= 10 && clean.length <= 13;
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.fullName.trim()) {
      toast.error("Baraye meherbani apna poora naam darj karein.");
      return;
    }
    if (!customerForm.whatsapp.trim() || !isValidPkPhone(customerForm.whatsapp)) {
      toast.error("Durust Pakistani WhatsApp number darj karein (e.g. 0325 2024433).");
      return;
    }
    if (!customerForm.originCity.trim() || !customerForm.destinationCity.trim()) {
      toast.error("Origin aur Destination shehar darj karna zaroori hai.");
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "CUSTOMER",
          fullName: customerForm.fullName,
          phone: customerForm.whatsapp,
          email: customerForm.email || "superpakdatawale@gmail.com",
          originCity: customerForm.originCity,
          destinationCity: customerForm.destinationCity,
          cargoDescription: customerForm.cargoDescription,
          estimatedWeight: customerForm.estimatedWeight,
          message: customerForm.message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Save to local storage for instant admin inquiry badges
        if (typeof window !== "undefined") {
          try {
            const inquiries = JSON.parse(localStorage.getItem("spd_contact_inquiries") || "[]");
            inquiries.unshift({
              id: "inq-" + Date.now(),
              type: "CUSTOMER",
              name: customerForm.fullName,
              phone: customerForm.whatsapp,
              email: customerForm.email,
              origin: customerForm.originCity,
              destination: customerForm.destinationCity,
              cargo: customerForm.cargoDescription,
              weight: customerForm.estimatedWeight,
              message: customerForm.message,
              createdAt: new Date().toISOString(),
              status: "NEW",
            });
            localStorage.setItem("spd_contact_inquiries", JSON.stringify(inquiries.slice(0, 50)));
            window.dispatchEvent(new CustomEvent("spd-notifications-updated"));
          } catch {}
        }

        const msg = data.message || "Shukriya! Aap ki inquiry superpakdatawale@gmail.com par pohnch chuki hai. Hamari operations team foran rabta karegi.";
        setSuccessMessage(msg);
        setIsSuccess(true);
        toast.success("Inquiry Dispatched Successfully!", {
          description: "Delivered to superpakdatawale@gmail.com",
        });

        // Reset form
        setCustomerForm({
          fullName: "",
          whatsapp: "",
          email: "",
          originCity: "",
          destinationCity: "",
          cargoDescription: "",
          estimatedWeight: "",
          message: "",
        });
      } else {
        toast.error("Submission failed", {
          description: data.message || "Please check your inputs and try again.",
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Unable to dispatch email. Direct WhatsApp helpline: 0325 2024433.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerForm.brokerName.trim()) {
      toast.error("Baraye meherbani Transporter / Broker ka naam darj karein.");
      return;
    }
    if (!brokerForm.whatsapp.trim() || !isValidPkPhone(brokerForm.whatsapp)) {
      toast.error("Durust Pakistani WhatsApp number darj karein (e.g. 0300 2024433).");
      return;
    }
    if (!brokerForm.operatingCity.trim()) {
      toast.error("Operating Base City darj karein (e.g. Karachi, Lahore, Faisalabad).");
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "BROKER",
          fullName: brokerForm.brokerName,
          phone: brokerForm.whatsapp,
          email: brokerForm.email || "superpakdatawale@gmail.com",
          operatingCity: brokerForm.operatingCity,
          vehicleType: brokerForm.vehicleType,
          vehicleRegNo: brokerForm.vehicleRegNo,
          preferredRoutes: brokerForm.preferredRoutes,
          expectedTerms: brokerForm.expectedTerms,
          message: `Broker Fleet Registration. Base: ${brokerForm.operatingCity}. Vehicle: ${brokerForm.vehicleType} (${brokerForm.vehicleRegNo || "N/A"}). Routes: ${brokerForm.preferredRoutes}. Terms: ${brokerForm.expectedTerms || "Standard"}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (typeof window !== "undefined") {
          try {
            const inquiries = JSON.parse(localStorage.getItem("spd_contact_inquiries") || "[]");
            inquiries.unshift({
              id: "brk-" + Date.now(),
              type: "BROKER",
              name: brokerForm.brokerName,
              phone: brokerForm.whatsapp,
              email: brokerForm.email,
              operatingCity: brokerForm.operatingCity,
              vehicleType: brokerForm.vehicleType,
              vehicleRegNo: brokerForm.vehicleRegNo,
              preferredRoutes: brokerForm.preferredRoutes,
              expectedTerms: brokerForm.expectedTerms,
              createdAt: new Date().toISOString(),
              status: "NEW",
            });
            localStorage.setItem("spd_contact_inquiries", JSON.stringify(inquiries.slice(0, 50)));
            window.dispatchEvent(new CustomEvent("spd-notifications-updated"));
          } catch {}
        }

        const msg = data.message || "Shukriya! Aap ki inquiry superpakdatawale@gmail.com par pohnch chuki hai. Hamari operations team foran rabta karegi.";
        setSuccessMessage(msg);
        setIsSuccess(true);
        toast.success("Broker Registration Dispatched!", {
          description: "Delivered to superpakdatawale@gmail.com",
        });

        // Reset form
        setBrokerForm({
          brokerName: "",
          whatsapp: "",
          email: "",
          operatingCity: "",
          vehicleType: "22-Wheeler Trailer",
          vehicleRegNo: "",
          preferredRoutes: "Karachi ➔ Lahore Corridor",
          expectedTerms: "",
        });
      } else {
        toast.error("Submission failed", {
          description: data.message || "Please check your inputs and try again.",
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Unable to dispatch email. Direct WhatsApp helpline: 0325 2024433.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* Header Section with Official Branding */}
      <section className="py-14 md:py-18 bg-white dark:bg-[#111827] border-b border-border text-center">
        <div className="container px-4 md:px-6 mx-auto space-y-4">
          <div className="inline-block transition-transform duration-300 hover:scale-105">
            <img
              src="/images/spd-logo.jpg"
              alt="SPD Super Pak Data Goods Transport Co. Est. 1996"
              className="h-20 sm:h-28 w-auto object-contain mx-auto rounded-2xl shadow-md border border-slate-200/80 bg-white p-1"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider">
            Super Pak Data Goods Transport Co. &bull; Est. 1996
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Contact SPD Logistics
          </h1>
          <p className="max-w-[650px] mx-auto text-muted-foreground text-sm md:text-base font-medium">
            Direct communication with executive operations, consignment booking dispatchers, and central logistics freight terminals.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-border">
            <Mail className="w-3.5 h-3.5 text-spd-blue" />
            <span>Official Email Destination:</span>
            <a href="mailto:superpakdatawale@gmail.com" className="text-spd-blue font-bold hover:underline">
              superpakdatawale@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
            
            {/* Sidebar Contact Cards */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Executive Management Card */}
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-spd-red" />
                  <span>Executive Management</span>
                </h3>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-border shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                      MD
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Owner / Managing Director</p>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">Hammad Faisal Bhatti</p>
                      <a href="tel:03252024433" className="font-mono font-bold text-sm text-spd-red hover:underline block mt-0.5">
                        0325 2024433
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                      CEO
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Founder / CEO</p>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">Faisal Hussain Bhatti</p>
                      <a href="tel:03002024433" className="font-mono font-bold text-sm text-spd-blue hover:underline block mt-0.5">
                        0300 2024433
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Official Company Email</p>
                      <a href="mailto:superpakdatawale@gmail.com" className="font-bold text-xs text-spd-blue hover:underline break-all block mt-0.5">
                        superpakdatawale@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Primary WhatsApp Action Button */}
                  <a
                    href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20freight%20services."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry (0325 2024433)</span>
                  </a>
                </div>
              </div>

              {/* Commercial Terminals Card */}
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-spd-blue" />
                  <span>Commercial Terminals</span>
                </h3>
                <div className="space-y-3.5">
                  {/* Karachi Warehouse */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-red/25 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-red font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                        <h4>1. Karachi Freight Hub</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hawksbay Truck Stand, Maripur Road, Karachi.
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Terminal Incharge: Hammad (0325-2024433)
                    </p>
                    <a
                      href="https://maps.app.goo.gl/GMiBWWiCET8apVMr7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-spd-blue hover:underline pt-1"
                    >
                      <span>View on Google Maps</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Lahore Warehouse */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-blue/25 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-blue font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                        <h4>2. Lahore Freight Hub</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Saggian Bypass & Bhati Gate Stand, Lahore.
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Terminal Incharge: Faisal (0300-2024433)
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical / Portal Support Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                    <Code2 className="w-4 h-4 text-spd-red" />
                    <span>Technical Support</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                    System
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Software architecture, API tracking, portal access, or technical maintenance queries:
                </p>
                <div className="pt-1">
                  <p className="font-extrabold text-sm text-white">Mehtab</p>
                  <a
                    href="https://wa.me/923147194861?text=Hello%20Mehtab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20Software%20Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp: +92 314 7194861</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Main Interactive Form with Modern Dual-Tab Switcher */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-border bg-white dark:bg-[#111827] overflow-hidden rounded-3xl">
                <div className="h-2 w-full bg-gradient-to-r from-spd-red via-purple-600 to-spd-blue"></div>
                <CardContent className="p-6 sm:p-9 space-y-6">
                  
                  {/* Form Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                        Dispatch Operations Portal
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Submissions transmit high-density email directly to <strong className="text-spd-blue font-bold">superpakdatawale@gmail.com</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-extrabold self-start sm:self-auto">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Live 24/7 Dispatch</span>
                    </div>
                  </div>

                  {/* Dual-Tab Switcher */}
                  <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("customer");
                        setIsSuccess(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 ${
                        activeTab === "customer"
                          ? "bg-white dark:bg-slate-900 text-spd-red shadow-sm border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span className="truncate">📦 Cargo Booking &amp; Shipper</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("broker");
                        setIsSuccess(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 ${
                        activeTab === "broker"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span className="truncate">🚛 Transporter &amp; Broker</span>
                    </button>
                  </div>

                  {/* Success Confirmation Alert */}
                  {isSuccess && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm">Shukriya! Inquiry Pohnch Chuki Hai</h4>
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                          {successMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 1: General Cargo Inquiry & Booking */}
                  {activeTab === "customer" && (
                    <form onSubmit={handleCustomerSubmit} className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Full Name / Company Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. Adamjee Dura Built / Muhammad Ali"
                            value={customerForm.fullName}
                            onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            WhatsApp / Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. 0325 2024433"
                            value={customerForm.whatsapp}
                            onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            placeholder="client@company.com"
                            value={customerForm.email}
                            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Origin City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. Karachi Hawksbay"
                            value={customerForm.originCity}
                            onChange={(e) => setCustomerForm({ ...customerForm, originCity: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Destination City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. Lahore Saggian"
                            value={customerForm.destinationCity}
                            onChange={(e) => setCustomerForm({ ...customerForm, destinationCity: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Cargo Description
                          </label>
                          <Input
                            placeholder="e.g. Industrial Chemicals, PVC Pipes, Cartons"
                            value={customerForm.cargoDescription}
                            onChange={(e) => setCustomerForm({ ...customerForm, cargoDescription: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Estimated Cargo Weight
                          </label>
                          <Input
                            placeholder="e.g. 25 Tons / 100 Cartons / Full Truck"
                            value={customerForm.estimatedWeight}
                            onChange={(e) => setCustomerForm({ ...customerForm, estimatedWeight: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Consignment Message &amp; Dispatch Instructions
                        </label>
                        <Textarea
                          placeholder="Provide details about loading schedule, warehouse requirements, or specialized cargo handling..."
                          rows={4}
                          value={customerForm.message}
                          onChange={(e) => setCustomerForm({ ...customerForm, message: e.target.value })}
                          className="resize-none font-medium text-sm"
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-spd-red hover:bg-spd-red/90 text-white font-black h-12 px-8 rounded-xl shadow-md gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending to superpakdatawale@gmail.com...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Dispatch Booking Inquiry</span>
                            </>
                          )}
                        </Button>

                        <a
                          href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20inquiring%20about%20cargo%20transport%20booking%20with%20SPD%20Logistics."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Direct WhatsApp (0325 2024433)</span>
                        </a>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: Transporter & Broker Attachment */}
                  {activeTab === "broker" && (
                    <form onSubmit={handleBrokerSubmit} className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Broker / Fleet Owner Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. Haji Muhammad Tariq / Al-Madina Goods"
                            value={brokerForm.brokerName}
                            onChange={(e) => setBrokerForm({ ...brokerForm, brokerName: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            WhatsApp Contact <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. 0300 8451290"
                            value={brokerForm.whatsapp}
                            onChange={(e) => setBrokerForm({ ...brokerForm, whatsapp: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Operating Base City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. Karachi / Lahore / Faisalabad"
                            value={brokerForm.operatingCity}
                            onChange={(e) => setBrokerForm({ ...brokerForm, operatingCity: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Email (Optional)
                          </label>
                          <Input
                            type="email"
                            placeholder="broker@transport.com"
                            value={brokerForm.email}
                            onChange={(e) => setBrokerForm({ ...brokerForm, email: e.target.value })}
                            className="h-11 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Vehicle Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={brokerForm.vehicleType}
                            onChange={(e) => setBrokerForm({ ...brokerForm, vehicleType: e.target.value })}
                            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="22-Wheeler Trailer">22-Wheeler Trailer (35-50 Tons Heavy Linehaul)</option>
                            <option value="10-Wheeler Bedford">10-Wheeler Bedford (15-20 Tons Commercial)</option>
                            <option value="6-Wheeler Mazda">6-Wheeler Mazda (5-8 Tons Local/Intercity)</option>
                            <option value="Flatbed Container Carrier">Flatbed Container Carrier (20ft / 40ft)</option>
                            <option value="Lowbed Heavy Equipment">Lowbed Heavy Equipment Carrier</option>
                            <option value="Other Commercial Fleet">Other Commercial Transport Fleet</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Vehicle Registration Number
                          </label>
                          <Input
                            placeholder="e.g. TLR-786 / KHI-9922 / LHR-4512"
                            value={brokerForm.vehicleRegNo}
                            onChange={(e) => setBrokerForm({ ...brokerForm, vehicleRegNo: e.target.value })}
                            className="h-11 font-medium uppercase font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Preferred Routes &amp; Regular Corridors
                        </label>
                        <Input
                          placeholder="e.g. Karachi ➔ Lahore, Karachi ➔ Rawalpindi/KPK, Punjab Intra-city"
                          value={brokerForm.preferredRoutes}
                          onChange={(e) => setBrokerForm({ ...brokerForm, preferredRoutes: e.target.value })}
                          className="h-11 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tariff Expectations / Fleet Terms &amp; Driver Notes
                        </label>
                        <Textarea
                          placeholder="Provide details regarding driver advances, fuel payment terms, round-trip availability, or fleet capacity..."
                          rows={4}
                          value={brokerForm.expectedTerms}
                          onChange={(e) => setBrokerForm({ ...brokerForm, expectedTerms: e.target.value })}
                          className="resize-none font-medium text-sm"
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-black h-12 px-8 rounded-xl shadow-md gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Registering Fleet to superpakdatawale@gmail.com...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4" />
                              <span>Register Fleet &amp; Broker</span>
                            </>
                          )}
                        </Button>

                        <a
                          href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20a%20vehicle%20owner/broker%20interested%20in%20attaching%20my%20fleet%20with%20SPD%20Logistics."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp Broker Desk (0325 2024433)</span>
                        </a>
                      </div>
                    </form>
                  )}

                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
