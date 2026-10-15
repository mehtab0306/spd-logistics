"use client";

import React from "react";

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  documentNumber?: string;
  date?: string;
  station?: string;
  companyName?: string;
}

export function PrintHeader({
  title,
  subtitle = "Nationwide Cargo, Container & Fleet Logistics • Est. 1996",
  documentNumber,
  date,
  station = "Head Office Station (Lahore)",
  companyName,
}: PrintHeaderProps) {
  const displayDate = date || new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border-b-2 border-black pb-3 mb-4 text-black font-sans">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/spd-logo.jpg"
            alt="SPD Logistics"
            className="h-16 w-auto object-contain rounded border border-slate-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/spd-logo.png";
            }}
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-red-600 uppercase">
              {companyName || "SUPER PAK DATA GOODS TRANSPORT CO. (SPD LOGISTICS)"}
            </h1>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              {subtitle}
            </p>
            <p className="text-[10px] text-slate-600">
              Main Head Office: Bhati Gate Transport Center, Lahore • Karachi Port Terminal Hub • Ph: 042-111-773-773, 0300-8441234
            </p>
          </div>
        </div>

        <div className="text-right border-2 border-black p-2 rounded-sm bg-slate-50 min-w-[180px] shrink-0">
          <p className="text-[9px] font-bold uppercase text-slate-500">OFFICIAL RECORD</p>
          <p className="text-xs font-black text-black uppercase leading-tight">{title}</p>
          {documentNumber && (
            <p className="text-[10px] font-mono font-bold text-red-700 mt-0.5">REF: {documentNumber}</p>
          )}
          <p className="text-[9px] text-slate-700 mt-0.5">Date: {displayDate}</p>
          {station && <p className="text-[9px] text-slate-600 font-medium">{station}</p>}
        </div>
      </div>
    </div>
  );
}

interface PrintFooterProps {
  notes?: string;
  preparedByLabel?: string;
  checkedByLabel?: string;
  authorizedLabel?: string;
}

export function PrintFooter({
  notes,
  preparedByLabel = "Prepared By",
  checkedByLabel = "Checked By",
  authorizedLabel = "Authorized Signature",
}: PrintFooterProps) {
  return (
    <div className="mt-8 pt-4 border-t border-slate-400 space-y-6 text-black font-sans break-inside-avoid">
      {notes && (
        <p className="text-[9px] text-slate-600 text-justify leading-relaxed">
          <strong>LEGAL & CARRIER NOTICE:</strong> {notes}
        </p>
      )}

      <div className="grid grid-cols-3 gap-8 text-center text-xs pt-4">
        <div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase text-[11px] text-black">
            {preparedByLabel}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Booking / Data Entry Officer</div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase text-[11px] text-black">
            {checkedByLabel}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Accounts & Billing Manager</div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase text-[11px] text-black">
            {authorizedLabel}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Station Manager / Official Seal</div>
        </div>
      </div>
    </div>
  );
}
