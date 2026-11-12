import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Flame, Target, Zap, TrendingUp, Trophy } from 'lucide-react';
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
      <div className="card-raised p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Week context & motivational synthesis */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest text-[var(--tx-muted)] bg-[var(--sf-overlay)] border border-[var(--border-default)]">
              {weekLabel}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tx-primary)] tracking-tight">
              {headline}
            </h2>
            <p className="text-sm text-[var(--tx-secondary)] max-w-xl">
              "{quote}"
            </p>
          </div>

          {/* Right: SVG Circular Velocity Arc */}
          <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={R}
                stroke="var(--border-default)"
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
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{ strokeDasharray: C }}
              />
            </svg>

            {/* Inner tabular velocity metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-baseline font-mono font-bold text-3xl tracking-tight text-[var(--tx-primary)] tabular-nums">
                <span>{score}</span>
                <span className="text-sm font-sans font-semibold text-[var(--tx-muted)] ml-0.5">%</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--tx-muted)]">
                Score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Quad Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Habits Completed */}
        <div className="card-raised p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-[var(--tx-secondary)] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Habits Done</span>
            <Target size={15} />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--tx-primary)] tracking-tight tabular-nums">
            {habitsCompleted}
          </div>
          <p className="text-[11px] text-[var(--tx-muted)] font-mono mt-1">This 7-day cycle</p>
        </div>

        {/* Tasks Completed */}
        <div className="card-raised p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-[var(--tx-secondary)] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Tasks Closed</span>
            <CheckCircle2 size={15} />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--tx-primary)] tracking-tight tabular-nums">
            {tasksCompleted}
          </div>
          <p className="text-[11px] text-[var(--tx-muted)] font-mono mt-1">Direct task throughput</p>
        </div>

        {/* Peak Streak */}
        <div className="card-raised p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-[var(--tx-secondary)] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Top Streak</span>
            <Flame size={15} />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--tx-primary)] tracking-tight flex items-baseline gap-1 tabular-nums">
            <span>{bestStreak}</span>
            <span className="text-xs font-sans text-[var(--tx-muted)] font-semibold">days</span>
          </div>
          <p className="text-[11px] text-[var(--tx-muted)] font-mono mt-1">Consecutive discipline</p>
        </div>

        {/* Weekly XP */}
        <div className="card-raised p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-[var(--tx-secondary)] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Weekly XP</span>
            <Zap size={15} />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--tx-primary)] tracking-tight flex items-baseline gap-0.5 tabular-nums">
            <span className="text-[var(--tx-muted)] text-lg">+</span>
            <span>{weeklyXp}</span>
          </div>
          <p className="text-[11px] text-[var(--tx-muted)] font-mono mt-1">Gamification score</p>
        </div>
      </div>
    </div>
  );
}
