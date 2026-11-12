import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { correlationService } from '../../../services/correlationService';
import type { CorrelationResult } from '../../../types';
import { cn } from '../../../lib/utils';

export function HabitMoodCorrelationMatrix() {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mood' | 'day' | 'habit'>('all');

  useEffect(() => {
    let mounted = true;
    correlationService.getAllCorrelations()
      .then(res => {
        if (mounted) {
          setCorrelations(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load correlations:', err);
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const filtered = correlations.filter(c => {
    if (activeFilter === 'all') return true;
    return c.factorBType === activeFilter;
  });

  const getCorrelationBadge = (r: number) => {
    if (r >= 0.5) {
      return {
        label: 'Strong Catalyst',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        icon: TrendingUp,
      };
    }
    if (r > 0) {
      return {
        label: 'Positive Boost',
        color: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/30',
        icon: TrendingUp,
      };
    }
    if (r <= -0.5) {
      return {
        label: 'Strong Inhibitor',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        icon: TrendingDown,
      };
    }
    return {
      label: 'Slight Friction',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: TrendingDown,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header with filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]/25 flex items-center justify-center text-[var(--accent-ink)]">
            <Brain size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--tx-primary)] flex items-center gap-2">
              Behavioral Pearson Correlation Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25">
                In-Browser r-calc
              </span>
            </h3>
            <p className="text-xs text-[var(--tx-secondary)]">
              Statistical relationships between daily habit execution, mood valence, and day of week.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-[var(--sf-raised)] p-1 rounded-lg border border-[var(--border-default)] self-start sm:self-auto">
          {([
            { id: 'all', label: 'All Patterns' },
            { id: 'mood', label: 'Mood' },
            { id: 'day', label: 'Day of Week' },
            { id: 'habit', label: 'Habit Pairs' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer',
                activeFilter === f.id
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-semibold'
                  : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[var(--tx-muted)]">Computing correlation vectors...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-raised p-8 rounded-xl text-center space-y-2">
          <Activity size={24} className="mx-auto text-[var(--tx-muted)] mb-2" />
          <h4 className="text-sm font-medium text-[var(--tx-primary)]">Insufficient Local Variance Data</h4>
          <p className="text-xs text-[var(--tx-secondary)] max-w-md mx-auto">
            Log at least 5 days of habits and mood ratings to activate the Pearson mathematical correlation engine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item, idx) => {
            const badge = getCorrelationBadge(item.correlation);
            const IconComponent = badge.icon;

            return (
              <div
                key={`${item.habitA}-${item.factorB}-${idx}`}
                className="card-raised p-4 rounded-xl hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--tx-primary)] truncate max-w-[140px] sm:max-w-[180px]">
                        {item.habitAName}
                      </span>
                      <ArrowRight size={12} className="text-[var(--tx-muted)] flex-shrink-0" />
                      <span className="text-xs font-mono text-[var(--accent-ink)] truncate max-w-[120px]">
                        {item.factorB}
                      </span>
                    </div>

                    {/* Correlation coefficient chip */}
                    <div className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1 flex-shrink-0',
                      badge.bg,
                      badge.color,
                      badge.border
                    )}>
                      <IconComponent size={11} />
                      {item.correlation > 0 ? `+${item.correlation.toFixed(2)}` : item.correlation.toFixed(2)}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--tx-secondary)] leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--tx-muted)] pt-2 border-t border-[var(--border-default)]">
                  <span className="flex items-center gap-1 text-[var(--tx-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    {badge.label}
                  </span>
                  <span>n = {item.sampleSize} days sampled</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
