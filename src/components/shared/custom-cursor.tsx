"use client";

import React, { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (
      typeof window === "undefined" ||
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // 1. Center dot follows immediately (exact mouse pointer position)
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

      if (!isVisible) {
        ringX = mouseX;
        ringY = mouseY;
        isVisible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      isVisible = false;
    };

    const handleMouseDown = () => {
      ring.classList.add("cursor-clicking");
      dot.classList.add("cursor-clicking");
    };

    const handleMouseUp = () => {
      ring.classList.remove("cursor-clicking");
      dot.classList.remove("cursor-clicking");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // 2. Outer follower ring: slow smooth follow with natural easing delay
    const animate = () => {
      if (isVisible) {
        ringX += (mouseX - ringX) * 0.14;
        ringY += (mouseY - ringY) * 0.14;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Hover effect on clickable items across cards, buttons, images, inputs, and links
    const clickableSelector =
      "button, a, input, textarea, select, [role='button'], [onclick], .cursor-pointer, .hover-lift, .faq-card, summary";

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(clickableSelector)) {
        ring.classList.add("cursor-hover");
        dot.classList.add("cursor-hover");
      }
    };

    const handleOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(clickableSelector)) {
        ring.classList.remove("cursor-hover");
        dot.classList.remove("cursor-hover");
      }
    };

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* 1. Center Dot: Fast immediate tracking at actual mouse position */}
      <div
        ref={dotRef}
        id="spd-cursor-dot"
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full pointer-events-none z-[9999999] opacity-0 transition-opacity duration-150 ease-out"
        style={{
          willChange: "transform, opacity",
          animation: "spdBrandDotGlow 6s infinite ease-in-out",
        }}
      />

      {/* 2. Outer Follower Ring: Smooth slow floating follow around the dot */}
      <div
        ref={ringRef}
        id="spd-cursor-ring"
        className="fixed top-0 left-0 w-[32px] h-[32px] rounded-full pointer-events-none z-[9999998] opacity-0 transition-[width,height,opacity] duration-200 ease-out"
        style={{
          willChange: "transform, opacity",
          animation: "spdBrandRingGlow 6s infinite ease-in-out",
        }}
      />

      <style jsx global>{`
        /* Hide default browser mouse arrow on desktop devices */
        @media (pointer: fine) {
          html,
          body,
          *,
          *::before,
          *::after {
            cursor: none !important;
          }
        }

        /* Outer ring hover & click states */
        #spd-cursor-ring.cursor-hover {
          width: 46px !important;
          height: 46px !important;
        }

        #spd-cursor-ring.cursor-clicking {
          width: 24px !important;
          height: 24px !important;
        }

        #spd-cursor-ring.cursor-hover.cursor-clicking {
          width: 38px !important;
          height: 38px !important;
        }

        #spd-cursor-dot.cursor-hover {
          transform: scale(1.3);
        }

        /* Smooth color transition: Red -> Blue -> White */
        @keyframes spdBrandRingGlow {
          0% {
            border: 1.5px solid #dc2626;
            background-color: rgba(220, 38, 38, 0.08);
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.2);
          }
          33.3% {
            border: 1.5px solid #1e40af;
            background-color: rgba(30, 64, 175, 0.08);
            box-shadow: 0 0 10px rgba(30, 64, 175, 0.5), 0 0 20px rgba(30, 64, 175, 0.2);
          }
          66.6% {
            border: 1.5px solid #ffffff;
            background-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.25);
          }
          100% {
            border: 1.5px solid #dc2626;
            background-color: rgba(220, 38, 38, 0.08);
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.2);
          }
        }

        @keyframes spdBrandDotGlow {
          0% {
            background-color: #dc2626;
            box-shadow: 0 0 6px rgba(220, 38, 38, 0.9);
          }
          33.3% {
            background-color: #1e40af;
            box-shadow: 0 0 6px rgba(30, 64, 175, 0.9);
          }
          66.6% {
            background-color: #ffffff;
            box-shadow: 0 0 6px rgba(255, 255, 255, 1);
          }
          100% {
            background-color: #dc2626;
            box-shadow: 0 0 6px rgba(220, 38, 38, 0.9);
          }
        }
      `}</style>
    </>
  );
}
