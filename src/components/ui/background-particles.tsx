"use client";

import React, { useEffect, useRef } from "react";

interface MicroDot {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface BackgroundParticlesProps {
  className?: string;
  count?: number;
}

// 3 Subtle SPD Brand Colors with soft opacity for refined micro-dots (No bulky spheres)
const SPD_BRAND_COLORS = [
  "rgba(220, 38, 38, 0.3)",  // SPD Crimson
  "rgba(29, 78, 216, 0.3)",  // SPD Royal Blue
  "rgba(30, 41, 59, 0.2)",   // SPD Charcoal
];

export function BackgroundParticles({
  className = "",
  count = 60,
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const dots: MicroDot[] = [];

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    const initDots = () => {
      dots.length = 0;
      const actualWidth = width || window.innerWidth || 1200;
      const actualHeight = height || window.innerHeight || 800;

      // Exact Density: 50-70 tiny dots on desktop, 30 on mobile
      const effectiveCount = actualWidth < 768 ? 30 : Math.min(Math.max(count, 50), 70);

      for (let i = 0; i < effectiveCount; i++) {
        // Radius: strictly between 0.8px and 1.5px (tiny pinhead micro-dots)
        const radius = Math.random() * 0.7 + 0.8;
        const color = SPD_BRAND_COLORS[i % SPD_BRAND_COLORS.length];

        dots.push({
          x: Math.random() * actualWidth,
          y: Math.random() * actualHeight,
          radius,
          baseRadius: radius,
          // Ultra-smooth, slow ambient floating drift without abrupt jumps
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          color,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.012,
        });
      }
    };

    handleResize();
    initDots();

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.66, 2.0);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Slow ambient drift
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // Micro-breathing oscillation strictly within 0.8px and 1.5px
        d.pulsePhase += d.pulseSpeed * dt;
        d.radius = Math.min(1.5, Math.max(0.8, d.baseRadius + Math.sin(d.pulsePhase) * 0.15));

        // Wrap around canvas boundaries smoothly
        const pad = 10;
        if (d.x < -pad) d.x = width + pad;
        if (d.x > width + pad) d.x = -pad;
        if (d.y < -pad) d.y = height + pad;
        if (d.y > height + pad) d.y = -pad;

        // Draw refined subtle micro-dot (strictly sharp pinhead dot, zero blur)
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}

export default BackgroundParticles;
