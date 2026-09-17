"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger on route change
    setLoading(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(65), 100);
    const timer2 = setTimeout(() => setProgress(100), 300);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-spd-red via-spd-blue to-spd-red transition-all duration-300 ease-out shadow-sm"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(220, 38, 38, 0.7), 0 0 5px rgba(30, 64, 175, 0.5)",
        }}
      />
    </div>
  );
}
