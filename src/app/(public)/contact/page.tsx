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
  AlertCircle,
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
  const [statusAlert, setStatusAlert] = useState<{
    type: "success" | "error";
    message: string;
    refId?: string;
  } | null>(null);

  // TAB A: Customer Form State
  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
    originCity: "",
    destinationCity: "",
    cargoDescription: "",
    estimatedWeight: "",
    message: "",
    _hp_website: "", // Honeypot
  });

  // TAB B: Broker Form State
  const [brokerForm, setBrokerForm] = useState({
    brokerName: "",
    companyName: "",
    whatsapp: "",
    email: "",
    operatingCity: "",
    vehicleType: "22-Wheeler Trailer",
    vehicleRegNo: "",
    preferredRoutes: "Karachi ➔ Lahore Corridor",
    expectedTerms: "",
    _hp_website: "", // Honeypot
  });

  // Phone validation helper for Pakistani numbers (03XX or +923XX)
  const isValidPkPhone = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, "");
    return clean.length >= 10 && clean.length <= 13;
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setStatusAlert(null);

    const payload = {
      fullName: customerForm.fullName?.trim() || "Visitor / Anonymous",
      phone: customerForm.whatsapp?.trim() || "Not Provided",
      email: customerForm.email?.trim() || "Not Provided",
      origin: customerForm.originCity?.trim() || 'Not Specified',
      destination: customerForm.destinationCity?.trim() || 'Not Specified',
      originCity: customerForm.originCity?.trim() || 'Not Specified',
      destinationCity: customerForm.destinationCity?.trim() || 'Not Specified',
      cargoDetails: customerForm.cargoDescription?.trim() || 'N/A',
      weight: customerForm.estimatedWeight?.trim() || '',
      message: customerForm.message?.trim() || "No message written",
      type: 'CUSTOMER_INQUIRY',
      inquiryType: 'CUSTOMER',
      _hp_website: customerForm._hp_website,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const successMsg = "Thank you! Your message has been sent successfully. Our team will contact you shortly.";
        setStatusAlert({
          type: "success",
          message: successMsg,
          refId: data.refId,
        });

        toast.success(successMsg, {
          description: data.refId ? `Reference ID: ${data.refId}` : undefined,
        });

        setCustomerForm({
          fullName: "",
          whatsapp: "",
          email: "",
          originCity: "",
          destinationCity: "",
          cargoDescription: "",
          estimatedWeight: "",
          message: "",
          _hp_website: "",
        });
      } else {
        const errorMsg = "Message delivery failed. Please contact us directly via WhatsApp.";
        setStatusAlert({
          type: "error",
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Message delivery failed. Please contact us directly via WhatsApp.";
      setStatusAlert({
        type: "error",
        message: errorMsg,
      });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setStatusAlert(null);

    const payload = {
      type: "BROKER_REGISTRATION",
      inquiryType: "BROKER",
      fullName: brokerForm.brokerName?.trim() || "Transporter / Broker",
      brokerName: brokerForm.brokerName?.trim() || "Transporter / Broker",
      companyName: brokerForm.companyName?.trim() || '',
      phone: brokerForm.whatsapp?.trim() || "Not Provided",
      email: brokerForm.email?.trim() || "Not Provided",
      operatingCity: brokerForm.operatingCity?.trim() || "Not Specified",
      vehicleType: brokerForm.vehicleType || "Commercial Carrier",
      vehicleNumber: brokerForm.vehicleRegNo?.trim() || "Unassigned",
      vehicleRegNo: brokerForm.vehicleRegNo?.trim() || "Unassigned",
      preferredRoutes: brokerForm.preferredRoutes?.trim() || "All Pakistan",
      tariffExpectations: brokerForm.expectedTerms?.trim() || "Standard",
      expectedTerms: brokerForm.expectedTerms?.trim() || "Standard",
      message: brokerForm.expectedTerms?.trim() || `Fleet Registration: Base ${brokerForm.operatingCity || 'All Pakistan'}, Vehicle ${brokerForm.vehicleType || 'Commercial'}`,
      _hp_website: brokerForm._hp_website,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const successMsg = "Thank you! Your message has been sent successfully. Our team will contact you shortly.";
        setStatusAlert({
          type: "success",
          message: successMsg,
          refId: data.refId,
        });

        toast.success(successMsg, {
          description: data.refId ? `Reference ID: ${data.refId}` : undefined,
        });

        setBrokerForm({
          brokerName: "",
          companyName: "",
          whatsapp: "",
          email: "",
          operatingCity: "",
          vehicleType: "22-Wheeler Trailer",
          vehicleRegNo: "",
          preferredRoutes: "Karachi ➔ Lahore Corridor",
          expectedTerms: "",
          _hp_website: "",
        });
      } else {
        const errorMsg = "Message delivery failed. Please contact us directly via WhatsApp.";
        setStatusAlert({
          type: "error",
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Message delivery failed. Please contact us directly via WhatsApp.";
      setStatusAlert({
        type: "error",
        message: errorMsg,
      });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* Header Section */}
      <section className="py-12 md:py-16 bg-white dark:bg-[#111827] border-b border-border text-center">
        <div className="container px-4 md:px-6 mx-auto space-y-3.5">
          <div className="inline-block transition-transform duration-300 hover:scale-105">
            <img
              src="/images/spd-logo.jpg"
              alt="SPD Super Pak Data Goods Transport Co. Est. 1996"
              className="h-20 sm:h-24 w-auto object-contain mx-auto rounded-2xl shadow-sm border border-slate-200/80 bg-white p-1"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider">
            Super Pak Data Goods Transport Co. &bull; Est. 1996
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Contact SPD Logistics
          </h1>
          <p className="max-w-[650px] mx-auto text-muted-foreground text-sm md:text-base font-medium">
            Professional Cargo &amp; Transportation Services across Pakistan. Direct dispatch to executive operations desk.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-border">
            <Mail className="w-3.5 h-3.5 text-spd-blue" />
            <span>Official Email:</span>
            <a href="mailto:superpakdatawale@gmail.com" className="text-spd-blue font-bold hover:underline">
              superpakdatawale@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Sidebar Contact Cards */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Executive Management Card */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-slate-900 dark:text-white flex items-center gap-2">
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

                  <a
                    href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20freight%20services."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry (0325 2024433)</span>
                  </a>
                </div>
              </div>

              {/* Verified Terminals Card */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-spd-blue" />
                  <span>Freight Operations Hubs</span>
                </h3>
                <div className="space-y-3">
                  {/* Karachi */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-red/25 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-red font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                        <h4>Karachi Freight Operations</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hawksbay Truck Stand, Maripur Road, Karachi.
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Operations Desk: Hammad (0325 2024433)
                    </p>
                    <a
                      href="https://maps.app.goo.gl/GMiBWWiCET8apVMr7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-spd-blue hover:underline pt-0.5"
                    >
                      <span>Google Maps Location</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Lahore */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-blue/25 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-blue font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                        <h4>Lahore Freight Operations</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Saggian Bypass &amp; Bhati Gate Stand, Lahore.
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Operations Desk: Faisal (0300 2024433)
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Support Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                    <Code2 className="w-4 h-4 text-spd-red" />
                    <span>Technical Support</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                    Engineering
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Technical maintenance, customer portal login, or system architecture inquiries:
                </p>
                <div>
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

            {/* Main Interactive Form with TAB Switcher */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-border bg-white dark:bg-[#111827] overflow-hidden rounded-3xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-spd-red via-purple-600 to-spd-blue"></div>
                <CardContent className="p-6 sm:p-9 space-y-6">
                  
                  {/* Form Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                        Dispatch Operations Portal
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Delivered securely to official inbox: <strong className="text-spd-blue font-bold">superpakdatawale@gmail.com</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Live 24/7 Dispatch</span>
                    </div>
                  </div>

                  {/* Dual-Tab Switcher */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("customer");
                        setStatusAlert(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 ${
                        activeTab === "customer"
                          ? "bg-white dark:bg-slate-900 text-spd-red shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-base">📦</span>
                      <span className="truncate">Tab A: Customer Cargo Inquiry</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("broker");
                        setStatusAlert(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 ${
                        activeTab === "broker"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-base">🚛</span>
                      <span className="truncate">Tab B: Transporter &amp; Broker Registration</span>
                    </button>
                  </div>

                  {/* Status Alerts (Success or Failure) */}
                  {statusAlert && statusAlert.type === "success" && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm">
                          {statusAlert.message || "Shukriya! Aap ki inquiry SPD Logistics ko bhej di gayi hai. Hamari team jald aap se rabta karegi."}
                        </h4>
                        {statusAlert.refId && (
                          <p className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            Reference ID: {statusAlert.refId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {statusAlert && statusAlert.type === "error" && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-200">
                      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm">Inquiry Not Dispatched</h4>
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                          {statusAlert.message}
                        </p>
                        <div className="pt-1">
                          <a
                            href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20an%20urgent%20SPD%20Logistics%20inquiry."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Click to chat directly with Hammad on WhatsApp (0325 2024433)</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB A: Customer Cargo Inquiry Form */}
                  {activeTab === "customer" && (
                    <form onSubmit={handleCustomerSubmit} className="space-y-4 animate-in fade-in duration-150">
                      
                      {/* Honeypot field (hidden from real users) */}
                      <input
                        type="text"
                        name="_hp_website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={customerForm._hp_website}
                        onChange={(e) => setCustomerForm({ ...customerForm, _hp_website: e.target.value })}
                        className="hidden"
                        style={{ display: "none" }}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Full Name
                          </label>
                          <Input
                            placeholder="Muhammad Ali / Company Name"
                            value={customerForm.fullName}
                            onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-spd-red"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            WhatsApp Number
                          </label>
                          <Input
                            placeholder="0325 2024433"
                            value={customerForm.whatsapp}
                            onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-spd-red"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Email Address (Optional)
                        </label>
                        <Input
                          type="email"
                          placeholder="client@company.com"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                          className="h-11 font-medium focus-visible:ring-spd-red"
                        />
                      </div>

                      {/* Route Inputs Cleanly in 2-Column Grid (Optional Fields) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Origin City (Optional)</label>
                          <Input 
                            type="text" 
                            placeholder="e.g. Lahore / Karachi" 
                            className="h-11 font-medium focus-visible:ring-spd-red" 
                            value={customerForm.originCity} 
                            onChange={(e) => setCustomerForm({ ...customerForm, originCity: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Destination City (Optional)</label>
                          <Input 
                            type="text" 
                            placeholder="e.g. Karachi / Quetta" 
                            className="h-11 font-medium focus-visible:ring-spd-red" 
                            value={customerForm.destinationCity} 
                            onChange={(e) => setCustomerForm({ ...customerForm, destinationCity: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Cargo Description
                          </label>
                          <Input
                            placeholder="Industrial Chemicals, Machinery, Cartons"
                            value={customerForm.cargoDescription}
                            onChange={(e) => setCustomerForm({ ...customerForm, cargoDescription: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-spd-red"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Estimated Weight
                          </label>
                          <Input
                            placeholder="25 Tons / 50 Cartons / Full Truck"
                            value={customerForm.estimatedWeight}
                            onChange={(e) => setCustomerForm({ ...customerForm, estimatedWeight: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-spd-red"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Message
                        </label>
                        <Textarea
                          placeholder="Provide details about consignment schedule, pickup location, or specialized cargo handling requirements..."
                          rows={4}
                          value={customerForm.message}
                          onChange={(e) => setCustomerForm({ ...customerForm, message: e.target.value })}
                          className="resize-none font-medium text-sm focus-visible:ring-spd-red"
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-spd-red hover:bg-spd-red/90 text-white font-black h-12 px-8 rounded-xl shadow-md gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending inquiry...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send Cargo Inquiry</span>
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

                  {/* TAB B: Transporter & Broker Registration Form */}
                  {activeTab === "broker" && (
                    <form onSubmit={handleBrokerSubmit} className="space-y-4 animate-in fade-in duration-150">
                      
                      {/* Honeypot field (hidden from real users) */}
                      <input
                        type="text"
                        name="_hp_website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={brokerForm._hp_website}
                        onChange={(e) => setBrokerForm({ ...brokerForm, _hp_website: e.target.value })}
                        className="hidden"
                        style={{ display: "none" }}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Broker / Owner Name
                          </label>
                          <Input
                            placeholder="Haji Tariq Khan"
                            value={brokerForm.brokerName}
                            onChange={(e) => setBrokerForm({ ...brokerForm, brokerName: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-purple-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Company Name (Optional)
                          </label>
                          <Input
                            placeholder="Al-Madina Goods Transport"
                            value={brokerForm.companyName}
                            onChange={(e) => setBrokerForm({ ...brokerForm, companyName: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            WhatsApp Number
                          </label>
                          <Input
                            placeholder="0300 8451290"
                            value={brokerForm.whatsapp}
                            onChange={(e) => setBrokerForm({ ...brokerForm, whatsapp: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-purple-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Email (Optional)
                          </label>
                          <Input
                            type="email"
                            placeholder="broker@fleet.com"
                            value={brokerForm.email}
                            onChange={(e) => setBrokerForm({ ...brokerForm, email: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-purple-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Operating Base City
                          </label>
                          <Input
                            placeholder="Karachi / Lahore / Multan"
                            value={brokerForm.operatingCity}
                            onChange={(e) => setBrokerForm({ ...brokerForm, operatingCity: e.target.value })}
                            className="h-11 font-medium focus-visible:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Vehicle Category
                          </label>
                          <select
                            value={brokerForm.vehicleType}
                            onChange={(e) => setBrokerForm({ ...brokerForm, vehicleType: e.target.value })}
                            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-600"
                          >
                            <option value="22-Wheeler Trailer">22-Wheeler Trailer (35-50 Tons Heavy Linehaul)</option>
                            <option value="10-Wheeler Bedford">10-Wheeler Bedford (15-20 Tons Commercial)</option>
                            <option value="6-Wheeler Mazda">6-Wheeler Mazda (5-8 Tons)</option>
                            <option value="Flatbed Container Carrier">Flatbed Container Carrier (20ft / 40ft)</option>
                            <option value="Lowbed Heavy Equipment">Lowbed Heavy Equipment Carrier</option>
                            <option value="Other Fleet">Other Commercial Transport Fleet</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Registration Number
                          </label>
                          <Input
                            placeholder="TLR-786 / KHI-9922 / LHR-4512"
                            value={brokerForm.vehicleRegNo}
                            onChange={(e) => setBrokerForm({ ...brokerForm, vehicleRegNo: e.target.value })}
                            className="h-11 font-medium uppercase font-mono focus-visible:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Preferred Routes
                        </label>
                        <Input
                          placeholder="Karachi ➔ Lahore Corridor, Karachi ➔ Rawalpindi/Islamabad, KPK"
                          value={brokerForm.preferredRoutes}
                          onChange={(e) => setBrokerForm({ ...brokerForm, preferredRoutes: e.target.value })}
                          className="h-11 font-medium focus-visible:ring-purple-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tariff Expectations / Notes
                        </label>
                        <Textarea
                          placeholder="Specify advance payment requirements, diesel terms, round-trip availability, or driver contact info..."
                          rows={4}
                          value={brokerForm.expectedTerms}
                          onChange={(e) => setBrokerForm({ ...brokerForm, expectedTerms: e.target.value })}
                          className="resize-none font-medium text-sm focus-visible:ring-purple-600"
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-black h-12 px-8 rounded-xl shadow-md gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending inquiry...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4" />
                              <span>Register Fleet &amp; Broker</span>
                            </>
                          )}
                        </Button>

                        <a
                          href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20a%20fleet%20transporter/broker%20interested%20in%20vehicle%20attachment%20with%20SPD%20Logistics."
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
