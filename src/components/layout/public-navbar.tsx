"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, LogIn, ShieldCheck, UserCheck, Truck, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaInstallButton } from "@/components/shared/pwa-install-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function PublicNavbar() {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about-section" },
    { name: "Services", href: "/#services-section" },
    { name: "Tracking", href: "/tracking" },
    { name: "Contact", href: "/#contact-section" },
  ];

  return (
    <header
      className="sticky top-0 w-full z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo + Brand Title */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/images/spd-logo.jpg"
                alt="SPD Logistics - Super Pak Data Goods Transport Co. Est. 1996"
                className="h-10 sm:h-11 w-auto object-contain rounded-lg shadow-sm border border-slate-200/80 bg-white transition-transform duration-200 hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-tight leading-none block">
                  <span className="text-spd-red">SPD </span>
                  <span className="text-spd-blue">LOGISTICS</span>
                </span>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-0.5">Super Pak Data &bull; Est. 1996</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation: Home, About, Services, Tracking, Contact */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-spd-red dark:hover:text-spd-red transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Controls: Install App + Theme Toggle + Login Button */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Pwa Install Button */}
            <PwaInstallButton />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="bg-spd-blue hover:bg-spd-blueHover text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm gap-2 transition-all group"
                >
                  <LogIn className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>Login</span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 duration-200"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    SPD Logistics Portals
                  </p>
                </div>

                {/* 1. Admin Login */}
                <DropdownMenuItem asChild className="focus:bg-red-500/10 dark:focus:bg-red-500/15 rounded-xl p-2.5 cursor-pointer transition-colors">
                  <Link href="/admin-login" className="flex items-start gap-3 w-full group">
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-spd-red flex items-center justify-center shrink-0 border border-red-200/80 dark:border-red-900/60 transition-transform duration-200 group-hover:scale-110">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-spd-red transition-colors">
                          Admin Login
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-spd-red transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Manage shipments, customers, accounts, cash books, and system reports.
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                {/* 2. Customer Login */}
                <DropdownMenuItem asChild className="focus:bg-blue-500/10 dark:focus:bg-blue-500/15 rounded-xl p-2.5 cursor-pointer transition-colors">
                  <Link href="/customer-login" className="flex items-start gap-3 w-full group">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/60 transition-transform duration-200 group-hover:scale-110">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-spd-blue transition-colors">
                          Customer Login
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-spd-blue transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        View shipment details, bilty records, ledgers, statements, and status.
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                {/* 3. Driver Login */}
                <DropdownMenuItem asChild className="focus:bg-emerald-500/10 dark:focus:bg-emerald-500/15 rounded-xl p-2.5 cursor-pointer transition-colors">
                  <Link href="/driver-login" className="flex items-start gap-3 w-full group">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-900/60 transition-transform duration-200 group-hover:scale-110">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          Driver Login
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Assigned shipments, vehicle status, route updates & delivery confirmations.
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <PwaInstallButton className="px-2.5 py-1.5 text-[11px]" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-2">
          <div className="px-4 pt-3 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 pb-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">Access Portals</p>
              <Link
                href="/admin-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-200/60 dark:border-red-900/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-spd-red flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Admin Login</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Admin dashboard, shipments & operations</p>
                </div>
              </Link>
              <Link
                href="/customer-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-200/60 dark:border-blue-900/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Customer Login</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Customer dashboard, bilty & live tracking</p>
                </div>
              </Link>
              <Link
                href="/driver-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-900/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Driver Login</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Assigned shipments, routes & delivery status</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
