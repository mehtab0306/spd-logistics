import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Package,
  Truck,
  FileText,
  MapPin,
  Warehouse,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Phone,
  MessageSquare,
  ShieldCheck,
  Clock,
  Compass,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPD_SERVICES, SPD_SERVICES_LIST, ServiceItem } from "@/lib/services-data";

export function generateStaticParams() {
  return SPD_SERVICES_LIST.map((service) => ({
    slug: service.slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const service = SPD_SERVICES[params.slug];
  if (!service) {
    return { title: "Service Not Found | SPD Logistics" };
  }
  return {
    title: `${service.title} | SPD Logistics`,
    description: service.shortDesc,
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = SPD_SERVICES[params.slug];

  if (!service) {
    notFound();
  }

  const isRed = service.colorTheme === "red";

  const getIcon = (name: ServiceItem["iconName"]) => {
    switch (name) {
      case "Package":
        return <Package className="w-8 h-8" />;
      case "Truck":
        return <Truck className="w-8 h-8" />;
      case "FileText":
        return <FileText className="w-8 h-8" />;
      case "MapPin":
        return <MapPin className="w-8 h-8" />;
      case "Warehouse":
        return <Warehouse className="w-8 h-8" />;
      case "Building2":
        return <Building2 className="w-8 h-8" />;
      default:
        return <Truck className="w-8 h-8" />;
    }
  };

  const encodedWhatsApp = encodeURIComponent(service.whatsappMessage);
  const whatsappUrl = `https://wa.me/923252024433?text=${encodedWhatsApp}`;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 py-12 md:py-20 relative">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 space-y-12 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/#services-section"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-spd-red dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Logistics Services</span>
          </Link>
        </div>

        {/* Hero Banner Header */}
        <div className="p-6 md:p-10 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isRed
                    ? "bg-spd-red/10 text-spd-red dark:bg-red-950/50 dark:text-red-400"
                    : "bg-spd-blue/10 text-spd-blue dark:bg-blue-950/50 dark:text-blue-400"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{service.badge}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
                {service.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl font-medium leading-relaxed">
                {service.subtitle}
              </p>
            </div>

            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${
                isRed
                  ? "bg-spd-red/10 text-spd-red border border-spd-red/20"
                  : "bg-spd-blue/10 text-spd-blue border border-spd-blue/20"
              } flex items-center justify-center shrink-0 shadow-inner`}
            >
              {getIcon(service.iconName)}
            </div>
          </div>

          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
            {service.shortDesc}
          </p>

          {/* Quick CTA Button Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-6 h-12 rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct WhatsApp Inquiry (Hammad)</span>
            </a>

            <Link href={service.primaryActionHref}>
              <Button
                className={`font-bold text-xs md:text-sm h-12 px-6 rounded-xl shadow-md gap-2 ${
                  isRed
                    ? "bg-red-700 hover:bg-red-800 text-white"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
              >
                <span>{service.primaryActionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            {service.secondaryActionHref && (
              <Link href={service.secondaryActionHref}>
                <Button
                  variant="outline"
                  className="font-bold text-xs md:text-sm h-12 px-5 rounded-xl border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <span>{service.secondaryActionLabel}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Section 1: Fleet Options & Vehicle Allocations */}
        {service.fleetOptions && service.fleetOptions.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-spd-red" />
              <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
                Dedicated Fleet Options &amp; Loading Capacities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {service.fleetOptions.map((fleet, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                    Configuration {i + 1}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {fleet.type}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500">
                      Payload: <strong className="text-slate-800 dark:text-slate-200">{fleet.payload}</strong>
                    </p>
                    <p className="text-slate-500">
                      Volume: <strong className="text-slate-800 dark:text-slate-200">{fleet.volume}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {fleet.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Key Operational Features */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
              Service Specifications &amp; Operational Guarantees
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.features.map((feat, index) => (
              <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Cargo Route Matrix */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Compass className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
                Cargo Route Matrix &amp; Scheduled Transit Times
              </h2>
              <p className="text-xs text-slate-500">
                Primary economic transit corridors serviced with daily departures from Karachi and Lahore hubs.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-extrabold tracking-wider">
                  <th className="p-3.5">Corridor / Lane</th>
                  <th className="p-3.5">Transit Time</th>
                  <th className="p-3.5">Departure Frequency</th>
                  <th className="p-3.5">Terminal Ingress &amp; Egress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {service.routeMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.corridor}
                    </td>
                    <td className="p-3.5 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.transitTime}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.frequency}
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 text-xs">
                      {item.departureTerminals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Contact Help Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black">
              Need custom tariff or specialized vehicle configuration?
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Our 24/7 Operations Desk at Hawksbay Karachi and Saggian Bypass Lahore is available to arrange immediate loading and contract freight quotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+923252024433"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm px-5 h-11 rounded-xl border border-slate-700"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call 0325 2024433</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-5 h-11 rounded-xl shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Inquiry</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
