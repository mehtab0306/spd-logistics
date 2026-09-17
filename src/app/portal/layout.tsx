"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Package, LogOut, User, Menu, X, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/customer-login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/customer-login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Portal Badge */}
          <Link href="/portal" className="flex items-center gap-3 group">
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
                <span className="text-spd-blue">CUSTOMER PORTAL</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Dealer & Consignee Hub</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <Link
              href="/portal"
              className="text-slate-700 dark:text-slate-200 hover:text-spd-blue transition-colors"
            >
              Dashboard & Bilties
            </Link>
            <Link
              href="/tracking"
              className="text-slate-500 hover:text-spd-blue transition-colors"
            >
              Public Tracking
            </Link>
            <Link
              href="/#contact-section"
              className="text-slate-500 hover:text-spd-blue transition-colors"
            >
              Support Helpdesk
            </Link>
          </nav>

          {/* Right Action: Avatar & Logout */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-blue-500/50 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || "Customer"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-spd-blue" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[120px]">
                  {currentUser.name || "Customer"}
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
        <p>&copy; {new Date().getFullYear()} SPD Logistics &bull; Super Pak Data Goods Transport Co. All rights reserved.</p>
      </footer>
    </div>
  );
}
