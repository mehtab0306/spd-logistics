"use client";

import React, { useState, useEffect } from "react";
import { Download, CheckCircle, Smartphone, X, Share2, MoreVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone display mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect iOS environment
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    // 3. Register Service Worker
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
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).__spd_deferredPrompt = e;
      setDeferredPrompt(e);
      console.log("[SPD PWA] beforeinstallprompt captured.");
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
      toast.success("SPD Logistics App successfully installed on your Home Screen!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("spd-pwa-ready", handleCustomReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("spd-pwa-ready", handleCustomReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent =
      deferredPrompt ||
      (typeof window !== "undefined" ? (window as any).__spd_deferredPrompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === "accepted") {
          setIsInstalled(true);
          toast.success("SPD Logistics app installing to your Home Screen!");
        }
        setDeferredPrompt(null);
        if (typeof window !== "undefined") {
          (window as any).__spd_deferredPrompt = null;
        }
      } catch (err) {
        console.warn("[SPD PWA] Error invoking native prompt:", err);
        setShowGuideModal(true);
      }
    } else {
      // If event has not fired yet or on mobile iOS/Chrome browser, show user-friendly installation guide
      setShowGuideModal(true);
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
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className={`relative group font-extrabold text-xs gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-spd-red hover:text-spd-red dark:hover:text-spd-red shadow-xs transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs ${className}`}
        title="Download SPD Logistics App"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spd-red opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-spd-red"></span>
        </span>
        <Download className="w-3.5 h-3.5 text-spd-red group-hover:translate-y-0.5 transition-transform" />
        <span className="tracking-tight">Download App</span>
      </Button>

      {/* Clean PWA Install Guidance Popup Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-spd-blue flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  Install SPD Logistics App
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">1-Click Home Screen App</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Android (Chrome) Instruction */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                !isIosDevice
                  ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60"
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <MoreVertical className="w-4 h-4 text-spd-blue" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Android (Chrome)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Browser menu (3 dots) par click karein aur <strong>&ldquo;Install App&rdquo;</strong> ya <strong>&ldquo;Add to Home screen&rdquo;</strong> dabayein.
                </p>
              </div>

              {/* iPhone (Safari) Instruction */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                isIosDevice
                  ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60"
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Share2 className="w-4 h-4 text-spd-blue" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">iPhone (Safari)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Share button dabayein aur <strong>&ldquo;Add to Home Screen&rdquo;</strong> select karein.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-spd-blue hover:bg-spd-blueHover text-white rounded-xl text-xs font-bold py-2.5 mt-2 shadow-sm"
            >
              Samajh Gaya (Close)
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default PwaInstallButton;
