"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  Package,
  MapPin,
  Truck,
  UserCog,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  FileSpreadsheet,
  Shield,
  Settings,
  ClipboardList,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  Package,
  MapPin,
  Truck,
  UserCog,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  FileSpreadsheet,
  Shield,
  Settings,
  ClipboardList,
};

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("spd_sidebar_collapsed");
    if (stored) {
      setCollapsed(stored === "true");
    }
    setMounted(true);

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      } catch {
        // Ignore fallback
      }
    };

    fetchUser();

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        fetchUser();
      }
    };

    window.addEventListener("spd-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("spd-profile-updated", handleProfileUpdated);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    localStorage.setItem("spd_sidebar_collapsed", String(!collapsed));
  };

  if (!mounted) {
    return <aside className="w-64 border-r bg-background hidden lg:flex flex-col h-screen" />;
  }

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300",
    collapsed ? "w-20" : "w-64",
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static"
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}
      <aside className={sidebarClasses}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/admin/dashboard" className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <img
              src="/images/spd-logo.png"
              alt="SPD Logistics"
              className="h-8 w-8 object-contain rounded-full border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/spd-logo.jpg';
              }}
            />
            {!collapsed && (
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-spd-red to-spd-blue uppercase tracking-wider">
                SPD Logistics
              </span>
            )}
          </Link>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen?.(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon] || Package;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.title : undefined}
                onClick={() => setMobileOpen?.(false)}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-spd-red")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-muted-foreground hover:text-foreground mb-2", collapsed && "justify-center px-0")}
            onClick={toggleCollapse}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          <Link href="/admin/profile" title="Admin Profile & Settings">
            <div className={cn("flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors", collapsed && "justify-center px-0")}>
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || "Admin User"}
                    className="h-full w-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{currentUser?.name || "Admin User"}</span>
                  <span className="text-xs text-muted-foreground truncate">{currentUser?.email || "admin@spd.com"}</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
