"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminNavbar } from "@/components/layout/admin-navbar";
import { DatabaseAlertBanner } from "@/components/admin/database-alert-banner";
import { AiCopilotWidget } from "@/components/ai/ai-copilot-widget";
import { TruckLoader } from "@/components/ui/truck-loader";
import { Loader2, ShieldCheck } from "lucide-react";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const transitionStartRef = React.useRef<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAuth = () => {
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

        // 2. Check localStorage for admin session
        let parsedUser: any = null;
        try {
          const rawUser = localStorage.getItem("spd_user") || localStorage.getItem("spd_admin_auth");
          if (rawUser) {
            parsedUser = JSON.parse(rawUser);
          }
        } catch {}

        // 3. Check sessionStorage
        const sessionToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("spd_auth_token") : null;

        // If a user profile exists with non-admin role (e.g. CUSTOMER or DRIVER), immediately reject
        if (parsedUser && parsedUser.role && !ADMIN_ROLES.includes(parsedUser.role)) {
          if (isMounted) setIsAuthorized(false);
          const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
          window.location.replace(`/admin-login${redirectTarget}`);
          return;
        }

        // Check if admin credentials exist
        const hasAdminRole = parsedUser ? (!parsedUser.role || ADMIN_ROLES.includes(parsedUser.role)) : false;
        const isAuthenticated = (hasValidCookie || Boolean(sessionToken)) && (hasAdminRole || !parsedUser);

        // Also accept if valid admin cookie exists directly (e.g. hard-coded admin session or verified JWT)
        if (isAuthenticated || hasValidCookie) {
          if (isMounted) setIsAuthorized(true);

          // Background session healthcheck against API to catch server-side token expiry
          fetch("/api/auth/me")
            .then((res) => {
              if (res.status === 401 || res.status === 403) {
                try {
                  localStorage.removeItem("spd_user");
                  localStorage.removeItem("spd_admin_auth");
                  document.cookie = "spd-auth-token=; path=/; max-age=0";
                } catch {}
                const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
                window.location.replace(`/admin-login${redirectTarget}`);
              }
            })
            .catch(() => {
              // Network offline / fallback allows offline admin usage
            });
          return;
        }

        // Not authenticated — immediately redirect to login without flashing admin UI
        if (isMounted) setIsAuthorized(false);
        const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
        window.location.replace(`/admin-login${redirectTarget}`);
      } catch {
        if (isMounted) setIsAuthorized(false);
        window.location.replace("/admin-login");
      }
    };

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Handle route transition loader for tab/navigation changes
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/admin") &&
        !href.startsWith("/admin#") &&
        !target.hasAttribute("download") &&
        target.getAttribute("target") !== "_blank"
      ) {
        const cleanHref = href.split("?")[0].split("#")[0];
        const cleanCurrent = pathname.split("?")[0].split("#")[0];
        if (cleanHref !== cleanCurrent) {
          transitionStartRef.current = Date.now();
          setIsNavigating(true);
        }
      }
    };

    const handleCustomLoading = (e: any) => {
      if (e.detail?.active) {
        transitionStartRef.current = Date.now();
        setIsNavigating(true);
      } else {
        setIsNavigating(false);
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("spd-route-loading", handleCustomLoading);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("spd-route-loading", handleCustomLoading);
    };
  }, [pathname]);

  // Auto-dismiss smoothly when target route finishes loading with min ~600ms duration for satisfying feel
  useEffect(() => {
    if (isNavigating) {
      const elapsed = Date.now() - transitionStartRef.current;
      const remaining = Math.max(0, 600 - elapsed);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [pathname, isNavigating]);

  // While verifying or if unauthorized, do not render any admin UI, tables, or confidential logistics data
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4 text-center px-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl relative">
            <Loader2 className="w-7 h-7 text-spd-red animate-spin" />
            <ShieldCheck className="w-4 h-4 text-emerald-400 absolute bottom-1 right-1" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold tracking-wider uppercase text-white">
              Verifying Admin Access...
            </p>
            <p className="text-xs text-slate-400">
              Securing SPD Logistics Operations Hub
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TruckLoader isVisible={isNavigating} subtitle="SPD Logistics • Loading Operations..." />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0 min-w-0">
        <AdminNavbar onMenuClick={() => setMobileOpen(true)} />
        <DatabaseAlertBanner />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
      <AiCopilotWidget />
    </div>
  );
}
