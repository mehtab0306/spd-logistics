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
  station = "Karachi Head Office / Lahore Branch",
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
            src="/images/spd-logo.png"
            alt="SPD Logistics"
            className="h-16 w-16 object-contain shrink-0 mt-0.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/spd-logo.jpg";
            }}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-red-700 uppercase leading-none">
              SUPER PAK DATA WALE GOODS TRANSPORT CO.®
            </h1>
            <p className="text-[9.5px] font-bold text-slate-800 uppercase tracking-wider mt-0.5">
              All Pakistan 24 Hours Urgent, Container, Mazda &amp; Train Service Available
            </p>

            {/* Branch Contacts & Official Details */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-slate-700 mt-1 leading-tight">
              <div>
                <span className="font-bold text-black">Karachi Head Office:</span> Plot # 9, Gate No 1, Street No 4, Truck Stand Hawksbay Rd.
                <br />
                <span className="font-mono text-slate-900 font-bold">Ph: 021-32351333, 021-32352688 / 0300-2024433, 0321-2024433</span>
              </div>
              <div>
                <span className="font-bold text-black">Lahore Office:</span> Saggian Bypass, Hazrat Ali Rd, Opp IGG House.
                <br />
                <span className="font-mono text-slate-900">Ph: 0325-2024433, 0301-8264433 | superpakdatawale@gmail.com</span>
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
