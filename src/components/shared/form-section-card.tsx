import React from "react";
import { cn } from "@/lib/utils";

interface FormSectionCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function FormSectionCard({
  title,
  description,
  icon: Icon,
  badge,
  children,
  className,
  bodyClassName,
}: FormSectionCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-visible transition-all",
        className
      )}
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-t-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-spd-red shadow-2xs shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className={cn("p-5 sm:p-6 overflow-visible", bodyClassName)}>{children}</div>
    </div>
  );
}

export default FormSectionCard;
