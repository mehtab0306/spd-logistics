"use client";

import React from "react";
import { Menu, Search, Sun, Moon, Bell, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminNavbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function AdminNavbar({ onMenuClick, title = "Dashboard" }: AdminNavbarProps) {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchNotificationsCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?countOnly=true");
      const data = await res.json();
      if (data.success && typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      } catch {
        // Fallback
      }
    };
    fetchUser();
    fetchNotificationsCount();

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        fetchUser();
      }
    };

    const handleNotificationsUpdated = () => {
      fetchNotificationsCount();
    };

    window.addEventListener("spd-profile-updated", handleProfileUpdated);
    window.addEventListener("spd-notifications-updated", handleNotificationsUpdated);

    // Poll count every 30 seconds
    const interval = setInterval(fetchNotificationsCount, 30000);

    return () => {
      window.removeEventListener("spd-profile-updated", handleProfileUpdated);
      window.removeEventListener("spd-notifications-updated", handleNotificationsUpdated);
      clearInterval(interval);
    };
  }, [fetchNotificationsCount]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin-login';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6 shadow-sm glass">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-semibold truncate hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Global search..."
            className="w-full bg-background pl-9 md:w-[300px] lg:w-[400px] border-muted-foreground/20 focus-visible:ring-spd-red"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Link href="/admin/notifications" title={`Notifications (${unreadCount} unread)`}>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-spd-red text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
            <span className="sr-only">Notifications</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={currentUser?.avatar || undefined}
                  alt={currentUser?.name || "@admin"}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name || "Admin User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email || "admin@spd.com"}
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
    </header>
  );
}
