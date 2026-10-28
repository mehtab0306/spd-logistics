"use client";

import React, { useState, useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AlertTriangle, Database, ExternalLink, X } from "lucide-react";

export function DatabaseAlertBanner() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (isSupabaseConfigured) return null;
  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 sm:px-6 text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-bold text-amber-300">Database Setup Incomplete: </span>
            <span className="text-amber-100">
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be added in Vercel Settings -&gt; Environment Variables.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss notification"
            className="p-1 rounded text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
