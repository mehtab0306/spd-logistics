"use client";

import React from "react";
import { Truck, ShieldCheck, Route } from "lucide-react";
import { NasaParticles } from "@/components/public/nasa-particles";

export function FleetVideoSection() {
  return (
    <section className="reveal-init reveal-blur w-full py-16 lg:py-24 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-[2px] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambience Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-spd-red/10 dark:bg-spd-red/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-spd-blue/10 dark:bg-spd-blue/20 rounded-full blur-3xl pointer-events-none" />

      {/* NASA-inspired Telemetry Particles floating across the section background */}
      <NasaParticles className="z-[1] opacity-55 dark:opacity-75" particleCount={70} connectDistance={0} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 dark:bg-spd-red/20 text-spd-red border border-spd-red/20 dark:border-spd-red/30 font-extrabold text-xs uppercase tracking-wider mb-3">
            Commercial Fleet In Motion
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Highway Freight Operations
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Experience our heavy commercial fleet in action across Pakistan&apos;s primary trade corridors.
          </p>
        </div>

        {/* Video Player Showcase Container with Guaranteed Fallback */}
        <div 
          className="relative rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-black aspect-video max-w-5xl mx-auto group bg-cover bg-center card-hover-lift"
          style={{ backgroundImage: "url('/images/truck-hero.jpg')" }}
        >
          {/* Background Autoplay Video (Seamless loop, muted, no controls, unclickable, local spd.mp4) */}
          <video
            id="fleet-showcase-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/hero-slide-1.jpg"
            className="w-full h-full object-cover absolute inset-0 z-0 pointer-events-none scale-105"
          >
            <source src="/spd.mp4" type="video/mp4" />
          </video>

          {/* Dark Gradient Overlay for optimal contrast and readable text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none z-[1]" />

          {/* NASA-inspired Star/Particle field floating over the video */}
          <NasaParticles className="z-[2] opacity-75 dark:opacity-90" particleCount={60} connectDistance={0} />

          {/* Top Status Bar (Visible on Desktop / Hidden on Mobile) */}
          <div className="hidden md:flex absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white">Active Trunk Fleet</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-spd-red font-extrabold">Karachi &harr; Lahore Corridor</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-mono text-slate-200 shadow-lg">
              <Truck className="w-4 h-4 text-spd-blue" />
              <span className="font-bold tracking-wider">SUPER PAK DATA FREIGHT</span>
            </div>
          </div>

          {/* Center / Bottom Content Overlay over the background video (Visible on Desktop / Hidden on Mobile) */}
          <div className="hidden md:flex absolute inset-0 flex-col justify-end p-6 sm:p-10 pointer-events-none z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spd-red/90 text-white font-black text-[11px] uppercase tracking-wider mb-2 shadow">
                Live Highway Operations
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                Heavy Commercial Freight In Motion
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed drop-shadow">
                Continuous 24/7 line-haul transit connecting Karachi maritime port terminals with central Punjab distribution hubs.
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-[11px] sm:text-xs font-bold text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                  40ft & 53ft Intermodal
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                  Real-Time Route Tracking
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-emerald-400">
                  &bull; 100% Active Line-Haul
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Fleet Highlights below video */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto mt-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 card-hover-lift">
            <div className="w-10 h-10 rounded-xl bg-spd-red/10 dark:bg-spd-red/20 text-spd-red flex items-center justify-center shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-950 dark:text-white">Long-Haul Highway Routing</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Non-stop container & bulk freight transport</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 card-hover-lift">
            <div className="w-10 h-10 rounded-xl bg-spd-blue/10 dark:bg-spd-blue/20 text-spd-blue flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-950 dark:text-white">Strict Cargo Security</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Sealed trailers with driver verification</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 card-hover-lift">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-950 dark:text-white">Modern Heavy Fleet</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Multi-axle trucks maintained to ISO standards</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
