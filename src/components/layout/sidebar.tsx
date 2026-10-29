"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_SECTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatar = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "admin_avatar_url")
          .maybeSingle();
        if (data?.value) {
          setAvatarUrl(data.value);
          return;
        } else {
          setAvatarUrl(null);
        }
      } catch (e) {
        console.warn("Sidebar avatar fetch error:", e);
      }
    }
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("spd_admin_avatar");
      setAvatarUrl(local || null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("spd_sidebar_collapsed");
    if (stored) {
      setCollapsed(stored === "true");
    }
    setMounted(true);
    fetchAvatar();

    const fetchUser = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: sbUser } = await supabase
            .from("users")
            .select("name, email, role, avatar, avatar_url")
            .or("role.eq.SUPER_ADMIN,role.eq.ADMIN")
            .maybeSingle();
          if (sbUser) {
            setCurrentUser((prev: any) => ({
              ...(prev || {}),
              name: sbUser.name || prev?.name || "System Admin",
              email: sbUser.email || prev?.email || "admin@spd.com",
              role: sbUser.role || "SUPER_ADMIN",
            }));
          }
        } catch {}
      }

      try {
        const storedUser = localStorage.getItem("spd_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser((prev: any) => ({ ...(prev || {}), ...parsed }));
        }
      } catch {}

      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUser((prev: any) => ({ ...(prev || {}), ...data.data }));
        }
      } catch {
        // Ignore fallback
      }
    };

    fetchUser();

    const handleProfileUpdated = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl);
      } else if (e.detail?.avatar !== undefined) {
        setAvatarUrl(e.detail.avatar);
      }
      if (e.detail?.name) {
        setCurrentUser((prev: any) => ({ ...(prev || {}), ...e.detail }));
      } else {
        fetchUser();
      }
    };

    const handleAvatarUpdated = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl);
      } else if (e.detail?.avatar !== undefined) {
        setAvatarUrl(e.detail.avatar);
      } else {
        fetchAvatar();
      }
    };

    window.addEventListener("spd-admin-avatar-updated", handleAvatarUpdated);
    window.addEventListener("spd-profile-updated", handleProfileUpdated);
    window.addEventListener("focus", () => {
      fetchAvatar();
      fetchUser();
    });

    return () => {
      window.removeEventListener("spd-admin-avatar-updated", handleAvatarUpdated);
      window.removeEventListener("spd-profile-updated", handleProfileUpdated);
      window.removeEventListener("focus", () => {
        fetchAvatar();
        fetchUser();
      });
    };
  }, [fetchAvatar]);

  // Automatically close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen?.(false);
  }, [pathname, setMobileOpen]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    localStorage.setItem("spd_sidebar_collapsed", String(!collapsed));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("spd_user");
      localStorage.removeItem("spd_admin_auth");
      sessionStorage.removeItem("spd_auth_token");
      document.cookie = "spd-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie = "spd-auth-token=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    } catch {}
    window.location.replace("/admin-login");
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser?.name || "Admin User"}
                    className="h-full w-full object-cover rounded-full"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD"}
                  </span>
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

          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold gap-2.5 mt-1 rounded-md transition-colors",
              collapsed && "justify-center px-0"
            )}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-600" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
