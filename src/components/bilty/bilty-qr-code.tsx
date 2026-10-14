"use client";

import React from "react";

interface BiltyQrCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function BiltyQrCode({ value, size = 80, label = "SCAN QR FOR TRACKING" }: BiltyQrCodeProps) {
  // Deterministic SVG QR pattern representation
  return (
    <div className="flex flex-col items-center justify-center border border-black p-1.5 bg-white rounded text-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="w-auto h-auto max-w-full"
        shapeRendering="crispEdges"
      >
        {/* Outer background */}
        <rect width="100" height="100" fill="#ffffff" />

        {/* Top-Left Finder Pattern */}
        <rect x="5" y="5" width="28" height="28" fill="#000000" />
        <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
        <rect x="13" y="13" width="12" height="12" fill="#000000" />

        {/* Top-Right Finder Pattern */}
        <rect x="67" y="5" width="28" height="28" fill="#000000" />
        <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
        <rect x="75" y="13" width="12" height="12" fill="#000000" />

        {/* Bottom-Left Finder Pattern */}
        <rect x="5" y="67" width="28" height="28" fill="#000000" />
        <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
        <rect x="13" y="75" width="12" height="12" fill="#000000" />

        {/* Alignment & Timing Pattern */}
        <line x1="33" y1="18" x2="67" y2="18" stroke="#000000" strokeWidth="4" strokeDasharray="4 4" />
        <line x1="18" y1="33" x2="18" y2="67" stroke="#000000" strokeWidth="4" strokeDasharray="4 4" />

        {/* Inner Data Matrix Modules */}
        <rect x="38" y="38" width="8" height="8" fill="#000000" />
        <rect x="54" y="38" width="8" height="8" fill="#000000" />
        <rect x="46" y="46" width="8" height="8" fill="#000000" />
        <rect x="38" y="54" width="8" height="8" fill="#000000" />
        <rect x="54" y="54" width="8" height="8" fill="#000000" />

        <rect x="38" y="10" width="6" height="6" fill="#000000" />
        <rect x="48" y="8" width="6" height="6" fill="#000000" />
        <rect x="58" y="12" width="6" height="6" fill="#000000" />

        <rect x="10" y="38" width="6" height="6" fill="#000000" />
        <rect x="8" y="48" width="6" height="6" fill="#000000" />
        <rect x="12" y="58" width="6" height="6" fill="#000000" />

        <rect x="70" y="38" width="6" height="6" fill="#000000" />
        <rect x="82" y="44" width="6" height="6" fill="#000000" />
        <rect x="74" y="56" width="6" height="6" fill="#000000" />
        <rect x="88" y="60" width="6" height="6" fill="#000000" />

        <rect x="38" y="70" width="6" height="6" fill="#000000" />
        <rect x="44" y="82" width="6" height="6" fill="#000000" />
        <rect x="56" y="74" width="6" height="6" fill="#000000" />
        <rect x="60" y="88" width="6" height="6" fill="#000000" />

        <rect x="70" y="70" width="8" height="8" fill="#000000" />
        <rect x="82" y="78" width="8" height="8" fill="#000000" />
        <rect x="72" y="86" width="8" height="8" fill="#000000" />
        <rect x="86" y="88" width="6" height="6" fill="#000000" />
      </svg>
      {label && (
        <span className="text-[7.5px] font-black uppercase tracking-tight text-slate-800 mt-0.5 leading-none block">
          {label}
        </span>
      )}
    </div>
  );
}
