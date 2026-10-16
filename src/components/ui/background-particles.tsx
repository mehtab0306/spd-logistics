"use client";

import React, { useEffect, useRef } from "react";

interface Sphere {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface BackgroundParticlesProps {
  className?: string;
  count?: number;
}

// 3 Exact SPD Brand Colors for Floating Spheres
const SPD_SPHERE_COLORS = [
  {
    fill: "rgba(220, 38, 38, 0.28)",      // SPD Crimson Red
    glow: "rgba(220, 38, 38, 0.12)",
  },
  {
    fill: "rgba(29, 78, 216, 0.28)",      // SPD Royal Blue
    glow: "rgba(29, 78, 216, 0.12)",
  },
  {
    fill: "rgba(15, 23, 42, 0.20)",       // SPD Deep Charcoal / Black
    glow: "rgba(15, 23, 42, 0.08)",
  },
];

export function BackgroundParticles({
  className = "",
  count = 42,
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

    const spheres: Sphere[] = [];

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

    const initSpheres = () => {
      spheres.length = 0;
      const actualWidth = width || window.innerWidth || 1200;
      const actualHeight = height || window.innerHeight || 800;

      // Adjust sphere count based on screen size for lag-free performance
      const effectiveCount =
        actualWidth < 768
          ? Math.min(22, count)
          : actualWidth < 1200
          ? Math.min(32, count)
          : count;

      for (let i = 0; i < effectiveCount; i++) {
        // Radius between 5px and 10px as specified
        const radius = 5 + Math.random() * 5;
        const colorSet = SPD_SPHERE_COLORS[i % SPD_SPHERE_COLORS.length];

        spheres.push({
          x: Math.random() * actualWidth,
          y: Math.random() * actualHeight,
          radius,
          baseRadius: radius,
          // Gentle floating drift across background
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          color: colorSet.fill,
          glowColor: colorSet.glow,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
        });
      }
    };

    handleResize();
    initSpheres();

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.66, 2.0);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < spheres.length; i++) {
        const s = spheres[i];

        // Move sphere
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Subtle breathing pulse within 5-10px range
        s.pulsePhase += s.pulseSpeed * dt;
        s.radius = s.baseRadius + Math.sin(s.pulsePhase) * 1.2;

        // Soft boundary wrapping with padding
        const pad = s.radius + 20;
        if (s.x < -pad) s.x = width + pad;
        if (s.x > width + pad) s.x = -pad;
        if (s.y < -pad) s.y = height + pad;
        if (s.y > height + pad) s.y = -pad;

        // Draw soft ambient outer glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = s.glowColor;
        ctx.fill();

        // Draw smooth circular sphere
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
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
