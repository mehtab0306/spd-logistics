"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  colorDark: string;
  colorLight: string;
}

interface NasaParticlesProps {
  className?: string;
  particleCount?: number;
  connectDistance?: number;
  theme?: "default" | "hero";
}

export function NasaParticles({
  className = "",
  particleCount = 135,
  connectDistance = 0,
  theme = "default",
}: NasaParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    // DARK / NIGHT MODE:
    // Darker/deeper versions of red and blue, plus soft moonlight white and subtle soft dark particles.
    // Kept very subtle and premium without hurting readability.
    const darkColors = [
      "rgba(185, 28, 28,",   // Deep SPD Red
      "rgba(153, 27, 27,",   // Darker wine red
      "rgba(30, 58, 138,",   // Deeper royal blue
      "rgba(29, 78, 216,",   // Deep sapphire blue
      "rgba(226, 232, 240,", // Soft starlight white
      "rgba(100, 116, 139,", // Subtle soft dark celestial dust
      "rgba(71, 85, 105,",   // Technical slate
    ];

    // LIGHT MODE:
    // Red, blue, subtle dark particles, and clean soft white accents.
    // Clean, elegant, and visible without crowding the page.
    const lightColors = [
      "rgba(220, 38, 38,",   // Crisp SPD Red
      "rgba(30, 64, 175,",   // Crisp SPD Royal Blue
      "rgba(37, 99, 235,",   // Vibrant Blue
      "rgba(71, 85, 105,",   // Subtle technical slate
      "rgba(51, 65, 85,",    // Subtle dark charcoal
      "rgba(185, 28, 28,",   // Deep Red accent
    ];

    // Initialize particles array
    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      const safeWidth = width || window.innerWidth || 1200;
      const safeHeight = height || window.innerHeight || 800;

      // Noticeable, rich particle quantity with responsive scaling
      const isMobile = safeWidth < 768;
      const isTablet = safeWidth >= 768 && safeWidth < 1024;
      const targetCount = isMobile
        ? Math.max(50, Math.floor(particleCount * 0.45))
        : isTablet
        ? Math.max(85, Math.floor(particleCount * 0.70))
        : particleCount;

      const areaCapacity = Math.floor((safeWidth * safeHeight) / 10500);
      const count = Math.max(
        isMobile ? 45 : 85,
        Math.min(targetCount, Math.max(targetCount - 15, areaCapacity))
      );

      // Stratified 2D Grid: guarantees even, uniform distribution across the ENTIRE viewport
      // Prevents particles from bunching on the left, right, or in one area
      const cols = Math.ceil(Math.sqrt(count * (safeWidth / safeHeight)));
      const rows = Math.ceil(count / cols);
      const cellWidth = safeWidth / cols;
      const cellHeight = safeHeight / rows;

      for (let i = 0; i < count; i++) {
        const colorIdx = Math.floor(Math.random() * darkColors.length);

        // Natural mix of small (65%), medium (25%), and a few larger/thicker particles (10%)
        let radius: number;
        let speed: number;
        const sizeRoll = Math.random();

        if (sizeRoll < 0.65) {
          // Small particles: 1.0px to 1.6px
          radius = Math.random() * 0.6 + 1.0;
          speed = Math.random() * 0.08 + 0.12;
        } else if (sizeRoll < 0.90) {
          // Medium particles: 1.9px to 2.7px
          radius = Math.random() * 0.8 + 1.9;
          speed = Math.random() * 0.06 + 0.08;
        } else {
          // Larger / thicker particles: 3.0px to 4.2px (soft floating nodes)
          radius = Math.random() * 1.2 + 3.0;
          speed = Math.random() * 0.04 + 0.05;
        }

        // Stratified position inside grid cell with natural organic jitter
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col + 0.08 + Math.random() * 0.84) * cellWidth;
        const y = (row + 0.08 + Math.random() * 0.84) * cellHeight;

        // Balanced 360-degree drifting angles so velocities never pull all particles toward one side
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Subtle, elegant alpha (never harsh or glaring)
        const baseAlpha = Math.random() * 0.22 + 0.22; // 0.22 to 0.44

        particles.push({
          x,
          y,
          radius,
          vx,
          vy,
          baseAlpha,
          pulseSpeed: Math.random() * 0.008 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
          colorDark: darkColors[colorIdx],
          colorLight: lightColors[colorIdx],
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width || window.innerWidth || 1200;
      height = rect.height || window.innerHeight || 800;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      initParticles();
    };

    resize();
    window.addEventListener("resize", resize);

    // Pause animation when scrolled offscreen for battery & performance savings
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          render();
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!isVisible) return;

      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      ctx.clearRect(0, 0, width, height);

      // Render ONLY soft round dots/circles (NO lines, NO trails, NO streaks, NO geometric shapes)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Continuous smooth drifting movement on their own
        p.x += p.vx;
        p.y += p.vy;

        // Balanced full-screen recycling: when exiting an edge, re-enter uniformly distributed
        if (p.x < -20) {
          p.x = width + 10;
          p.y = Math.random() * height;
        } else if (p.x > width + 20) {
          p.x = -10;
          p.y = Math.random() * height;
        }

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        // Gentle, smooth, breathing pulse
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = Math.max(
          0.12,
          Math.min(0.52, p.baseAlpha + Math.sin(p.pulsePhase) * 0.12)
        );

        const baseColor = isDark ? p.colorDark : p.colorLight;

        ctx.save();
        ctx.beginPath();
        // Soft round circle
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (isDark) {
          // Dark Mode: subtle, soft glow that stays behind content and never hurts readability
          ctx.shadowColor = baseColor + "0.28)";
          ctx.shadowBlur = p.radius * 1.3;
          ctx.fillStyle = baseColor + `${currentAlpha})`;
        } else {
          // Light Mode: clean, crisp, soft round dot
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.fillStyle = baseColor + `${currentAlpha * 0.85})`;
        }

        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [particleCount, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
