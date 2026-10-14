"use client";

import React from "react";

interface BiltyTransportHeaderProps {
  title: string;
  subtitle?: string;
  documentNumber?: string;
  date?: string;
  copyFor?: string;
  station?: string;
}

export function BiltyTransportHeader({
  title,
  subtitle,
  documentNumber,
  date,
  copyFor,
  station = "Head Office Station (Lahore)",
}: BiltyTransportHeaderProps) {
  const displayDate = date || new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border-b-2 border-black pb-2 mb-3 text-black font-sans">
      {/* Top Banner: Official Registered Transport Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <img
            src="/images/spd-logo.jpg"
            alt="SPD Logistics"
            className="h-16 w-16 object-contain rounded border border-slate-400 shrink-0 mt-0.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/spd-logo.png";
            }}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-red-700 uppercase leading-none">
              SUPER PAK DATA WALE GOODS TRANSPORT CO.®
            </h1>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mt-0.5">
              Nationwide Cargo, Container & Fleet Logistics • NTN: 1692873-3 • STRN: 17-00-1692-873-3
            </p>

            {/* Branch Contacts matching Official Excel System */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-slate-700 mt-1 leading-tight">
              <div>
                <span className="font-bold text-black">Karachi Head Office:</span> Gate 1, St 4, Plot 9, Truck Stand Hawksbay Rd.
                <br />
                <span className="font-mono text-slate-900">Ph: 021-32351333, 0300-2024433, 0321-2024433</span>
              </div>
              <div>
                <span className="font-bold text-black">Lahore Branch:</span> Saggian Bypass, Hazrat Ali Rd, Near IGG House.
                <br />
                <span className="font-mono text-slate-900">Ph: 0346-2024433, 0301-8264433 | FSD: 0300-3391733</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Reference Box */}
        <div className="text-right border-2 border-black p-2 rounded bg-slate-50 min-w-[170px] shrink-0">
          {copyFor && (
            <div className="bg-red-700 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-center tracking-wider mb-1">
              {copyFor}
            </div>
          )}
          <p className="text-[10px] font-black text-black uppercase leading-tight">{title}</p>
          {documentNumber && (
            <p className="text-[11px] font-mono font-black text-red-700 mt-0.5 tracking-tight">
              {documentNumber}
            </p>
          )}
          <p className="text-[9px] text-slate-700 mt-0.5 font-medium">Date: {displayDate}</p>
          {station && <p className="text-[8.5px] text-slate-500 font-semibold">{station}</p>}
        </div>
      </div>

      {subtitle && (
        <div className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-700 border-t border-slate-300 mt-1.5 pt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}
