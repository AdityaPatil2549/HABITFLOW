import React from 'react';

interface HabitFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function HabitFlowLogo({
  className = '',
  size = 'md',
  showBadge = true,
}: HabitFlowLogoProps) {
  const iconSizes = {
    sm: { w: 24, h: 24, fontSize: 'text-base', badgeSize: 'text-[8px]' },
    md: { w: 32, h: 32, fontSize: 'text-xl', badgeSize: 'text-[9px]' },
    lg: { w: 42, h: 42, fontSize: 'text-2xl', badgeSize: 'text-[10px]' },
  };

  const current = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* ── Vector Iconic Kinetic Wave Mark ── */}
      <div className="relative flex-shrink-0">
        {/* Ambient Specular Neon Aura */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/40 via-blue-500/30 to-teal-400/20 blur-md opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none"
        />

        <svg
          width={current.w}
          height={current.h}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="hf-pillar-left" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#00A3FF" />
            </linearGradient>
            <linearGradient id="hf-pillar-right" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
            <linearGradient id="hf-wave-intertwined" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
          </defs>

          {/* Left Vertical Pillar */}
          <rect x="18" y="20" width="14" height="60" rx="7" fill="url(#hf-pillar-left)" />

          {/* Right Vertical Pillar */}
          <rect x="68" y="20" width="14" height="60" rx="7" fill="url(#hf-pillar-right)" />

          {/* Kinetic Sine Wave Intertwined Bridge */}
          <path
            d="M25 50 C25 32, 42 32, 50 50 C58 68, 75 68, 75 50"
            stroke="url(#hf-wave-intertwined)"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />

          {/* Specular Micro-Bead Light Accent */}
          <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" opacity="0.9" />
        </svg>
      </div>

      {/* ── Typographic Wordmark & Version Pill ── */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`${current.fontSize} font-extrabold tracking-tight font-display flex items-baseline leading-none`}>
          <span className="text-white">Habit</span>
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            Flow
          </span>
        </span>

        {showBadge && (
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 shadow-[0_0_10px_rgba(0,240,255,0.15)] flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`${current.badgeSize} font-mono font-bold uppercase tracking-wider text-cyan-300`}>
              PRO
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HabitFlowLogo;
