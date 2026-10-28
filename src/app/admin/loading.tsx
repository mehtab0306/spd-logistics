import React from "react";
import { LogisticsTableSkeleton } from "@/components/shared/logistics-loader";

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 p-2 sm:p-4 animate-in fade-in duration-150">
      <LogisticsTableSkeleton rows={6} subtitle="Loading SPD Logistics Operations..." />
    </div>
  );
}
