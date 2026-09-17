"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  Search, 
  MapPin, 
  Warehouse, 
  PhoneCall, 
  Clock, 
  RotateCw, 
  ExternalLink 
} from "lucide-react";
import Link from "next/link";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  actionText?: string;
  actionHref?: string;
  icon: any;
  accentColor: string;
}

export function FaqFlipCards() {
  // Mobile tap-to-flip state
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqs: FaqItem[] = [
    {
      id: "booking",
      category: "Transport Booking",
      question: "How to book transport?",
      answer: "Contact our dispatch team via phone or WhatsApp (0325 2024433), or fill out the booking inquiry form on this website. We allocate suitable commercial vehicles and schedule immediate pickup.",
      actionText: "Chat on WhatsApp",
      actionHref: "https://wa.me/923252024433?text=Assalam-o-Alaikum%20I%20want%20to%20book%20goods%20transport.",
      icon: HelpCircle,
      accentColor: "from-spd-red/10 to-transparent text-spd-red border-spd-red/30",
    },
    {
      id: "tracking",
      category: "Bilty Tracking",
      question: "How can I track my bilty?",
      answer: "Enter your official Bilty Number (e.g. BLT-2026-001) or Tracking ID in the search bar on our homepage or tracking page to view real-time transit milestones from dispatch to delivery.",
      actionText: "Track Consignment",
      actionHref: "/tracking",
      icon: Search,
      accentColor: "from-spd-blue/10 to-transparent text-spd-blue border-spd-blue/30",
    },
    {
      id: "cities",
      category: "Nationwide Routes",
      question: "Which cities do you cover?",
      answer: "We provide nationwide trunk freight coverage connecting Karachi, Hyderabad, Sukkur, Multan, Faisalabad, Lahore, Gujranwala, Rawalpindi/Islamabad, and northern distribution hubs.",
      actionText: "View Network Map",
      actionHref: "#map-section",
      icon: MapPin,
      accentColor: "from-spd-red/10 to-transparent text-spd-red border-spd-red/30",
    },
    {
      id: "warehouses",
      category: "Commercial Storage",
      question: "Do you provide warehouse services?",
      answer: "Yes, SPD Logistics operates dedicated commercial staging and cross-docking warehouses at Hawksbay Rd Truck Stand in Karachi and our central Punjab terminal in Lahore.",
      actionText: "View Warehouses",
      actionHref: "#map-section",
      icon: Warehouse,
      accentColor: "from-spd-blue/10 to-transparent text-spd-blue border-spd-blue/30",
    },
    {
      id: "contact",
      category: "Direct Inquiries",
      question: "How can I contact SPD Logistics?",
      answer: "Reach Managing Director Hammad Faisal Bhatti at 0325 2024433, Founder Faisal Hussain Bhatti at 0300 2024433, or email superpakdatawale@gmail.com. We are active 24/7 for commercial dispatch.",
      actionText: "Email Us",
      actionHref: "mailto:superpakdatawale@gmail.com",
      icon: PhoneCall,
      accentColor: "from-spd-red/10 to-transparent text-spd-red border-spd-red/30",
    },
    {
      id: "delivery-time",
      category: "Transit Timelines",
      question: "How long does delivery take?",
      answer: "Standard express trunk shipments between Karachi and Punjab (Lahore/Faisalabad) typically arrive within 24 to 48 hours for FTL and scheduled bilty cargo dispatches.",
      actionText: "Inquire Transit Time",
      actionHref: "tel:03252024433",
      icon: Clock,
      accentColor: "from-spd-blue/10 to-transparent text-spd-blue border-spd-blue/30",
    },
  ];

  return (
    <section id="faq-section" className="w-full py-20 lg:py-28 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="reveal-init reveal-up text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider mb-3">
            Interactive Help & Answers
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Hover or tap any card to smoothly flip and reveal detailed operational logistics answers.
          </p>
        </div>

        {/* 3D Flip Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const isFlipped = !!flippedCards[faq.id];

            return (
              <div
                key={faq.id}
                onClick={() => toggleCard(faq.id)}
                className={`reveal-init reveal-zoom-in stagger-${index + 1} perspective-1000 group faq-card h-72 w-full cursor-pointer select-none ${
                  isFlipped ? "is-flipped" : ""
                }`}
              >
                {/* 3D Rotating Inner Card Container */}
                <div
                  className={`relative w-full h-full duration-500 transform-style-3d faq-card-inner transition-transform ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* FRONT OF CARD (Question) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-7 bg-slate-50 dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between transition-all group-hover:border-spd-red/50">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {faq.category}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-b ${faq.accentColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-950 dark:text-white leading-snug mt-3">
                        {faq.question}
                      </h3>
                    </div>

                    <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-1.5 text-spd-red font-bold">
                        <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                        Flip to view answer
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">SPD FAQ</span>
                    </div>
                  </div>

                  {/* BACK OF CARD (Answer) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-7 bg-gradient-to-br from-slate-900 via-[#111827] to-black text-white border-2 border-spd-red/50 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-spd-red text-white">
                          Verified Answer
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-bold">Est. 1996</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-200 mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>

                    {faq.actionText && (
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        {faq.actionHref?.startsWith("http") || faq.actionHref?.startsWith("mailto") || faq.actionHref?.startsWith("tel") ? (
                          <a
                            href={faq.actionHref}
                            target={faq.actionHref.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-spd-red hover:underline"
                          >
                            <span>{faq.actionText}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Link
                            href={faq.actionHref || "#"}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-spd-blue hover:underline"
                          >
                            <span>{faq.actionText}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <span className="text-[10px] text-slate-500">Click to flip back</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
