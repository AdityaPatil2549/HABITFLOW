import React, { useEffect, useRef } from 'react';
import { useChronoStore } from '../../store/chronoStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
}

export function CircadianSkybox() {
  const { currentEpoch, solarState } = useChronoStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Micro-particulate atmospheric canvas engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = Math.min(window.innerHeight, 900));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.min(window.innerHeight, 900);
    };
    window.addEventListener('resize', handleResize);

    // Initialize 28 lightweight particles
    const particleCount = 28;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: currentEpoch === 'dusk' ? -0.25 - Math.random() * 0.35 : (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6,
        maxAlpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Color tuning based on epoch
      let r = 245, g = 158, b = 11; // Amber/Gold default
      if (currentEpoch === 'zenith') {
        r = 6; g = 182; b = 212; // Cyan
      } else if (currentEpoch === 'night') {
        r = 168; g = 85; b = 247; // Violet/Indigo
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse alpha
        p.alpha += p.pulseSpeed;
        const currentAlpha = Math.abs(Math.sin(p.alpha)) * p.maxAlpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEpoch]);

  const { sunXPercent, sunYPercent, glowOpacity, elevationDeg } = solarState;
  const isNight = currentEpoch === 'night';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--canvas-ground, #06080d)',
        transition: 'background-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* ── LAYER 0: Astronomical Sun/Moon Atmospheric Radial Glow ── */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full blur-[110px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          left: `${sunXPercent}%`,
          top: `${sunYPercent}%`,
          transform: 'translate(-50%, -50%)',
          background: isNight
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(168, 85, 247, 0.12) 45%, transparent 70%)'
            : currentEpoch === 'dusk'
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.40) 0%, rgba(255, 191, 36, 0.18) 40%, rgba(20, 184, 166, 0.08) 65%, transparent 75%)'
            : currentEpoch === 'dawn'
            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.30) 0%, rgba(59, 130, 246, 0.12) 50%, transparent 70%)',
          opacity: glowOpacity,
        }}
      />

      {/* ── LAYER 1: Dual-Layer Yamato-e Backlit Mountain Ridges ── */}
      <div className="absolute inset-x-0 bottom-0 h-[480px] pointer-events-none opacity-80">
        <svg
          viewBox="0 0 1440 480"
          className="w-full h-full object-cover preserve-3d"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle noise grain filter */}
          <defs>
            <linearGradient id="ridge-back-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--chrono-accent, #f59e0b)" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#080a14" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--canvas-ground, #06080d)" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="ridge-front-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0e1322" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--canvas-ground, #06080d)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Sun / Moon Celestial Disc */}
          <circle
            cx={`${sunXPercent}%`}
            cy={`${sunYPercent}%`}
            r={isNight ? 18 : 28}
            className="transition-all duration-700 ease-out"
            fill={isNight ? '#e2e8f0' : 'var(--chrono-accent, #f59e0b)'}
            opacity={isNight ? 0.85 : 0.9}
            style={{
              filter: isNight
                ? 'drop-shadow(0 0 18px rgba(226, 232, 240, 0.7))'
                : 'drop-shadow(0 0 28px var(--chrono-accent, #f59e0b))',
            }}
          />

          {/* Distant Mountain Ridge (Backlit by Sun/Moon) */}
          <path
            d="M0 260 C240 210 380 280 540 220 C720 150 900 240 1080 180 C1240 230 1360 200 1440 220 L1440 480 L0 480 Z"
            fill="url(#ridge-back-grad)"
            className="transition-all duration-700"
          />

          {/* Near Mountain Ridge (Sharp Foreground Contrast) */}
          <path
            d="M0 340 C180 300 320 360 480 310 C680 250 820 340 1000 280 C1180 320 1340 290 1440 310 L1440 480 L0 480 Z"
            fill="url(#ridge-front-grad)"
            className="transition-all duration-700"
          />
        </svg>
      </div>

      {/* ── LAYER 2: Micro-Particulate Canvas Engine ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
      />

      {/* ── LAYER 3: Progressive Atmospheric Blur Mask ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[380px] pointer-events-none backdrop-blur-[10px]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 60%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 60%, black 100%)',
        }}
      />

      {/* Subtle Hairline Horizon Rule */}
      <div
        className="absolute inset-x-0 bottom-[220px] h-[1px] opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent, var(--chrono-accent, #f59e0b), transparent)',
        }}
      />
    </div>
  );
}

export default CircadianSkybox;
