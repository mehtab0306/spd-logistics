"use client";

import React from "react";
import { Menu, Search, Sun, Moon, Bell, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/layout/global-search";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AdminNavbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function AdminNavbar({ onMenuClick, title = "Dashboard" }: AdminNavbarProps) {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState<boolean>(false);

  const fetchAvatar = React.useCallback(async () => {
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
        console.warn("Navbar avatar fetch error:", e);
      }
    }
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("spd_admin_avatar");
      setAvatarUrl(local || null);
    }
  }, []);

  const fetchNotificationsCount = React.useCallback(async () => {
    try {
      let count = 0;
      let apiSuccess = false;
      try {
        const res = await fetch("/api/admin/notifications?countOnly=true");
        const data = await res.json();
        if (data.success && typeof data.unreadCount === "number") {
          count = data.unreadCount;
          apiSuccess = true;
        }
      } catch {}

      if (typeof window !== "undefined") {
        const readIds = JSON.parse(localStorage.getItem("spd_notifications_read_ids") || "[]");
        const deletedIds = JSON.parse(localStorage.getItem("spd_notifications_deleted_ids") || "[]");
      }
      setUnreadCount(count);
    } catch {
      // Graceful fallback
    }
  }, []);

  React.useEffect(() => {
    fetchAvatar();

    const fetchUser = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: settingEmail } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "admin_email")
            .maybeSingle();

          const { data: sbAdmin } = await supabase
            .from("admin_users")
            .select("email, full_name, name, role")
            .limit(1)
            .maybeSingle();

          if (sbAdmin || settingEmail) {
            const activeEmail = settingEmail?.value || sbAdmin?.email || "spd@gmail.com";
            const activeName = sbAdmin?.full_name || sbAdmin?.name || "System Admin";
            setCurrentUser((prev: any) => ({
              ...(prev || {}),
              name: activeName,
              email: activeEmail,
              role: sbAdmin?.role || "SUPER_ADMIN",
            }));
          }
        } catch {}
      }

      try {
        const storedUser = localStorage.getItem('spd_user');
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
      } catch {}
    };

    fetchUser();
    fetchNotificationsCount();

    const handleProfileUpdated = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl);
      } else if (e.detail?.avatar !== undefined) {
        setAvatarUrl(e.detail.avatar);
      }
      if (e.detail?.email || e.detail?.name) {
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

    const handleNotificationsUpdated = () => {
      fetchNotificationsCount();
    };

    window.addEventListener("spd-admin-avatar-updated", handleAvatarUpdated);
    window.addEventListener("spd-profile-updated", handleProfileUpdated);
    window.addEventListener("spd-notifications-updated", handleNotificationsUpdated);
    window.addEventListener("focus", () => {
      fetchAvatar();
      fetchUser();
    });

    // Poll count every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000);

    return () => {
      window.removeEventListener("spd-admin-avatar-updated", handleAvatarUpdated);
      window.removeEventListener("spd-profile-updated", handleProfileUpdated);
      window.removeEventListener("spd-notifications-updated", handleNotificationsUpdated);
      window.removeEventListener("focus", () => {
        fetchAvatar();
        fetchUser();
      });
      clearInterval(interval);
    };
  }, [fetchAvatar, fetchNotificationsCount]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    try {
      localStorage.removeItem('spd_user');
      localStorage.removeItem('spd_admin_auth');
      sessionStorage.removeItem('spd_auth_token');
      document.cookie = 'spd-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'spd-auth-token=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {}
    window.location.replace('/admin-login');
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md shadow-sm glass">
      {/* Top Header Bar */}
      <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        {/* Left: Navigation & Page Title */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-accent shrink-0"
            onClick={onMenuClick}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-spd-red to-spd-blue uppercase sm:hidden truncate">
              SPD
            </span>
            <h1 className="text-base sm:text-lg font-semibold truncate hidden sm:block max-w-[150px] lg:max-w-[220px]">
              {title}
            </h1>
          </div>
        </div>

        {/* Center: Global Search (Desktop & Tablet) - Dedicated separate layout element */}
        <div className="hidden md:flex flex-1 items-center justify-center max-w-md lg:max-w-xl mx-2 lg:mx-6">
          <GlobalSearch className="w-full" />
        </div>

        {/* Right: Controls (Theme, Notifications, Profile) - Independent & Unoverlapped */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            title="Search"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Link href="/admin/notifications" title={`Notifications (${unreadCount} unread)`}>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-spd-red text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
              <span className="sr-only">Notifications</span>
            </Button>
          </Link>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border p-0 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Admin"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "SY"}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-[9999]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name || "Admin User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || "spd@gmail.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Expandable Search Bar (Isolated row directly beneath header) */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-3 py-2 animate-in slide-in-from-top-2 duration-150">
          <GlobalSearch
            isMobile={true}
            onCloseMobile={() => setMobileSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
