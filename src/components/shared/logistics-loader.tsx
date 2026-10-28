"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Truck, Package, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogisticsLoaderProps {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  overlay?: boolean;
}

export function LogisticsLoader({
  subtitle = "SPD Logistics • Loading Operations...",
  size = "md",
  className,
  overlay = false,
}: LogisticsLoaderProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label={subtitle}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 select-none",
        overlay ? "p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm" : "",
        className
      )}
    >
      <style>{`
        @keyframes spdRoadDash {
          0% { background-position: 0 0; }
          100% { background-position: -48px 0; }
        }
        @keyframes spdTruckCruise {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-0.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(-1px) rotate(0.5deg); }
        }
        @keyframes spdHeadlightPulse {
          0%, 100% { opacity: 0.35; transform: scaleX(1); }
          50% { opacity: 0.85; transform: scaleX(1.18); }
        }
        .spd-truck-vibe {
          animation: spdTruckCruise 0.8s ease-in-out infinite;
        }
        .spd-road-line {
          background: repeating-linear-gradient(
            90deg,
            #ef4444 0px,
            #ef4444 16px,
            transparent 16px,
            transparent 32px
          );
          background-size: 32px 3px;
          animation: spdRoadDash 0.4s linear infinite;
        }
        .spd-headlight {
          animation: spdHeadlightPulse 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .spd-truck-vibe,
          .spd-road-line,
          .spd-headlight {
            animation: none !important;
          }
        }
      `}</style>

      {/* Animated Cargo Truck with Headlights */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          isSm ? "w-24 h-10" : isLg ? "w-44 h-20" : "w-36 h-14"
        )}
      >
        {/* Headlight beam */}
        <div
          className={cn(
            "spd-headlight absolute bg-gradient-to-r from-amber-400/50 via-amber-200/20 to-transparent blur-[3px] rounded-full origin-left",
            isSm ? "right-1 top-4 w-8 h-3" : isLg ? "right-2 top-8 w-18 h-6" : "right-2 top-5 w-14 h-4"
          )}
        />

        {/* Moving Cargo Truck */}
        <div
          className={cn(
            "spd-truck-vibe filter drop-shadow-[0_8px_12px_rgba(239,68,68,0.35)]",
            isSm ? "text-2xl" : isLg ? "text-6xl" : "text-4xl"
          )}
        >
          🚚
        </div>
      </div>

      {/* Animated Moving Highway Road Line */}
      <div
        className={cn(
          "bg-slate-800 dark:bg-slate-700 rounded-full mt-1 overflow-hidden relative border border-slate-700/60 shadow-inner",
          isSm ? "w-28 h-1" : isLg ? "w-52 h-2" : "w-40 h-1.5"
        )}
      >
        <div className="spd-road-line absolute inset-0 w-full h-full" />
      </div>

      {/* Brand Subtitle & Operations Dispatch Status */}
      <div className="mt-3.5 text-center space-y-1">
        <p className="text-xs font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          <span>{subtitle}</span>
        </p>
        <p className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          PAKISTAN NATIONWIDE FLEET LOGISTICS
        </p>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center select-none transition-opacity duration-300 animate-in fade-in">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Logistics-themed Table Skeleton with highway pulse and realistic row columns
 */
export function LogisticsTableSkeleton({
  rows = 5,
  subtitle = "Loading Logistics Records...",
  className,
}: {
  rows?: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-4 animate-in fade-in duration-200", className)}>
      {/* Top Banner with Moving Truck Loader */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-spd-red shrink-0">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {subtitle}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Synchronizing live fleet records with Supabase cloud database
              </p>
            </div>
          </div>
          <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-red-600 rounded-full animate-pulse"
              style={{ width: "65%" }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table Skeletons */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 px-4 flex items-center gap-4">
          <Skeleton className="h-4 w-6 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-36 rounded-md hidden md:block" />
          <Skeleton className="h-4 w-32 rounded-md hidden lg:block" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md ml-auto" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-16 px-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <Skeleton className="h-4 w-6 rounded-md" />
              <div className="space-y-1.5 w-32 sm:w-40">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
              <div className="space-y-1.5 w-44 hidden md:block">
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </div>
              <Skeleton className="h-4 w-28 rounded-md hidden lg:block" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="flex gap-2 ml-auto">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Logistics-themed Card/KPI Grid Skeleton
 */
export function LogisticsCardSkeleton({
  count = 4,
  subtitle = "Calculating Live Logistics Metrics...",
  className,
}: {
  count?: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-6 animate-in fade-in duration-200", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {subtitle}
          </span>
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-3/5 rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Logistics-themed Form Input Skeleton
 */
export function LogisticsFormSkeleton({
  subtitle = "Preparing Form Fields...",
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200", className)}>
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48 rounded-md" />
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Logistics Empty State (Zero-Meter Clean Slate)
 */
export function LogisticsEmptyState({
  title = "No Records Found",
  description = "No entries match your query or the database is at zero-meter clean state.",
  actionLabel,
  actionHref,
  onAction,
  icon: CustomIcon,
  className,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ElementType;
  className?: string;
}) {
  const IconToRender = CustomIcon || Package;

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-10 text-center flex flex-col items-center justify-center space-y-4 my-6 shadow-2xs",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-spd-red flex items-center justify-center border border-red-200/60 dark:border-red-900/50 shadow-inner">
        <IconToRender className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Button
              asChild
              className="bg-spd-red hover:bg-red-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-2 shadow-xs"
            >
              <a href={actionHref}>
                <Plus className="w-4 h-4" />
                <span>{actionLabel}</span>
              </a>
            </Button>
          ) : (
            <Button
              onClick={onAction}
              className="bg-spd-red hover:bg-red-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Logistics Error State with retry
 */
export function LogisticsErrorState({
  message = "Failed to synchronize logistics records.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 p-8 text-center flex flex-col items-center justify-center space-y-3 my-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-md">
        <h4 className="text-sm font-black text-red-900 dark:text-red-200">
          Database Synchronization Alert
        </h4>
        <p className="text-xs text-red-700 dark:text-red-300">{message}</p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-bold gap-1.5 h-8 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </Button>
      )}
    </div>
  );
}
