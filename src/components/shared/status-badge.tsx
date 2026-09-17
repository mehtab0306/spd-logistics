import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SHIPMENT_STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

// Fallback colors for general statuses if not found in SHIPMENT_STATUS_COLORS
const generalStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30",
  INACTIVE: "bg-muted text-muted-foreground hover:bg-muted/80 border-border",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30",
  COMPLETED: "bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/30",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25 border-red-500/30",
  SUCCESS: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30",
  ERROR: "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25 border-red-500/30",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  
  // Try to get from shipment status colors, then general, then fallback
  const colorClass = 
    (SHIPMENT_STATUS_COLORS as Record<string, string>)?.[normalizedStatus] || 
    generalStatusColors[normalizedStatus] || 
    "bg-muted text-muted-foreground border-border";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium tracking-wide uppercase text-[10px] sm:text-xs",
        colorClass,
        className
      )}
    >
      {status}
    </Badge>
  );
}
