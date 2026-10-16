"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  FileText,
  MapPin,
  Warehouse,
  Building2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { SPD_SERVICES_LIST, ServiceItem } from "@/lib/services-data";

export function ServicesSection() {
  const getIcon = (name: ServiceItem["iconName"]) => {
    switch (name) {
      case "Package":
        return <Package className="w-6 h-6" />;
      case "Truck":
        return <Truck className="w-6 h-6" />;
      case "FileText":
        return <FileText className="w-6 h-6" />;
      case "MapPin":
        return <MapPin className="w-6 h-6" />;
      case "Warehouse":
        return <Warehouse className="w-6 h-6" />;
      case "Building2":
        return <Building2 className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  return (
    <section
      id="services-section"
      className="w-full py-20 lg:py-28 bg-slate-50/75 dark:bg-[#0e1422]/75 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10"
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="reveal-init reveal-blur flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-blue/10 text-spd-blue font-extrabold text-xs uppercase tracking-wider">
            Comprehensive Transport Solutions
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-slate-950 dark:text-white">
            Our Professional Logistics Services
          </h2>
          <p className="max-w-[700px] text-slate-600 dark:text-slate-400 text-sm md:text-base font-normal">
            Tailored commercial transport services engineered for efficiency, speed, and reliable consignment delivery across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {SPD_SERVICES_LIST.map((service, idx) => {
            const isRed = service.colorTheme === "red";
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className={`reveal-init reveal-up stagger-${
                  (idx % 6) + 1
                } group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 ${
                  isRed
                    ? "hover:border-spd-red/40 dark:hover:border-spd-red/50"
                    : "hover:border-spd-blue/40 dark:hover:border-spd-blue/50"
                } hover:shadow-xl transition-all duration-300 card-hover-lift cursor-pointer block text-left`}
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl ${
                      isRed
                        ? "bg-spd-red/10 text-spd-red"
                        : "bg-spd-blue/10 text-spd-blue"
                    } flex items-center justify-center mb-4 group-hover:scale-110 ${
                      idx % 2 === 0 ? "group-hover:rotate-3" : "group-hover:-rotate-3"
                    } transition-transform duration-300`}
                  >
                    {getIcon(service.iconName)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2 group-hover:text-spd-red dark:group-hover:text-red-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {service.shortDesc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold ${
                      isRed ? "text-spd-red" : "text-spd-blue"
                    }`}
                  >
                    {service.badge}
                  </span>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold ${
                      isRed ? "text-spd-red" : "text-spd-blue"
                    } group-hover:translate-x-1 transition-transform`}
                  >
                    <span>Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
