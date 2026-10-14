"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Truck, LogOut, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyDriverAuth = () => {
      try {
        // 1. Check cookies for spd-auth-token
        const cookies = typeof document !== "undefined" ? document.cookie.split(";").map((c) => c.trim()) : [];
        const authCookie = cookies.find((c) => c.startsWith("spd-auth-token="));
        const tokenValue = authCookie ? authCookie.split("=")[1] : null;
        const hasValidCookie = Boolean(
          tokenValue &&
          tokenValue !== "" &&
          tokenValue !== "null" &&
          tokenValue !== "undefined"
        );

        // 2. Check localStorage for user profile
        let parsedUser: any = null;
        try {
          const rawUser = localStorage.getItem("spd_user");
          if (rawUser) {
            parsedUser = JSON.parse(rawUser);
          }
        } catch {}

        // If user is logged in with a non-driver role (e.g. CUSTOMER), reject
        if (parsedUser && parsedUser.role && parsedUser.role !== "DRIVER" && parsedUser.role !== "SUPER_ADMIN" && parsedUser.role !== "ADMIN") {
          if (isMounted) setIsAuthorized(false);
          const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
          window.location.replace(`/driver-login${redirectTarget}`);
          return;
        }

        // Check driver authentication
        const hasDriverSession = hasValidCookie || (parsedUser && (parsedUser.role === "DRIVER" || parsedUser.driver));

        if (hasDriverSession) {
          if (isMounted) {
            setIsAuthorized(true);
            if (parsedUser) setCurrentUser(parsedUser);
          }

          // Background verification against API
          fetch("/api/auth/me")
            .then(async (res) => {
              if (res.status === 401 || res.status === 403) {
                try {
                  localStorage.removeItem("spd_user");
                  document.cookie = "spd-auth-token=; path=/; max-age=0";
                } catch {}
                const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
                window.location.replace(`/driver-login${redirectTarget}`);
                return;
              }
              const data = await res.json().catch(() => ({}));
              if (data.success && data.data && isMounted) {
                setCurrentUser(data.data);
              }
            })
            .catch(() => {});
          return;
        }

        // Unauthenticated — immediately eject to /driver-login without flashing UI
        if (isMounted) setIsAuthorized(false);
        const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
        window.location.replace(`/driver-login${redirectTarget}`);
      } catch {
        if (isMounted) setIsAuthorized(false);
        window.location.replace("/driver-login");
      }
    };

    verifyDriverAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Driver logout error:", err);
    } finally {
      try {
        localStorage.removeItem("spd_user");
        document.cookie = "spd-auth-token=; path=/; max-age=0";
      } catch {}
      window.location.replace("/driver-login");
    }
  };

  // Zero-Data-Leak Guard: Block rendering until authorized
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verifying Driver Fleet Authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/driver" className="flex items-center gap-3 group">
            <img
              src="/images/spd-logo.png"
              alt="SPD Logistics"
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white shadow-sm p-0.5 shrink-0 transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/spd-logo.jpg';
              }}
            />
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight block leading-none">
                <span className="text-spd-red">SPD </span>
                <span className="text-emerald-600 dark:text-emerald-400">DRIVER COMMAND</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Fleet Transit & Delivery Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-emerald-500/50 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || "Driver"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[120px]">
                  {currentUser.name || "Driver"}
                </span>
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 bg-white dark:bg-slate-900 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} SPD Logistics &bull; Driver & Fleet Management. Drive Safe!</p>
      </footer>
    </div>
  );
}
