import React, { forwardRef } from 'react';
import type { UserXP } from '../../types';
import { Award, Flame, CheckCircle2, TrendingUp, Star } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon: 'flame' | 'check' | 'trending' | 'award';
}

interface ShareCardProps {
  title: string;
  subtitle: string;
  stats: Stat[];
  userXP: UserXP;
  userName: string;
  userAvatar?: string | null;
  theme: string;
}

const ICON_MAP = {
  flame: <Flame size={48} className="text-orange-400" />,
  check: <CheckCircle2 size={48} className="text-emerald-400" />,
  trending: <TrendingUp size={48} className="text-indigo-400" />,
  award: <Award size={48} className="text-amber-400" />,
};

// Fixed 1080x1080 aspect ratio for social media sharing
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ title, subtitle, stats, userXP, userName, userAvatar, theme }, ref) => {
    return (
      <div
        ref={ref}
        data-theme={theme}
        className="w-[1080px] h-[1080px] p-16 flex flex-col justify-between overflow-hidden relative bg-[#0B0B0E] text-[#FAFAFC]"
        style={{
          fontFamily: "'Geist Variable', 'Geist', sans-serif",
        }}
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#24242C] pb-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center font-mono font-bold text-3xl">
              HF
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-[#FAFAFC]">HabitFlow</h1>
          </div>

          <div className="flex items-center gap-6 bg-[#141418] border border-[#24242C] px-6 py-4 rounded-2xl">
            <div className="text-right">
              <p className="text-3xl font-bold text-[#FAFAFC]">{userName}</p>
              <p className="text-xl text-[var(--accent)] font-mono font-semibold flex items-center gap-2 justify-end mt-1">
                <Star size={20} /> Level {Math.floor(userXP.total / 100) + 1} · {userXP.level}
              </p>
            </div>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="avatar"
                className="w-24 h-24 rounded-xl object-cover border border-[#24242C]"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-4xl font-bold font-mono">
                {userName[0]?.toUpperCase() ?? 'H'}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
            {subtitle}
          </p>
          <h2 className="text-[5rem] font-bold tracking-tight text-[#FAFAFC] leading-[1.08] mb-16">{title}</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-[#141418] border border-[#24242C] rounded-3xl p-10 flex flex-col items-center gap-4 relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#1C1C22] border border-[#2C2C36] flex items-center justify-center mb-2">
                  {ICON_MAP[stat.icon]}
                </div>
                <p className="text-[5rem] leading-none font-bold font-mono tabular-nums text-[#FAFAFC] tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xl font-mono font-semibold text-[#9E9EA9] uppercase tracking-widest mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center text-xl font-mono text-[#6E6E78] tracking-wider border-t border-[#24242C] pt-8">
          Build your best self · <span className="text-[#FAFAFC]">habitflow.app</span>
        </div>
      </div>
    );
  }
);
