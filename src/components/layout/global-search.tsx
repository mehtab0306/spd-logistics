"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  Package,
  Users,
  Truck,
  UserCheck,
  BookOpen,
  CreditCard,
  FileText,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  category: string;
}

interface SearchResults {
  customers: SearchItem[];
  bilties: SearchItem[];
  tracking: SearchItem[];
  vehicles: SearchItem[];
  drivers: SearchItem[];
  cashBooks: SearchItem[];
  accounts: SearchItem[];
  challans: SearchItem[];
}

const CATEGORY_CONFIG: Record<
  keyof SearchResults,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  customers: { label: "CUSTOMERS", icon: Users },
  bilties: { label: "BILTIES", icon: Package },
  tracking: { label: "TRACKING", icon: MapPin },
  vehicles: { label: "VEHICLES", icon: Truck },
  drivers: { label: "DRIVERS", icon: UserCheck },
  cashBooks: { label: "CASH BOOKS", icon: BookOpen },
  accounts: { label: "ACCOUNTS", icon: CreditCard },
  challans: { label: "CHALLANS", icon: FileText },
};

interface GlobalSearchProps {
  className?: string;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function GlobalSearch({ className, isMobile = false, onCloseMobile }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
          setTotalCount(data.totalCount || 0);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      if (isMobile && onCloseMobile) {
        onCloseMobile();
      }
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setTotalCount(0);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectResult = (item: SearchItem) => {
    setIsOpen(false);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
    router.push(item.href);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className || ""}`}
      style={{ isolation: "isolate" }}
    >
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && results) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Global search (diesel, bilty, customer, vehicle, driver...)"
          className="w-full h-10 pl-10 pr-9 rounded-xl border border-input bg-background/90 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spd-red/50 focus-visible:border-spd-red transition-all"
        />

        {/* Clear X or Loading Spinner button (strictly inside input container) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown Panel */}
      {isOpen && query.trim().length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 w-full min-w-[320px] max-h-[500px] overflow-y-auto rounded-xl border border-border bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-2xl z-50 divide-y divide-border/60 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Header Status Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 text-xs text-muted-foreground font-medium sticky top-0 backdrop-blur-md z-10 border-b border-border/50">
            <span>
              {isLoading
                ? "Searching database..."
                : totalCount > 0
                ? `${totalCount} matching record${totalCount > 1 ? "s" : ""} found`
                : "Search results"}
            </span>
            <span className="text-[11px] opacity-75">Press Esc to dismiss</span>
          </div>

          {/* Loading Indicator */}
          {isLoading && !results && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-spd-red" />
              <span>Searching across all modules...</span>
            </div>
          )}

          {/* Empty Results State */}
          {!isLoading && totalCount === 0 && (
            <div className="py-8 px-4 text-center">
              <p className="text-sm font-semibold text-foreground">No matching records found</p>
              <p className="text-xs text-muted-foreground mt-1">
                No results found for &ldquo;<span className="text-foreground">{query}</span>&rdquo;.
                Try checking spelling or search by phone, bilty #, or name.
              </p>
            </div>
          )}

          {/* Result Categories */}
          {results && totalCount > 0 && (
            <div>
              {(Object.keys(CATEGORY_CONFIG) as Array<keyof SearchResults>).map((key) => {
                const items = results[key];
                if (!items || items.length === 0) return null;

                const { label, icon: IconComponent } = CATEGORY_CONFIG[key];

                return (
                  <div key={key} className="py-2">
                    <div className="flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <IconComponent className="h-3.5 w-3.5 text-spd-red" />
                      <span>{label}</span>
                      <span className="ml-auto text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5 px-1.5">
                      {items.map((item) => (
                        <div
                          key={`${key}-${item.id}`}
                          onClick={() => handleSelectResult(item)}
                          className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/80 hover:text-accent-foreground cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate group-hover:text-spd-red transition-colors">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 font-normal shrink-0 border-muted-foreground/30"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0 pl-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
