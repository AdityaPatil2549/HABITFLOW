import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Flame, Target, Zap, TrendingUp, Trophy } from 'lucide-react';
import { SpotlightCard } from '../../ui/motion/SpotlightCard';
import { SlidingNumber } from '../../ui/motion/SlidingNumber';
import { cn } from '../../../lib/utils';

interface ReviewSummaryProps {
  score: number;
  weekLabel: string;
  tasksCompleted: number;
  habitsCompleted: number;
  bestStreak: number;
  weeklyXp: number;
  headline: string;
  quote: string;
}

export function ReviewSummaryCard({
  score,
  weekLabel,
  tasksCompleted,
  habitsCompleted,
  bestStreak,
  weeklyXp,
  headline,
  quote,
}: ReviewSummaryProps) {
  // Score color tiers
  const getScoreColor = (s: number) => {
    if (s >= 80) return { fg: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.25)', glow: 'rgba(52, 211, 153, 0.2)' };
    if (s >= 60) return { fg: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.25)', glow: 'rgba(96, 165, 250, 0.2)' };
    if (s >= 40) return { fg: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.25)', glow: 'rgba(251, 191, 36, 0.2)' };
    return { fg: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.25)', glow: 'rgba(248, 113, 113, 0.2)' };
  };

  const colors = getScoreColor(score);
  const R = 64;
  const C = 2 * Math.PI * R;
  const strokeDashoffset = C - (Math.min(100, Math.max(0, score)) / 100) * C;

  return (
    <div className="space-y-6">
      {/* Top Banner & Radial Metric */}
      <SpotlightCard className="p-6 sm:p-8 rounded-2xl bg-[#0e1017]/90 border border-white/[0.06] backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Week context & motivational synthesis */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest text-slate-400 bg-white/[0.04] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {weekLabel}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {headline}
            </h2>
            <p className="text-sm text-slate-400 italic max-w-xl">
              "{quote}"
            </p>
          </div>

          {/* Right: SVG Circular Velocity Arc */}
          <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
            {/* Ambient Radial Glow */}
            <div
              className="absolute inset-2 rounded-full blur-2xl opacity-25 pointer-events-none transition-colors duration-700"
              style={{ background: colors.fg }}
            />
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={R}
                className="stroke-white/[0.06]"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress Arc */}
              <motion.circle
                cx="80"
                cy="80"
                r={R}
                stroke={colors.fg}
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                style={{ strokeDasharray: C }}
              />
            </svg>

            {/* Inner tabular velocity metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-baseline font-mono font-black text-3xl tracking-tight text-white">
                <SlidingNumber value={score} />
                <span className="text-sm font-sans font-bold text-slate-400 ml-0.5">%</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Score
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* KPI Quad Grid (Taste-Skill: Type-Forward, Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Habits Completed */}
        <SpotlightCard className="p-4 sm:p-5 rounded-xl bg-[#0e1017]/70 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Habits Done</span>
            <Target size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            <SlidingNumber value={habitsCompleted} />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">This 7-day cycle</p>
        </SpotlightCard>

        {/* Tasks Completed */}
        <SpotlightCard className="p-4 sm:p-5 rounded-xl bg-[#0e1017]/70 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Tasks Closed</span>
            <CheckCircle2 size={15} className="text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            <SlidingNumber value={tasksCompleted} />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Direct task throughput</p>
        </SpotlightCard>

        {/* Peak Streak */}
        <SpotlightCard className="p-4 sm:p-5 rounded-xl bg-[#0e1017]/70 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Top Streak</span>
            <Flame size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-baseline gap-1">
            <SlidingNumber value={bestStreak} />
            <span className="text-xs font-sans text-amber-400/80 font-semibold">days</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Consecutive discipline</p>
        </SpotlightCard>

        {/* Weekly XP */}
        <SpotlightCard className="p-4 sm:p-5 rounded-xl bg-[#0e1017]/70 border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Weekly XP</span>
            <Zap size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-baseline gap-0.5">
            <span className="text-purple-400 text-lg">+</span>
            <SlidingNumber value={weeklyXp} />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Gamification score</p>
        </SpotlightCard>
      </div>
    </div>
  );
}
