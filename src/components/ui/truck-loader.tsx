"use client";

import React from "react";

interface TruckLoaderProps {
  isVisible?: boolean;
  subtitle?: string;
}

export function TruckLoader({
  isVisible = true,
  subtitle = "SPD Logistics • Loading Operations...",
}: TruckLoaderProps) {
  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Operations"
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center select-none transition-opacity duration-300 animate-in fade-in"
    >
      <style>{`
        @keyframes spdRoadDash {
          0% { background-position: 0 0; }
          100% { background-position: -48px 0; }
        }
        @keyframes spdTruckCruise {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2.5px) rotate(-0.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(-1.5px) rotate(0.5deg); }
        }
        @keyframes spdHeadlightPulse {
          0%, 100% { opacity: 0.35; transform: scaleX(1); }
          50% { opacity: 0.75; transform: scaleX(1.15); }
        }
        .spd-truck-vibe {
          animation: spdTruckCruise 0.8s ease-in-out infinite;
        }
        .spd-road-line {
          background: repeating-linear-gradient(
            90deg,
            #ef4444 0px,
            #ef4444 18px,
            transparent 18px,
            transparent 32px
          );
          background-size: 32px 3px;
          animation: spdRoadDash 0.4s linear infinite;
        }
        .spd-headlight {
          animation: spdHeadlightPulse 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
        {/* Animated Cargo Truck with Suspension */}
        <div className="relative flex items-center justify-center w-36 h-16">
          {/* Headlight beam */}
          <div className="spd-headlight absolute right-2 top-6 w-14 h-4 bg-gradient-to-r from-amber-400/50 via-amber-200/20 to-transparent blur-[3px] rounded-full origin-left" />

          {/* Truck visual */}
          <div className="spd-truck-vibe text-5xl filter drop-shadow-[0_8px_12px_rgba(239,68,68,0.35)]">
            🚚
          </div>
        </div>

        {/* Animated Moving Highway Road Line */}
        <div className="w-44 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden relative border border-slate-700/60 shadow-inner">
          <div className="spd-road-line absolute inset-0 w-full h-full" />
        </div>

        {/* Brand Operations Subtitle */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs font-black tracking-widest text-white uppercase flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            <span>{subtitle}</span>
          </p>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 font-mono">
            PAKISTAN NATIONWIDE FLEET DISPATCH
          </p>
        </div>
      </div>
    </div>
  );
}
