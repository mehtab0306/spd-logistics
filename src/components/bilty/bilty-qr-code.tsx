"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

export interface BiltyQrCodeProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  label?: string;
  trackingId?: string;
  className?: string;
}

export function BiltyQrCode({
  value,
  size = 100,
  level = "M",
  label = "SCAN FOR TRACKING",
  trackingId,
  className = "",
}: BiltyQrCodeProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center shrink-0 ${className}`}>
      <div className="p-1 border border-black bg-white rounded flex items-center justify-center shadow-none">
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          includeMargin={false}
          className="w-auto h-auto max-w-full"
        />
      </div>
      {label && (
        <span className="text-[7.5px] font-black uppercase tracking-tight text-slate-800 mt-1 leading-none block">
          {label}
        </span>
      )}
      {trackingId && (
        <span className="text-[8px] font-mono font-bold text-slate-900 mt-0.5 text-center block">
          Tracking ID: {trackingId}
        </span>
      )}
    </div>
  );
}
