import React from 'react';
import { motion } from 'framer-motion';

interface MomentumWaveVisualizerProps {
  score: number; // 0 to 100
  completionRate?: number; // 0 to 1
  className?: string;
}

export const MomentumWaveVisualizer: React.FC<MomentumWaveVisualizerProps> = ({
  score,
  completionRate = 0,
  className = '',
}) => {
  // Color palette shifts smoothly with velocity
  const isHighVelocity = score >= 75;
  const isMidVelocity = score >= 40 && score < 75;

  const primaryGlow = isHighVelocity
    ? 'rgba(16, 185, 129, 0.45)'
    : isMidVelocity
    ? 'rgba(6, 182, 212, 0.35)'
    : 'rgba(99, 102, 241, 0.25)';

  const strokeColor = isHighVelocity
    ? '#34d399'
    : isMidVelocity
    ? '#22d3ee'
    : '#818cf8';

  return (
    <div
      className={`relative w-full h-16 sm:h-20 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/[0.08] bg-[#090c14]/80 flex items-center justify-between px-5 ${className}`}
    >
      {/* Background ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 120%, ${primaryGlow} 0%, transparent 70%)`,
        }}
      />

      {/* SVG Animated Physics Wave */}
      <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden pointer-events-none opacity-60">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full transform-gpu"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="waveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background Secondary Wave */}
          <motion.path
            d="M0,60 C300,90 450,20 600,60 C750,100 900,30 1200,60 L1200,120 L0,120 Z"
            fill="url(#waveGradient)"
            animate={{
              d: [
                'M0,60 C300,90 450,20 600,60 C750,100 900,30 1200,60 L1200,120 L0,120 Z',
                'M0,50 C300,20 450,90 600,50 C750,30 900,100 1200,50 L1200,120 L0,120 Z',
                'M0,60 C300,90 450,20 600,60 C750,100 900,30 1200,60 L1200,120 L0,120 Z',
              ],
            }}
            transition={{
              duration: isHighVelocity ? 6 : 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Primary Crisp Specular Wave Stroke */}
          <motion.path
            d="M0,55 Q300,10 600,55 T1200,55"
            fill="none"
            stroke="url(#waveStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{
              d: [
                'M0,55 Q300,10 600,55 T1200,55',
                'M0,45 Q300,85 600,45 T1200,45',
                'M0,55 Q300,10 600,55 T1200,55',
              ],
            }}
            transition={{
              duration: isHighVelocity ? 4 : 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* Left Telemetry: Wave status */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: strokeColor }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3 shadow-[0_0_8px]"
              style={{ backgroundColor: strokeColor, boxShadow: `0 0 10px ${strokeColor}` }}
            />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              Kinetic Flow Field
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${strokeColor}15`,
                borderColor: `${strokeColor}40`,
                color: strokeColor,
              }}
            >
              {isHighVelocity ? 'Peak Orbit' : isMidVelocity ? 'Steady Resonance' : 'Priming Inertia'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {isHighVelocity
              ? 'Hyper-momentum reached. Friction minimized.'
              : isMidVelocity
              ? 'Momentum wave resonant. Keep stacking rituals.'
              : 'Complete your first ritual to accelerate velocity.'}
          </p>
        </div>
      </div>

      {/* Right Telemetry: Real-time kinetic index */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
            Velocity Vector
          </span>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {score}
            </span>
            <span className="text-xs font-mono text-emerald-400">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentumWaveVisualizer;
