"use client";

import React, { useState, useEffect } from "react";
import { Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone display mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Pick up early beforeinstallprompt event if intercepted in head
    if (typeof window !== "undefined" && (window as any).__spd_deferredPrompt) {
      setDeferredPrompt((window as any).__spd_deferredPrompt);
    }

    // 3. Register Service Worker directly
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (document.readyState === "complete") {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("[SPD PWA] Service worker registration error:", err);
        });
      } else {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch((err) => {
            console.warn("[SPD PWA] Service worker registration error:", err);
          });
        });
      }
    }

    // 4. Capture native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__spd_deferredPrompt = e;
      setDeferredPrompt(e);
      console.log("[SPD PWA] Native beforeinstallprompt captured.");
    };

    const handleCustomReady = () => {
      if (typeof window !== "undefined" && (window as any).__spd_deferredPrompt) {
        setDeferredPrompt((window as any).__spd_deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).__spd_deferredPrompt = null;
      }
      console.log("[SPD PWA] SPD Logistics app installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("spd-pwa-ready", handleCustomReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("spd-pwa-ready", handleCustomReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. Trigger direct browser download of SPD Logistics APK from public/assets
    if (typeof window !== "undefined") {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const link = document.createElement("a");
      link.href = "/assets/SPD-Logistics-App.apk";
      link.download = "SPD-Logistics-App.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (isIos) {
        toast.success("Downloading SPD App Package. On iPhone: tap Share [↑] and 'Add to Home Screen'.");
      } else {
        toast.success("Downloading SPD Logistics App (assets/SPD-Logistics-App.apk)");
      }
    }

    // 2. If native PWA install prompt is available, also invoke it
    const promptEvent =
      deferredPrompt ||
      (typeof window !== "undefined" ? (window as any).__spd_deferredPrompt : null);

    if (promptEvent) {
      try {
        // Trigger native Chrome/Android install prompt
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === "accepted") {
          setIsInstalled(true);
          console.log("[SPD PWA] User accepted native PWA install prompt");
        } else {
          console.log("[SPD PWA] User dismissed native PWA install prompt");
        }
        setDeferredPrompt(null);
        if (typeof window !== "undefined") {
          (window as any).__spd_deferredPrompt = null;
        }
      } catch (err) {
        console.warn("[SPD PWA] Error invoking native prompt:", err);
      }
    }
  };

  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs select-none ${className}`}
        title="SPD Logistics App is installed"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className={`relative group font-extrabold text-xs gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-spd-red hover:text-spd-red dark:hover:text-spd-red shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${className}`}
      title="Download SPD Logistics App"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spd-red opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-spd-red"></span>
      </span>
      <Download className="w-3.5 h-3.5 text-spd-red group-hover:translate-y-0.5 transition-transform" />
      <span className="tracking-tight">Download App</span>
    </Button>
  );
}
