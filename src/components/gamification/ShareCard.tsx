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
        className="w-[1080px] h-[1080px] p-16 flex flex-col justify-between overflow-hidden relative font-display bg-slate-900"
        style={{
          background: 'var(--color-background, #0f172a)',
          color: 'var(--color-on-surface, white)'
        }}
      >
        {/* Background Decorative Blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-400 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-brand-500/30">
              HF
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white">HabitFlow</h1>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl">
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{userName}</p>
              <p className="text-xl text-brand-400 font-semibold flex items-center gap-2 justify-end mt-1">
                <Star size={20} /> Level {Math.floor(userXP.total / 100) + 1} • {userXP.level}
              </p>
            </div>
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                {userName[0]?.toUpperCase() ?? 'H'}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center -mt-10">
          <p className="text-3xl font-bold uppercase tracking-[0.2em] text-brand-400 mb-6">{subtitle}</p>
          <h2 className="text-[5.5rem] font-black text-white leading-[1.1] mb-20">{title}</h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shadow-inner mb-2">
                  {ICON_MAP[stat.icon]}
                </div>
                <p className="text-[5.5rem] leading-none font-black text-white tracking-tight">{stat.value}</p>
                <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center text-2xl font-semibold text-slate-500 tracking-wider pb-4">
          Build your best self at <span className="text-white">habitflow.app</span>
        </div>
      </div>
    );
  }
);
