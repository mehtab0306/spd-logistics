"use client";

import React, { useState } from "react";
import { Send, MessageCircle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isSupabaseConfigured, safeCreateInquiry } from "@/lib/supabase";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      fullName: name?.trim() || "Website Visitor",
      name: name?.trim() || "Website Visitor",
      phone: phone?.trim() || "Not Provided",
      email: email?.trim() || "Not Provided",
      origin: origin?.trim() || "Direct Inquiry / General",
      destination: destination?.trim() || "Direct Inquiry / General",
      originCity: origin?.trim() || "Direct Inquiry / General",
      destinationCity: destination?.trim() || "Direct Inquiry / General",
      cargoDetails: message?.trim() || "Not Specified",
      cargo: message?.trim() || "Not Specified",
      message: message?.trim() || "Direct inquiry submitted from website.",
      type: "CUSTOMER_INQUIRY",
    };

    if (isSupabaseConfigured) {
      try {
        await safeCreateInquiry({
          type: "CUSTOMER_INQUIRY",
          service: "General Cargo Inquiry",
          name: payload.fullName,
          phone: payload.phone,
          email: payload.email,
          origin_city: payload.originCity,
          destination_city: payload.destinationCity,
          cargo_details: payload.cargoDetails,
          message: payload.message,
          notes: payload.message,
        });
      } catch (sbInqErr) {
        console.warn("Supabase inquiry insert notice:", sbInqErr);
      }
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok || isSupabaseConfigured) {
        toast.success("Thank you! Your inquiry has been submitted successfully. Our team will contact you shortly.");
        setName("");
        setPhone("");
        setEmail("");
        setOrigin("");
        setDestination("");
        setMessage("");
      } else {
        toast.error("Unable to send your inquiry right now. Please reach out to us directly via WhatsApp.");
      }
    } catch {
      if (isSupabaseConfigured) {
        toast.success("Thank you! Your inquiry has been submitted successfully.");
        setName("");
        setPhone("");
        setEmail("");
        setOrigin("");
        setDestination("");
        setMessage("");
      } else {
        toast.error("Unable to send your inquiry right now. Please reach out to us directly via WhatsApp.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDynamicWhatsAppUrl = (phoneTarget: "hammad" | "faisal" = "hammad") => {
    const targetNumber = phoneTarget === "hammad" ? "923252024433" : "923002024433";
    const contactName = phoneTarget === "hammad" ? "Hammad Sahab" : "Faisal Sahab";
    let text = `Assalam-o-Alaikum ${contactName},\n*SPD Logistics Inquiry*\n`;
    if (name.trim()) text += `*Name:* ${name.trim()}\n`;
    if (phone.trim()) text += `*Phone:* ${phone.trim()}\n`;
    if (origin.trim() || destination.trim()) {
      text += `*Route:* ${origin.trim() || "Karachi"} ➔ ${destination.trim() || "Lahore"}\n`;
    }
    if (message.trim()) text += `*Message:* ${message.trim()}\n`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text.trim())}`;
  };

  return (
    <section id="contact-section" className="w-full py-20 bg-slate-50/75 dark:bg-[#0e1422]/75 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
      <div className="container px-4 md:px-6 mx-auto max-w-4xl">
        <div className="text-center space-y-3 mb-12">
          <img
            src="/images/spd-logo.jpg"
            alt="SPD Logo"
            className="h-16 w-auto object-contain mx-auto mb-2 rounded-xl shadow-sm border border-slate-200/80 bg-white p-1"
          />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">Contact Us</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Send your cargo inquiry directly to <strong className="text-spd-blue">spdgoodstransport@gmail.com</strong> for instant freight quotation and dispatch scheduling.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Phone / WhatsApp
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Email Address (Optional)
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="your.email@example.com"
                className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
              />
            </div>

            {/* 2-column grid for City Routes (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Origin City (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Lahore / Karachi"
                  className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Destination City (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Karachi / Quetta"
                  className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter details regarding your cargo consignment, goods type, bilty requirements, origin, and destination..."
                className="min-h-[140px] bg-slate-50 dark:bg-slate-900 font-medium text-sm resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-spd-red hover:bg-spd-red/90 text-white font-extrabold px-8 h-12 shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending your inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </Button>

              <a
                href={getDynamicWhatsAppUrl("hammad")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                title="Send via WhatsApp (0325 2024433)"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send via WhatsApp (0325 2024433)</span>
              </a>

              <a
                href={getDynamicWhatsAppUrl("faisal")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-12 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 shadow-xs transition-all"
                title="WhatsApp CEO Faisal Hussain Bhatti (0300 2024433)"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp CEO (0300 2024433)</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
