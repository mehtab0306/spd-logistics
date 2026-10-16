import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  FileText,
  MapPin,
  Warehouse,
  Building2,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
} from "lucide-react";
import { SPD_SERVICES_LIST, ServiceItem } from "@/lib/services-data";

export const metadata = {
  title: "Commercial Logistics Services | SPD Logistics",
  description:
    "Explore SPD Logistics' nationwide commercial transport services: Full Truck Load (FTL), Bilty Booking, Real-Time Tracking, Warehouse Hubs, and Corporate Logistics.",
};

export default function ServicesPage() {
  const getIcon = (name: ServiceItem["iconName"]) => {
    switch (name) {
      case "Package":
        return <Package className="w-8 h-8 text-spd-red" />;
      case "Truck":
        return <Truck className="w-8 h-8 text-spd-blue" />;
      case "FileText":
        return <FileText className="w-8 h-8 text-spd-red" />;
      case "MapPin":
        return <MapPin className="w-8 h-8 text-spd-blue" />;
      case "Warehouse":
        return <Warehouse className="w-8 h-8 text-spd-red" />;
      case "Building2":
        return <Building2 className="w-8 h-8 text-spd-blue" />;
      default:
        return <Truck className="w-8 h-8 text-spd-blue" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/70 dark:bg-[#070B14]">
      {/* Hero Section */}
      <section className="bg-white dark:bg-[#0B0F19] py-16 md:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="container max-w-5xl px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider">
            Super Pak Data Goods Transport Co.
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
            Our Commercial Logistics <span className="text-spd-red">Services</span>
          </h1>
          <p className="max-w-[720px] text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Reliable inter-city road transport, dedicated full truckload fleet allocation, 4-sheet digital bilty issuance, and terminal warehousing across Pakistan.
          </p>
        </div>
      </section>

      {/* Services Grid with Clickable Cards & Arrows */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SPD_SERVICES_LIST.map((service) => {
              const isRed = service.colorTheme === "red";
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col justify-between p-8 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-spd-red/50 dark:hover:border-spd-red/60 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 card-hover-lift block cursor-pointer"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl ${
                          isRed ? "bg-spd-red/10" : "bg-spd-blue/10"
                        } flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        {getIcon(service.iconName)}
                      </div>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          isRed
                            ? "bg-spd-red/10 text-spd-red"
                            : "bg-spd-blue/10 text-spd-blue"
                        }`}
                      >
                        {service.badge}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-slate-950 dark:text-white mb-2 group-hover:text-spd-red dark:group-hover:text-red-400 transition-colors">
                        {service.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {service.shortDesc}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 mb-2.5">
                        Operational Highlights
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {service.features.slice(0, 3).map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-spd-red mt-1.5 shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      View Fleet &amp; Route Matrix
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-spd-red group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container max-w-4xl px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Need a Custom Freight Tariff or Dedicated Contract?
          </h2>
          <p className="max-w-2xl text-slate-300 text-sm md:text-base leading-relaxed">
            Contact our Operations Management directly on WhatsApp or Call for instant fleet quotations and corporate khata onboarding.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20need%20custom%20freight%20rates%20for%20SPD%20Logistics."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 h-12 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Hammad (0325 2024433)</span>
            </a>
            <Link href="/contact">
              <Button
                variant="outline"
                className="text-white border-slate-700 hover:bg-slate-800 font-bold text-sm h-12 px-6 rounded-xl"
              >
                <span>Online Freight Inquiry</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
