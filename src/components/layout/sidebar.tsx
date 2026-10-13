"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_SECTIONS } from "@/lib/constants";
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
  X,
  Navigation,
  CheckCircle2,
  Handshake,
  Trash2,
  FilePlus2,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Handshake,
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
  Navigation,
  CheckCircle2,
  Trash2,
  FilePlus2,
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
        const storedUser = localStorage.getItem("spd_user");
        const storedAvatar = localStorage.getItem("spd_admin_avatar");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (storedAvatar) parsed.avatar = storedAvatar;
          setCurrentUser(parsed);
        } else if (storedAvatar) {
          setCurrentUser({ avatar: storedAvatar, name: "System Admin" });
        }
      } catch {}
      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.data) {
          const storedAvatar = localStorage.getItem("spd_admin_avatar");
          setCurrentUser({ ...data.data, avatar: storedAvatar || data.data.avatar });
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

  // Automatically close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen?.(false);
  }, [pathname, setMobileOpen]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    localStorage.setItem("spd_sidebar_collapsed", String(!collapsed));
  };

  if (!mounted) {
    return <aside className="w-64 border-r bg-background hidden lg:flex flex-col h-screen" />;
  }

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none w-72 sm:w-64",
    collapsed ? "lg:w-20" : "lg:w-64",
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static"
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen?.(false)}
        />
      )}
      <aside className={sidebarClasses}>
        <div className="flex h-16 items-center justify-between px-4 border-b shrink-0">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen?.(false)}
            className={cn("flex items-center gap-2", collapsed && "lg:justify-center lg:w-full")}
          >
            <img
              src="/images/spd-logo.png"
              alt="SPD Logistics"
              className="h-8 w-8 object-contain rounded-full border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/spd-logo.jpg';
              }}
            />
            <span className={cn("text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-spd-red to-spd-blue uppercase tracking-wider", collapsed && "lg:hidden")}>
              SPD Logistics
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={() => setMobileOpen?.(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hide">
          {ADMIN_NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              )}
              {collapsed && sIdx > 0 && (
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
              )}
              {section.items.map((item) => {
                const Icon = iconMap[item.icon] || Package;
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold"
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
          ))}
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
