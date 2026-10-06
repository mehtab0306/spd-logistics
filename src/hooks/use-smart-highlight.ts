"use client";

import { useEffect, useState, useRef } from "react";

/**
 * useSmartHighlight
 * 
 * Provides smooth scrolling and 2.8s soft highlight/pulse effect
 * for records opened via Global Search or direct navigation.
 * Uses window.location.search in useEffect to avoid requiring
 * Suspense boundaries across all parent pages during Next.js static prerender.
 */
export function useSmartHighlight(readyTrigger?: any) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const highlightParam = params.get("highlight") || params.get("focusId");

    if (!highlightParam) {
      setHighlightedId(null);
      return;
    }

    setHighlightedId(highlightParam);
    attemptedRef.current = highlightParam;

    // Retry finding and scrolling into view across multiple render frames
    let timerId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 15;

    const tryScroll = () => {
      attempts++;
      // Search by various common ID/data attributes
      const el =
        document.getElementById(`record-${highlightParam}`) ||
        document.getElementById(`item-${highlightParam}`) ||
        document.getElementById(`tx-row-${highlightParam}`) ||
        document.getElementById(highlightParam) ||
        document.querySelector(`[data-record-id="${highlightParam}"]`) ||
        document.querySelector(`[data-highlight-id="${highlightParam}"]`);

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (attempts < maxAttempts) {
        timerId = setTimeout(tryScroll, 120);
      }
    };

    timerId = setTimeout(tryScroll, 100);

    // Clear pulse after 2.8 seconds
    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 2800);

    return () => {
      clearTimeout(timerId);
      clearTimeout(clearTimer);
    };
  }, [readyTrigger]);

  const isHighlighted = (id?: string | null) => {
    if (!id || !highlightedId) return false;
    return highlightedId === id || highlightedId.includes(id) || id.includes(highlightedId);
  };

  const highlightClass = (id?: string | null, customClass?: string) => {
    if (!isHighlighted(id)) return "";
    return (
      customClass ||
      "ring-2 ring-amber-500 bg-amber-500/15 dark:bg-amber-500/25 shadow-md shadow-amber-500/10 transition-all duration-700 animate-pulse rounded-md"
    );
  };

  return {
    highlightedId,
    isHighlighted,
    highlightClass,
  };
}
