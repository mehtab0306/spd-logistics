"use client";

import React, { useState } from "react";
import { Navigation, Radio, Gauge, Sun, Moon } from "lucide-react";

export function AnimatedLogisticsBanner() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section 
      id="logistics-motion-banner"
      className="relative w-full overflow-hidden bg-[#070B14] border-t border-b border-slate-800 text-white select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="SPD Logistics Realistic Day and Night Line-Haul Highway Simulation"
    >
      {/* Top ambient brand highlight border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-spd-red to-transparent opacity-80 z-30"></div>
      
      {/* Telemetry Header HUD */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-[#070B14]/80 backdrop-blur-sm border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono font-extrabold uppercase tracking-widest text-[11px] text-emerald-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            24/7 Line-Haul Operations
          </span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400 font-semibold hidden sm:inline">
            National Highway N-5 / Motorway M-5 Trunk
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Day & Night Cycle Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 shadow-sm">
            <Sun className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Continuous Day &bull; Night Transit</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono font-bold text-slate-300 shadow-sm">
            <Navigation className="w-3 h-3 text-spd-blue" />
            <span>Karachi ➔ Lahore</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono font-bold text-slate-300 shadow-sm">
            <Gauge className="w-3 h-3 text-spd-red" />
            <span>78 km/h</span>
          </div>
        </div>
      </div>

      {/* Main Scenic Highway Simulation Container */}
      <div className="relative w-full h-[260px] sm:h-[310px] lg:h-[350px] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LAYER 0: SEAMLESS DAY & NIGHT SKY CROSS-FADING BACKDROPS (48s Cycle)     */}
        {/* ========================================================================= */}

        {/* 1. Dawn / Morning Sunrise Sky */}
        <div 
          className="absolute inset-0 pointer-events-none sky-dawn-cycle"
          style={{
            background: "linear-gradient(180deg, #1e293b 0%, #334155 30%, #7c2d12 60%, #ea580c 80%, #fed7aa 100%)",
          }}
        />

        {/* 2. Bright Daytime Sky (Clear Sky Blue to Horizon Pale Cyan) */}
        <div 
          className="absolute inset-0 pointer-events-none sky-day-cycle"
          style={{
            background: "linear-gradient(180deg, #1e40af 0%, #0284c7 40%, #38bdf8 70%, #bae6fd 100%)",
          }}
        />

        {/* 3. Sunset / Dusk Sky (Deep Violet, Magenta, Fiery Amber, and Golden Glow) */}
        <div 
          className="absolute inset-0 pointer-events-none sky-sunset-cycle"
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #2e1065 28%, #831843 55%, #c2410c 75%, #f59e0b 92%, #fde047 100%)",
          }}
        />

        {/* 4. Deep Night Sky (Midnight Indigo & Deep Space Navy) */}
        <div 
          className="absolute inset-0 pointer-events-none sky-night-cycle"
          style={{
            background: "linear-gradient(180deg, #030712 0%, #080d1a 40%, #0d1527 75%, #131c31 100%)",
          }}
        />

        {/* ========================================================================= */}
        {/* CELESTIAL BODIES: SUN & MOON                                              */}
        {/* ========================================================================= */}

        {/* Realistic Glowing Sun (Rises at dawn, shines during day, sets at dusk) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="sun-path-cycle absolute">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-white via-[#fef08a] to-[#f59e0b] shadow-[0_0_50px_rgba(251,191,36,0.95)] flex items-center justify-center">
              <div className="absolute -inset-4 rounded-full bg-amber-400/30 blur-xl"></div>
              <div className="absolute -inset-8 rounded-full bg-amber-500/15 blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* Realistic Glowing Moon (Rises at dusk, shines during night, sets at dawn) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="moon-path-cycle absolute">
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#94a3b8] shadow-[0_0_35px_rgba(191,219,254,0.85)] border border-white/60 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400/40 absolute top-2 left-3 blur-[0.5px]"></div>
              <div className="w-3 h-3 rounded-full bg-slate-400/30 absolute bottom-2.5 right-2.5 blur-[0.5px]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400/35 absolute top-5 right-4 blur-[0.5px]"></div>
              <div className="absolute -inset-6 rounded-full bg-blue-400/15 blur-xl"></div>
              <div className="absolute -inset-10 rounded-full bg-indigo-400/10 blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* Night Stars Field (Twinkles and fades in during evening/night) */}
        <div 
          className="absolute inset-0 pointer-events-none stars-fade-cycle z-10"
          style={{
            backgroundImage: "radial-gradient(1px 1px at 25px 35px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 130px 65px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 270px 30px, #93c5fd, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 420px 85px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 610px 45px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 800px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 980px 35px, #93c5fd, rgba(0,0,0,0)), radial-gradient(1px 1px at 1150px 80px, #ffffff, rgba(0,0,0,0))",
            backgroundSize: "600px 180px"
          }}
        />

        {/* Ambient Horizon Atmosphere Glow */}
        <div className="absolute bottom-28 inset-x-0 h-32 horizon-glow-cycle pointer-events-none z-10"></div>

        {/* Atmospheric Clouds Layer (Infinite Parallax Drift + Day/Night Light Transition) */}
        <div className="absolute top-2 inset-x-0 h-28 overflow-hidden pointer-events-none z-10">
          <div className="clouds-track flex w-[200%] h-full animate-clouds-drift clouds-lighting-cycle">
            <svg className="w-1/2 h-full" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
              <path d="M0,75 Q120,25 250,65 T500,55 T750,75 T1000,65 L1000,120 L0,120 Z" className="cloud-path-back" />
              <path d="M0,88 Q180,35 380,70 T780,60 T1000,80 L1000,120 L0,120 Z" className="cloud-path-front" />
            </svg>
            <svg className="w-1/2 h-full" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
              <path d="M0,75 Q120,25 250,65 T500,55 T750,75 T1000,65 L1000,120 L0,120 Z" className="cloud-path-back" />
              <path d="M0,88 Q180,35 380,70 T780,60 T1000,80 L1000,120 L0,120 Z" className="cloud-path-front" />
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LAYER 2: DISTANT INDUSTRIAL LOGISTICS HUB & WAREHOUSES    */}
        {/* ========================================================= */}
        <div className="absolute bottom-24 inset-x-0 h-32 overflow-hidden pointer-events-none z-15 warehouse-ambient-cycle">
          <div className="skyline-track flex w-[200%] h-full animate-skyline-drift">
            <svg className="w-1/2 h-full" viewBox="0 0 1200 140" preserveAspectRatio="none" fill="none">
              {/* Warehouse Terminal 1 (Left) */}
              <rect x="40" y="55" width="160" height="70" fill="#0c121e" stroke="#1e293b" strokeWidth="1" />
              <polygon points="30,55 120,35 210,55" fill="#0f172a" />
              <rect x="55" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              <rect x="95" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              <rect x="135" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              {/* High Bay Amber Lighting */}
              <g className="night-facility-lights">
                <circle cx="70" cy="70" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
                <circle cx="110" cy="70" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
                <circle cx="150" cy="70" r="2.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
              </g>
              <text x="60" y="50" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace">SPD CARGO TERMINAL</text>

              {/* Communication Radio Mast with Red Warning Beacon */}
              <line x1="260" y1="20" x2="260" y2="125" stroke="#334155" strokeWidth="1.5" />
              <line x1="250" y1="60" x2="270" y2="60" stroke="#334155" strokeWidth="1" />
              <line x1="253" y1="90" x2="267" y2="90" stroke="#334155" strokeWidth="1" />
              <circle cx="260" cy="18" r="2.5" fill="#ef4444" className="animate-pulse" filter="drop-shadow(0 0 6px #ef4444)" />

              {/* Modern Logistics Hub Silhouettes (Center) */}
              <rect x="320" y="45" width="220" height="80" fill="#090e18" stroke="#1e293b" strokeWidth="1" />
              <rect x="340" y="60" width="180" height="6" fill="#1e293b" />
              <g className="night-facility-lights">
                <circle cx="360" cy="55" r="2" fill="#38bdf8" filter="drop-shadow(0 0 3px #38bdf8)" />
                <circle cx="430" cy="55" r="2" fill="#38bdf8" filter="drop-shadow(0 0 3px #38bdf8)" />
                <circle cx="500" cy="55" r="2" fill="#38bdf8" filter="drop-shadow(0 0 3px #38bdf8)" />
              </g>
              <text x="360" y="80" fill="#3b82f6" fontSize="9" fontWeight="900" fontFamily="sans-serif">SPD 24/7 LOGISTICS HUB</text>
              <rect x="340" y="90" width="24" height="35" fill="#030712" stroke="#2563eb" strokeWidth="0.75" />
              <rect x="375" y="90" width="24" height="35" fill="#030712" stroke="#2563eb" strokeWidth="0.75" />
              <rect x="410" y="90" width="24" height="35" fill="#030712" stroke="#2563eb" strokeWidth="0.75" />
              <rect x="445" y="90" width="24" height="35" fill="#030712" stroke="#2563eb" strokeWidth="0.75" />
              <rect x="480" y="90" width="24" height="35" fill="#030712" stroke="#2563eb" strokeWidth="0.75" />

              {/* Industrial Gantry Crane & Containers (Right) */}
              <rect x="620" y="70" width="140" height="55" fill="#0c121e" />
              <rect x="635" y="75" width="45" height="20" fill="#dc2626" opacity="0.6" stroke="#ef4444" strokeWidth="0.5" />
              <rect x="685" y="75" width="45" height="20" fill="#1e40af" opacity="0.6" stroke="#3b82f6" strokeWidth="0.5" />
              <rect x="660" y="55" width="45" height="20" fill="#475569" opacity="0.7" stroke="#94a3b8" strokeWidth="0.5" />

              {/* Distant City Commercial Skyline */}
              <rect x="800" y="30" width="40" height="95" fill="#080d16" />
              <rect x="845" y="20" width="35" height="105" fill="#070b13" />
              <rect x="885" y="40" width="50" height="85" fill="#090e18" />
              <rect x="940" y="25" width="45" height="100" fill="#070b13" />
              <line x1="862" y1="5" x2="862" y2="20" stroke="#ef4444" strokeWidth="1" />
              <circle cx="862" cy="5" r="2" fill="#ef4444" className="animate-ping" />

              {/* Warehouse Terminal 2 (Far Right) */}
              <rect x="1030" y="50" width="150" height="75" fill="#0c121e" stroke="#1e293b" strokeWidth="1" />
              <polygon points="1020,50 1105,32 1190,50" fill="#0f172a" />
              <text x="1050" y="45" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace">DISTRIBUTION DOCK 02</text>
            </svg>

            {/* Seamless Repeated Second Half for Infinite Parallax Loop */}
            <svg className="w-1/2 h-full" viewBox="0 0 1200 140" preserveAspectRatio="none" fill="none">
              <rect x="40" y="55" width="160" height="70" fill="#0c121e" stroke="#1e293b" strokeWidth="1" />
              <polygon points="30,55 120,35 210,55" fill="#0f172a" />
              <rect x="55" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              <rect x="95" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              <rect x="135" y="75" width="30" height="45" fill="#080d17" stroke="#334155" strokeWidth="1" />
              <g className="night-facility-lights">
                <circle cx="70" cy="70" r="2.5" fill="#fbbf24" />
                <circle cx="110" cy="70" r="2.5" fill="#fbbf24" />
                <circle cx="150" cy="70" r="2.5" fill="#fbbf24" />
              </g>
              <text x="60" y="50" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace">SPD CARGO TERMINAL</text>
              <line x1="260" y1="20" x2="260" y2="125" stroke="#334155" strokeWidth="1.5" />
              <circle cx="260" cy="18" r="2.5" fill="#ef4444" className="animate-pulse" />
              <rect x="320" y="45" width="220" height="80" fill="#090e18" stroke="#1e293b" strokeWidth="1" />
              <text x="360" y="80" fill="#3b82f6" fontSize="9" fontWeight="900" fontFamily="sans-serif">SPD 24/7 LOGISTICS HUB</text>
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LAYER 3: HIGHWAY ROAD, LANES & ASPHALT                    */}
        {/* ========================================================= */}
        <div className="absolute bottom-0 inset-x-0 h-28 road-asphalt-cycle border-t-2 border-slate-700 z-20">
          
          {/* Asphalt Realistic Texture Grain */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 0.75px, transparent 0.75px), radial-gradient(#ffffff 0.75px, #131926 0.75px)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px"
            }}
          />

          {/* Top Road Shoulder Line (Solid White) */}
          <div className="absolute top-2 inset-x-0 h-1 bg-white/70 shadow-sm"></div>

          {/* Guardrail / Safety Barrier (Metal posts & rail) */}
          <div className="absolute -top-3 inset-x-0 h-2 bg-gradient-to-b from-slate-600 to-slate-800 border-b border-slate-900 shadow-md flex justify-around">
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
            <div className="w-1 h-3 bg-slate-500"></div>
          </div>

          {/* Center Dividing Dashed Lane Markings (Moving Smooth Infinite Loop) */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5 overflow-hidden">
            <div className="highway-dashes flex w-[200%] h-full animate-road-lane">
              <div className="w-1/2 flex justify-around items-center">
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              </div>
              <div className="w-1/2 flex justify-around items-center">
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span className="w-12 h-1.5 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              </div>
            </div>
          </div>

          {/* Bottom Solid White Shoulder Line */}
          <div className="absolute bottom-2 inset-x-0 h-1 bg-white/70 shadow-sm"></div>

          {/* Passing Overhead Street Lights (Only visible at night) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden night-streetlights-cycle">
            <div className="streetlights-track flex w-[200%] h-full animate-streetlights-move">
              <div className="w-1/2 flex justify-around">
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
              </div>
              <div className="w-1/2 flex justify-around">
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
                <div className="w-24 h-full bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-transparent blur-md"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LAYER 4: REALISTIC HEAVY CARGO TRUCK CRUISING ON HIGHWAY  */}
        {/* ========================================================= */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] md:w-[560px] lg:w-[640px] z-30 pointer-events-none">
          
          {/* Subtle natural suspension bounce animation */}
          <div className="relative animate-truck-suspension">
            
            {/* Ground Contact Shadow */}
            <div className="truck-shadow-cycle absolute -bottom-2 left-6 right-2 h-4 rounded-full blur-sm"></div>

            {/* Realistic Detailed Heavy Commercial Articulated Semi-Truck SVG */}
            <svg 
              className="w-full h-auto drop-shadow-2xl truck-body-cycle" 
              viewBox="0 0 680 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Metallic Container Gradients */}
                <linearGradient id="trailerMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="40%" stopColor="#e2e8f0" />
                  <stop offset="85%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <linearGradient id="spdRedStripe" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="50%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <linearGradient id="spdBlueStripe" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="50%" stopColor="#1e40af" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                <linearGradient id="cabMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="45%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Headlight Volumetric Forward Projection Beam */}
                <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#fef08a" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#fde047" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                </linearGradient>

                {/* Red Tail Glow */}
                <radialGradient id="tailGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#dc2626" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* ------------------------------------------------------------- */}
              {/* 1. HEADLIGHT CONE BEAM (Projecting onto the road ahead)       */}
              {/* ------------------------------------------------------------- */}
              <g className="night-lights-cycle">
                <polygon points="630,132 680,110 680,175 630,148" fill="url(#headlightBeam)" />
                <ellipse cx="640" cy="140" rx="12" ry="5" fill="#fef08a" opacity="0.6" filter="blur(2px)" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 2. REAR TAIL RED GLOW & SIDE CLEARANCE REFLECTIONS             */}
              {/* ------------------------------------------------------------- */}
              <g className="night-lights-cycle">
                <circle cx="28" cy="140" r="14" fill="url(#tailGlow)" />
                <circle cx="28" cy="85" r="8" fill="url(#tailGlow)" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* 3. 40FT / 53FT CARGO TRAILER BODY                             */}
              {/* ------------------------------------------------------------- */}
              {/* Trailer Main Body Box */}
              <rect x="30" y="38" width="410" height="106" rx="4" fill="url(#trailerMetal)" stroke="#64748b" strokeWidth="1.5" />
              
              {/* Aerodynamic Top Fairing / Roof Rail */}
              <rect x="30" y="34" width="410" height="6" rx="2" fill="#475569" />

              {/* Trailer Front & Rear Vertical Framing Bars */}
              <line x1="30" y1="38" x2="30" y2="144" stroke="#475569" strokeWidth="3" />
              <line x1="438" y1="38" x2="438" y2="144" stroke="#475569" strokeWidth="3" />

              {/* Realistic Container Panel Seams (Vertical subtle ribs) */}
              <line x1="90" y1="38" x2="90" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />
              <line x1="150" y1="38" x2="150" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />
              <line x1="210" y1="38" x2="210" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />
              <line x1="270" y1="38" x2="270" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />
              <line x1="330" y1="38" x2="330" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />
              <line x1="390" y1="38" x2="390" y2="144" stroke="#cbd5e1" strokeWidth="1" opacity="0.7" />

              {/* SPD CORPORATE BRANDING ON TRAILER SIDE */}
              {/* Dual Red & Blue High-Speed Stripe */}
              <rect x="32" y="104" width="406" height="7" fill="url(#spdRedStripe)" />
              <rect x="32" y="113" width="406" height="4.5" fill="url(#spdBlueStripe)" />

              {/* Trailer Corporate Typography */}
              <g transform="translate(50, 50)">
                {/* SPD LOGISTICS Bold Emblem */}
                <text x="0" y="24" fill="#0f172a" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">
                  SPD <tspan fill="#dc2626">LOGISTICS</tspan>
                </text>
                <text x="0" y="38" fill="#1e40af" fontSize="9" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.8">
                  SUPER PAK DATA GOODS TRANSPORT CO. &bull; EST. 1996
                </text>
                <text x="0" y="49" fill="#475569" fontSize="7.5" fontWeight="700" fontFamily="monospace">
                  COMMERCIAL TRUNK FLEET &bull; KARACHI ⇄ LAHORE ⇄ NATIONWIDE
                </text>
              </g>

              {/* DOT-C2 Reflective Safety Chevron Tape on Bottom Rail */}
              <g transform="translate(32, 137)">
                <rect x="0" y="0" width="406" height="4" fill="#0f172a" />
                <rect x="5" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="25" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="45" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="65" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="85" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="105" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="125" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="145" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="165" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="185" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="205" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="225" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="245" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="265" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="285" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="305" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="325" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="345" y="0.5" width="20" height="3" fill="#ffffff" />
                <rect x="365" y="0.5" width="20" height="3" fill="#dc2626" />
                <rect x="385" y="0.5" width="20" height="3" fill="#ffffff" />
              </g>

              {/* Rear Trailer Amber/Red Clearance Markers */}
              <circle cx="32" cy="42" r="2.5" fill="#ef4444" />
              <circle cx="32" cy="100" r="2.5" fill="#ef4444" />
              <circle cx="32" cy="141" r="3" fill="#ef4444" />

              {/* Trailer Underbody Chassis & Aerodynamic Side Skirts */}
              <rect x="70" y="144" width="240" height="15" fill="#1e293b" rx="2" />
              <text x="140" y="154" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="monospace">SPD AERODYNAMIC FAIRING</text>

              {/* Landing Gear Dolly Legs */}
              <rect x="375" y="144" width="7" height="22" fill="#334155" />
              <rect x="371" y="163" width="15" height="4" fill="#1e293b" />

              {/* ------------------------------------------------------------- */}
              {/* 4. HEAVY-DUTY COMMERCIAL CAB (Tractor Unit)                   */}
              {/* ------------------------------------------------------------- */}
              {/* Fifth-Wheel Coupling Connector */}
              <rect x="430" y="136" width="30" height="10" fill="#0f172a" />

              {/* Tractor Cabin Main Body */}
              <path 
                d="M450,146 L450,55 Q455,42 475,38 L545,38 Q570,38 585,58 L620,105 Q635,116 635,135 L635,160 L605,160 L600,146 L450,146 Z" 
                fill="url(#cabMetallic)" 
                stroke="#334155" 
                strokeWidth="1.5" 
              />

              {/* Aerodynamic Cab Roof Wind Deflector & Sun Visor */}
              <path d="M465,38 Q520,32 560,34 L562,38 Z" fill="#dc2626" />
              <path d="M565,48 L615,70 L605,74 L562,54 Z" fill="#020617" />

              {/* Roof Amber Clearance Running Lights */}
              <g className="night-lights-cycle">
                <circle cx="505" cy="35" r="2.5" fill="#f59e0b" filter="drop-shadow(0 0 3px #f59e0b)" />
                <circle cx="525" cy="35" r="2.5" fill="#f59e0b" filter="drop-shadow(0 0 3px #f59e0b)" />
                <circle cx="545" cy="35" r="2.5" fill="#f59e0b" filter="drop-shadow(0 0 3px #f59e0b)" />
              </g>

              {/* Dual Chrome Exhaust Vertical Stack */}
              <rect x="446" y="24" width="4" height="60" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="445" y="20" width="6" height="5" fill="#e2e8f0" />

              {/* Cabin Tinted Glass Windshield & Side Windows */}
              <path d="M535,52 L572,52 L605,92 L545,92 Q535,92 535,75 Z" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <path d="M542,56 L570,56 L598,90 L545,90 Z" fill="#1e293b" opacity="0.75" />
              {/* Driver Silhouette in window */}
              <circle cx="560" cy="72" r="5.5" fill="#334155" />
              <path d="M552,88 Q560,78 568,88 Z" fill="#334155" />

              {/* Large Chrome Side Mirror */}
              <rect x="604" y="68" width="4" height="24" rx="1.5" fill="#e2e8f0" stroke="#475569" strokeWidth="0.5" />
              <line x1="592" y1="74" x2="604" y2="74" stroke="#475569" strokeWidth="1" />
              <line x1="595" y1="88" x2="604" y2="88" stroke="#475569" strokeWidth="1" />

              {/* Cab Door Handle & Steps */}
              <rect x="525" y="98" width="10" height="2.5" rx="1" fill="#cbd5e1" />
              <line x1="495" y1="146" x2="495" y2="160" stroke="#475569" strokeWidth="3" />
              <rect x="488" y="152" width="14" height="2.5" fill="#64748b" />
              <rect x="488" y="158" width="14" height="2.5" fill="#64748b" />

              {/* Tractor Front Grille & Heavy Chrome Bumper */}
              <rect x="625" y="120" width="10" height="28" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <line x1="625" y1="126" x2="635" y2="126" stroke="#94a3b8" strokeWidth="1" />
              <line x1="625" y1="132" x2="635" y2="132" stroke="#94a3b8" strokeWidth="1" />
              <line x1="625" y1="138" x2="635" y2="138" stroke="#94a3b8" strokeWidth="1" />
              <line x1="625" y1="144" x2="635" y2="144" stroke="#94a3b8" strokeWidth="1" />
              <rect x="618" y="148" width="18" height="14" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />

              {/* Bright Xenon Headlight Cluster */}
              <rect x="626" y="134" width="7" height="12" rx="2" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)" />
              <rect x="627" y="148" width="5" height="4" rx="1" fill="#f59e0b" />

              {/* Cab Side SPD Red Accent Badge */}
              <rect x="460" y="104" width="45" height="3" fill="#dc2626" />
              <text x="460" y="115" fill="#94a3b8" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">SPD-786</text>

              {/* ------------------------------------------------------------- */}
              {/* 5. HEAVY DUAL-AXLE ALLOY WHEELS & ROTATING SPOKES             */}
              {/* ------------------------------------------------------------- */}
              {/* Helper Macro for Detailed Wheel: Outer Tire, Rim, Hub & Lug Nuts */}
              
              {/* Trailer Rear Wheel 1 (Far Left) */}
              <g transform="translate(68, 162)">
                <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="0" cy="0" r="7" fill="#0f172a" />
                <circle cx="0" cy="0" r="2.5" fill="#e2e8f0" />
                {/* Rotating rim spokes */}
                <g className="animate-spin-wheel origin-center">
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="8.5" y1="-8.5" x2="-8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                </g>
              </g>

              {/* Trailer Rear Wheel 2 (Middle Left) */}
              <g transform="translate(112, 162)">
                <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="0" cy="0" r="7" fill="#0f172a" />
                <circle cx="0" cy="0" r="2.5" fill="#e2e8f0" />
                <g className="animate-spin-wheel origin-center">
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="8.5" y1="-8.5" x2="-8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                </g>
              </g>

              {/* Mudflap behind trailer wheels */}
              <rect x="42" y="152" width="5" height="22" fill="#020617" />
              <text x="35" y="168" fill="#ffffff" fontSize="5" fontWeight="bold">SPD</text>

              {/* Tractor Drive Axle Wheel (Center Right) */}
              <g transform="translate(485, 162)">
                <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="0" cy="0" r="7" fill="#0f172a" />
                <circle cx="0" cy="0" r="2.5" fill="#e2e8f0" />
                <g className="animate-spin-wheel origin-center">
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="8.5" y1="-8.5" x2="-8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                </g>
              </g>

              {/* Tractor Steer Wheel (Front Right) */}
              <g transform="translate(585, 162)">
                <circle cx="0" cy="0" r="19" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                <circle cx="0" cy="0" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="0" cy="0" r="7" fill="#0f172a" />
                <circle cx="0" cy="0" r="2.5" fill="#e2e8f0" />
                <g className="animate-spin-wheel origin-center">
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="8.5" y1="-8.5" x2="-8.5" y2="8.5" stroke="#94a3b8" strokeWidth="1.5" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* Overlay Dark Vignette Bottom Edge for smooth transition */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-30"></div>
      </div>

      {/* Embedded High-Performance Keyframe Animations (48s Day & Night Cycle) */}
      <style jsx>{`
        /* --- 1. Environmental Sky Phases (48s Continuous Smooth Loop) --- */
        /* Phase 1: Dawn / Morning (0% - 22%) */
        @keyframes skyDawnAnim {
          0% { opacity: 0.9; }
          12% { opacity: 1; }
          22% { opacity: 0; }
          86% { opacity: 0; }
          95% { opacity: 0.7; }
          100% { opacity: 0.9; }
        }
        .sky-dawn-cycle {
          animation: skyDawnAnim 48s ease-in-out infinite;
          will-change: opacity;
        }

        /* Phase 2: Bright Daylight (18% - 54%) */
        @keyframes skyDayAnim {
          0% { opacity: 0; }
          16% { opacity: 0.2; }
          24% { opacity: 1; }
          44% { opacity: 1; }
          52% { opacity: 0.2; }
          58% { opacity: 0; }
          100% { opacity: 0; }
        }
        .sky-day-cycle {
          animation: skyDayAnim 48s ease-in-out infinite;
          will-change: opacity;
        }

        /* Phase 3: Sunset / Dusk (48% - 74%) */
        @keyframes skySunsetAnim {
          0% { opacity: 0; }
          46% { opacity: 0; }
          54% { opacity: 0.9; }
          64% { opacity: 1; }
          72% { opacity: 0.25; }
          76% { opacity: 0; }
          100% { opacity: 0; }
        }
        .sky-sunset-cycle {
          animation: skySunsetAnim 48s ease-in-out infinite;
          will-change: opacity;
        }

        /* Phase 4: Night with Soft Moonlight & Stars (70% - 96%) */
        @keyframes skyNightAnim {
          0% { opacity: 0.4; }
          10% { opacity: 0; }
          68% { opacity: 0; }
          76% { opacity: 0.9; }
          88% { opacity: 1; }
          94% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        .sky-night-cycle {
          animation: skyNightAnim 48s ease-in-out infinite;
          will-change: opacity;
        }

        /* --- 2. Celestial Motion: Sun & Moon Pathways --- */
        /* Sun rising from left at dawn, reaching zenith during day, setting right at dusk */
        @keyframes sunPathAnim {
          0% { transform: translate3d(15%, 85px, 0); opacity: 0.75; }
          18% { transform: translate3d(35%, 28px, 0); opacity: 0.95; }
          32% { transform: translate3d(52%, 16px, 0); opacity: 1; }
          50% { transform: translate3d(70%, 42px, 0); opacity: 0.9; }
          62% { transform: translate3d(85%, 88px, 0); opacity: 0.6; }
          68% { transform: translate3d(92%, 140px, 0); opacity: 0; }
          96% { transform: translate3d(10%, 140px, 0); opacity: 0; }
          100% { transform: translate3d(15%, 85px, 0); opacity: 0.75; }
        }
        .sun-path-cycle {
          animation: sunPathAnim 48s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
        }

        /* Moon rising at dusk, crossing night sky, setting before dawn */
        @keyframes moonPathAnim {
          0% { transform: translate3d(80%, 130px, 0); opacity: 0; }
          68% { transform: translate3d(20%, 120px, 0); opacity: 0; }
          74% { transform: translate3d(32%, 55px, 0); opacity: 0.7; }
          82% { transform: translate3d(48%, 22px, 0); opacity: 1; }
          90% { transform: translate3d(64%, 40px, 0); opacity: 0.85; }
          96% { transform: translate3d(78%, 105px, 0); opacity: 0.2; }
          100% { transform: translate3d(80%, 130px, 0); opacity: 0; }
        }
        .moon-path-cycle {
          animation: moonPathAnim 48s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
        }

        /* Stars fade out in daylight, sparkle at night */
        @keyframes starsFadeAnim {
          0% { opacity: 0.15; }
          12% { opacity: 0; }
          68% { opacity: 0; }
          76% { opacity: 0.6; }
          86% { opacity: 0.95; }
          94% { opacity: 0.4; }
          100% { opacity: 0.15; }
        }
        .stars-fade-cycle {
          animation: starsFadeAnim 48s ease-in-out infinite;
          will-change: opacity;
        }

        /* Ambient Horizon Twilight Glow */
        @keyframes horizonGlowAnim {
          0% { background: radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.3) 0%, transparent 70%); }
          25% { background: radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.2) 0%, transparent 70%); }
          60% { background: radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.35) 0%, transparent 70%); }
          85% { background: radial-gradient(ellipse at 50% 100%, rgba(30,64,175,0.25) 0%, transparent 70%); }
          100% { background: radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.3) 0%, transparent 70%); }
        }
        .horizon-glow-cycle {
          animation: horizonGlowAnim 48s ease-in-out infinite;
        }

        /* --- 3. Cloud Day/Night Tinting --- */
        @keyframes cloudsLightingAnim {
          0% { opacity: 0.45; filter: drop-shadow(0 2px 8px rgba(251,191,36,0.3)); }
          25% { opacity: 0.8; filter: drop-shadow(0 2px 4px rgba(255,255,255,0.6)); }
          60% { opacity: 0.6; filter: drop-shadow(0 2px 10px rgba(239,68,68,0.4)); }
          85% { opacity: 0.25; filter: drop-shadow(0 2px 6px rgba(15,23,42,0.8)); }
          100% { opacity: 0.45; filter: drop-shadow(0 2px 8px rgba(251,191,36,0.3)); }
        }
        .clouds-lighting-cycle {
          animation: cloudsLightingAnim 48s ease-in-out infinite;
        }
        .cloud-path-back {
          fill: #475569;
          opacity: 0.5;
        }
        .cloud-path-front {
          fill: #cbd5e1;
          opacity: 0.7;
        }

        /* --- 4. Warehouse Skyline Ambient Contrast --- */
        @keyframes warehouseAmbientAnim {
          0% { filter: brightness(0.85) contrast(1.05); }
          25% { filter: brightness(1.15) contrast(1.0); }
          60% { filter: brightness(0.9) saturate(1.2); }
          85% { filter: brightness(0.7) contrast(1.15); }
          100% { filter: brightness(0.85) contrast(1.05); }
        }
        .warehouse-ambient-cycle {
          animation: warehouseAmbientAnim 48s ease-in-out infinite;
        }

        /* Facility High-Bay & Logo Lights (Glowing brightly at night, dormant in day) */
        @keyframes nightFacilityLightsAnim {
          0% { opacity: 0.4; }
          15% { opacity: 0.1; }
          60% { opacity: 0.5; }
          75% { opacity: 1; }
          92% { opacity: 1; }
          98% { opacity: 0.6; }
          100% { opacity: 0.4; }
        }
        .night-facility-lights {
          animation: nightFacilityLightsAnim 48s ease-in-out infinite;
        }

        /* --- 5. Road Asphalt Day/Night Lighting --- */
        @keyframes roadAsphaltAnim {
          0% { background-color: #1a2233; }
          25% { background-color: #263248; }
          60% { background-color: #1c2233; }
          85% { background-color: #0f1523; }
          100% { background-color: #1a2233; }
        }
        .road-asphalt-cycle {
          animation: roadAsphaltAnim 48s ease-in-out infinite;
        }

        /* Streetlight Pools on Road (Only appear at night) */
        @keyframes nightStreetlightsAnim {
          0% { opacity: 0.2; }
          15% { opacity: 0; }
          62% { opacity: 0.3; }
          74% { opacity: 1; }
          90% { opacity: 1; }
          98% { opacity: 0.4; }
          100% { opacity: 0.2; }
        }
        .night-streetlights-cycle {
          animation: nightStreetlightsAnim 48s ease-in-out infinite;
        }

        /* --- 6. Realistic Truck Lighting & Shading --- */
        /* Truck Body Ambient Tone (Golden at dawn, bright in day, warm at dusk, moonlit at night) */
        @keyframes truckBodyAnim {
          0% { filter: brightness(0.92) saturate(1.1); }
          25% { filter: brightness(1.12) contrast(1.02); }
          60% { filter: brightness(0.95) saturate(1.3) sepia(0.15); }
          85% { filter: brightness(0.82) contrast(1.1); }
          100% { filter: brightness(0.92) saturate(1.1); }
        }
        .truck-body-cycle {
          animation: truckBodyAnim 48s ease-in-out infinite;
        }

        /* Headlights & Taillights (Zero in bright day, high-intensity xenon beam at night) */
        @keyframes nightLightsAnim {
          0% { opacity: 0.2; }
          15% { opacity: 0; }
          58% { opacity: 0.2; }
          70% { opacity: 0.8; }
          78% { opacity: 1; }
          92% { opacity: 1; }
          98% { opacity: 0.5; }
          100% { opacity: 0.2; }
        }
        .night-lights-cycle {
          animation: nightLightsAnim 48s ease-in-out infinite;
        }

        /* Dynamic Ground Drop Shadow (Crisp in day, softer at night) */
        @keyframes truckShadowAnim {
          0% { background-color: rgba(0, 0, 0, 0.7); filter: blur(4px); }
          25% { background-color: rgba(0, 0, 0, 0.9); filter: blur(2px); }
          60% { background-color: rgba(0, 0, 0, 0.75); filter: blur(4px); }
          85% { background-color: rgba(0, 0, 0, 0.55); filter: blur(6px); }
          100% { background-color: rgba(0, 0, 0, 0.7); filter: blur(4px); }
        }
        .truck-shadow-cycle {
          animation: truckShadowAnim 48s ease-in-out infinite;
        }

        /* --- 7. Line-Haul Kinematics & Wheel Rotation --- */
        @keyframes cloudsDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes skylineDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes roadLaneMove {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes streetlightsMove {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes truckSuspension {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-1.5px); }
          50% { transform: translateY(0.5px); }
          75% { transform: translateY(-1px); }
        }
        @keyframes spinWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-clouds-drift {
          animation: cloudsDrift 90s linear infinite;
          will-change: transform;
        }
        .animate-skyline-drift {
          animation: skylineDrift 45s linear infinite;
          will-change: transform;
        }
        .animate-road-lane {
          animation: roadLaneMove 1.4s linear infinite;
          will-change: transform;
        }
        .animate-streetlights-move {
          animation: streetlightsMove 3.2s linear infinite;
          will-change: transform;
        }
        .animate-truck-suspension {
          animation: truckSuspension 1.8s ease-in-out infinite;
          will-change: transform;
        }
        .animate-spin-wheel {
          animation: spinWheel 0.7s linear infinite;
          transform-origin: center;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}
