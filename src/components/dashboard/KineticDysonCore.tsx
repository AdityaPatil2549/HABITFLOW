import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useChronoStore } from '../../store/chronoStore';
import { SlidingNumber } from '../ui/motion/SlidingNumber';
import { Flame, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KineticDysonCoreProps {
  score: number; // 0 to 100
  completionRate: number; // 0 to 1
  completedCount: number;
  totalHabits: number;
  maxStreak: number;
}

export function KineticDysonCore({
  score,
  completionRate,
  completedCount,
  totalHabits,
  maxStreak,
}: KineticDysonCoreProps) {
  const { currentEpoch, activeWorld } = useChronoStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Kinetic state tier
  const isSupercritical = score >= 75;
  const isResonant = score >= 25 && score < 75;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0, active: false });
  };

  // Rotation angles driven by score
  const speedMultiplier = Math.max(0.4, score / 50);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-3xl p-6 sm:p-8 card-horlogerie overflow-hidden select-none group perspective-[1000px]"
      style={{
        boxShadow: isSupercritical
          ? '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px var(--chrono-glow, rgba(245, 158, 11, 0.25))'
          : '0 20px 48px rgba(0, 0, 0, 0.55)',
      }}
    >
      {/* Background Solar Radial Corona */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[90px] pointer-events-none transition-all duration-700"
        style={{
          background: isSupercritical
            ? 'radial-gradient(circle, var(--chrono-accent, #f59e0b) 0%, var(--chrono-secondary, #ffbf24) 40%, transparent 70%)'
            : isResonant
            ? 'radial-gradient(circle, var(--chrono-glow, rgba(245, 158, 11, 0.25)) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
          opacity: isSupercritical ? 0.35 : 0.2,
          transform: `translate(-50%, -50%) translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 0)`,
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Telemetry Overview */}
        <div className="space-y-3 text-center lg:text-left max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border transition-all"
            style={{
              backgroundColor: isSupercritical
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              borderColor: isSupercritical
                ? 'var(--chrono-accent, #f59e0b)'
                : 'rgba(255, 255, 255, 0.1)',
              color: isSupercritical
                ? 'var(--chrono-accent, #f59e0b)'
                : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                isSupercritical
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'bg-emerald-400'
              )}
            />
            <span>
              {isSupercritical
                ? 'Supercritical Ignition'
                : isResonant
                ? 'Harmonic Resonance'
                : 'Dormant Kinetic Ring'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kinetic Momentum Core
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Real-time orbital telemetry driven by habit execution half-life. The Dyson Sphere accelerates as daily rituals lock into alignment.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="text-slate-400">Velocity:</span>
              <span className="text-white font-bold text-sm">
                <SlidingNumber value={score} />
                <span className="text-[10px] text-slate-500 font-normal">/100</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Streak:</span>
              <span className="text-amber-300 font-bold text-sm">
                <SlidingNumber value={maxStreak} />d
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="text-slate-400">Rituals:</span>
              <span className="text-emerald-400 font-bold text-sm">
                {completedCount}/{totalHabits}
              </span>
            </div>
          </div>
        </div>

        {/* Right: The 3D Orbital Dyson Sphere Sculpture */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 280 280"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: `rotateX(${mousePos.y * 12}deg) rotateY(${mousePos.x * -12}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            <defs>
              <linearGradient id="core-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--chrono-accent, #f59e0b)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--chrono-secondary, #ffbf24)" stopOpacity="0.2" />
              </linearGradient>

              <filter id="core-bloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Orbit 1: Outer Celestial Ring */}
            <g
              style={{
                transformOrigin: '140px 140px',
                animation: `spin ${30 / speedMultiplier}s linear infinite`,
              }}
            >
              <ellipse
                cx="140"
                cy="140"
                rx="120"
                ry="46"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                transform="rotate(-25 140 140)"
              />
              <circle
                cx="260"
                cy="140"
                r="3"
                fill="var(--chrono-accent, #f59e0b)"
                filter="url(#core-bloom)"
                transform="rotate(-25 140 140)"
              />
            </g>

            {/* Orbit 2: Intermediate Gyroscopic Ring */}
            <g
              style={{
                transformOrigin: '140px 140px',
                animation: `spin ${20 / speedMultiplier}s linear infinite reverse`,
              }}
            >
              <ellipse
                cx="140"
                cy="140"
                rx="96"
                ry="38"
                stroke={isSupercritical ? 'var(--chrono-accent, #f59e0b)' : 'rgba(255, 255, 255, 0.18)'}
                strokeWidth={isSupercritical ? '1.8' : '1.2'}
                strokeDasharray={isSupercritical ? '12 4' : '6 6'}
                transform="rotate(35 140 140)"
              />
              <circle
                cx="236"
                cy="140"
                r="4"
                fill="var(--chrono-secondary, #ffbf24)"
                filter="url(#core-bloom)"
                transform="rotate(35 140 140)"
              />
            </g>

            {/* Orbit 3: Inner High-Velocity Plasma Ring */}
            <g
              style={{
                transformOrigin: '140px 140px',
                animation: `spin ${10 / speedMultiplier}s linear infinite`,
              }}
            >
              <ellipse
                cx="140"
                cy="140"
                rx="72"
                ry="28"
                stroke="var(--chrono-accent, #f59e0b)"
                strokeWidth="2"
                filter="url(#core-bloom)"
                transform="rotate(-65 140 140)"
              />
            </g>

            {/* Central Living Dyson Star / Core Orb */}
            <circle
              cx="140"
              cy="140"
              r={isSupercritical ? 38 : isResonant ? 32 : 26}
              fill="url(#core-glow-grad)"
              className="transition-all duration-500 ease-out"
              style={{
                filter: isSupercritical
                  ? 'drop-shadow(0 0 24px var(--chrono-accent, #f59e0b))'
                  : 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))',
              }}
            />

            {/* Core Micro-Corona Lines */}
            {isSupercritical && (
              <g
                style={{
                  transformOrigin: '140px 140px',
                  animation: 'spin 6s linear infinite',
                }}
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <line
                    key={angle}
                    x1="140"
                    y1="96"
                    x2="140"
                    y2="88"
                    stroke="var(--chrono-accent, #f59e0b)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${angle} 140 140)`}
                    filter="url(#core-bloom)"
                  />
                ))}
              </g>
            )}
          </svg>

          {/* Central Telemetry Value Embedded in Orb */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 tracking-tighter drop-shadow-sm">
              <SlidingNumber value={score} />
            </span>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-900/80">
              Velocity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KineticDysonCore;
