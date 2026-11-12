import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { aiCoachService } from '../../services/aiCoachService';
import type { AIInsight } from '../../types';

export const TOOLTIP_STYLE = {
  background: 'var(--sf-raised)',
  border: '1px solid var(--border-strong)',
  borderRadius: '12px',
  color: 'var(--tx-primary)',
  fontSize: '12px',
  boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.35)',
  padding: '10px 14px',
};

export const TOOLTIP_LABEL_STYLE = {
  color: 'var(--tx-primary)',
  fontWeight: 700,
  marginBottom: '4px',
  fontSize: '13px',
};

export const TOOLTIP_ITEM_STYLE = {
  color: 'var(--tx-secondary)',
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
      <div className="card-raised rounded-xl p-5 text-center relative overflow-hidden h-full">
        <span className="absolute right-3 bottom-3 text-5xl opacity-10 rotate-12 pointer-events-none select-none">
          {icon}
        </span>
        <p className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-[var(--tx-muted)] mb-2">
          {label}
        </p>
        <p className="text-3xl font-black font-mono tabular-nums text-[var(--tx-primary)] tracking-tight mb-1">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] font-bold text-[var(--tx-muted)] uppercase tracking-wider">
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
    <div className="card-raised rounded-xl p-6 relative overflow-hidden">
      <div className="mb-5">
        <h3 className="text-base font-bold text-[var(--tx-primary)] tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs font-medium text-[var(--tx-secondary)] mt-1">{subtitle}</p>
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
    <div className="flex flex-col items-center justify-center py-12 text-[var(--tx-secondary)] text-center">
      <span className="text-4xl mb-3 select-none">📊</span>
      <p className="text-sm font-semibold text-[var(--tx-primary)]">{message}</p>
      <p className="text-xs mt-1 text-[var(--tx-muted)]">{sub}</p>
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
      <div className="card-raised rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-2xl animate-pulse" />
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
      <div className="card-raised rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/25 flex items-center justify-center text-2xl">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-black text-[var(--accent-ink)] uppercase tracking-widest mb-1">
              Smart Insights
            </h4>
            <p className="text-sm text-[var(--tx-secondary)] font-medium leading-relaxed">
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
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/25">
            <span className="text-sm">✨</span>
          </div>
          <h4 className="text-xs font-black font-mono text-[var(--accent-ink)] uppercase tracking-[0.2em]">
            HabitFlow Smart Analysis
          </h4>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="flex gap-3 items-start bg-[var(--sf-overlay)] rounded-xl p-3 border border-[var(--border-default)]"
            >
              <span className="text-xl mt-0.5 select-none">{insight.icon}</span>
              <div>
                <h5 className="text-sm font-bold text-[var(--tx-primary)]">
                  {insight.title}
                </h5>
                <p className="text-[13px] text-[var(--tx-secondary)] font-medium leading-relaxed">
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
