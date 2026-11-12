import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { aiCoachService } from '../../services/aiCoachService';
import type { AIInsight } from '../../types';

export const TOOLTIP_STYLE = {
  background: 'rgba(15,23,42,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '16px',
  color: '#dae2fd',
  fontSize: '13px',
  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
  padding: '12px 16px',
};

export const TOOLTIP_LABEL_STYLE = {
  color: '#f8fafc',
  fontWeight: 800,
  marginBottom: '6px',
  fontSize: '14px',
};

export const TOOLTIP_ITEM_STYLE = {
  color: '#dae2fd',
  fontWeight: 600,
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="h-full w-full block">
      <div className="rounded-xl p-5 text-center relative overflow-hidden h-full border border-white/10 bg-neutral-900/60">
        <span className="absolute right-3 bottom-3 text-5xl opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none">
          {icon}
        </span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider opacity-60">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-6 relative overflow-hidden border border-white/10 bg-neutral-900/60">
      <div className="mb-5">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs font-medium text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function EmptyChart({
  message = 'Not enough data yet.',
  sub = 'Keep logging your habits to unlock insights.',
}: {
  message?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 text-center">
      <span className="text-4xl mb-3 select-none">📊</span>
      <p className="text-sm font-semibold text-slate-300">{message}</p>
      <p className="text-xs mt-1 text-slate-500">{sub}</p>
    </div>
  );
}

export function DynamicInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiCoachService
      .getCoachInsights()
      .then(res => {
        setInsights(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load AI insights:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-center border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-center border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl animate-pulse">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1">
              Smart Insights
            </h4>
            <p className="text-sm dark:text-slate-300 text-slate-600 font-medium leading-relaxed">
              Every day is a new opportunity. Start building your habits to generate insights!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-raised rounded-2xl p-6 md:p-8 relative overflow-hidden h-full">
      <div className="relative z-10 flex flex-col h-full justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20">
            <span className="text-sm">✨</span>
            <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-[spin_3s_linear_infinite]" />
          </div>
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">
            HabitFlow Smart Analysis
          </h4>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5, ease: 'easeOut' }}
              className="flex gap-3 items-start bg-white/5 dark:bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/5 shadow-sm"
            >
              <span className="text-xl mt-0.5 select-none">{insight.icon}</span>
              <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {insight.title}
                </h5>
                <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {insight.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
