"use client";

import React, { useEffect, useState, useRef } from "react";
import { Clock, Warehouse, Route, CheckCircle2 } from "lucide-react";

interface CounterItem {
  id: string;
  label: string;
  sublabel: string;
  target: number;
  suffix: string;
  icon: any;
  color: string;
}

export function AnimatedCounters() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({
    years: 0,
    warehouses: 0,
    destinations: 0,
    deliveries: 0,
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2500; // 2.5s duration for smooth professional counting
          const startDelay = 350; // slight delay before starting

          const delayTimer = setTimeout(() => {
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Smooth cubic ease-out
              const easeOut = 1 - Math.pow(1 - progress, 3);

              const currentWarehouses = Math.min(2, Math.floor(easeOut * 2.05));

              setCounts({
                years: Math.floor(easeOut * 28),
                warehouses: currentWarehouses,
                destinations: Math.floor(easeOut * 50),
                deliveries: Math.floor(easeOut * 100),
              });

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCounts({
                  years: 28,
                  warehouses: 2,
                  destinations: 50,
                  deliveries: 100,
                });
              }
            };

            requestAnimationFrame(animate);
          }, startDelay);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const stats: CounterItem[] = [
    {
      id: "years",
      label: `${counts.years}+`,
      sublabel: "Years of Experience",
      target: 28,
      suffix: "+",
      icon: Clock,
      color: "text-spd-red bg-spd-red/10 border-spd-red/20",
    },
    {
      id: "warehouses",
      label: `${counts.warehouses}`,
      sublabel: "Strategic Warehouses",
      target: 2,
      suffix: "",
      icon: Warehouse,
      color: "text-spd-blue bg-spd-blue/10 border-spd-blue/20",
    },
    {
      id: "destinations",
      label: `${counts.destinations}+`,
      sublabel: "Cities Covered Nationwide",
      target: 50,
      suffix: "+",
      icon: Route,
      color: "text-spd-red bg-spd-red/10 border-spd-red/20",
    },
    {
      id: "deliveries",
      label: `${counts.deliveries}%`,
      sublabel: "Verified Deliveries",
      target: 100,
      suffix: "%",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div ref={sectionRef} className="w-full py-10 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="reveal-init reveal-zoom-in p-6 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover-lift flex flex-col items-center text-center transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white font-mono">
                  {item.label}
                </div>
                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {item.sublabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
