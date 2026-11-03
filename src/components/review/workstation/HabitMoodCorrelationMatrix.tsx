import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, TrendingDown, ArrowRight, Activity, Calendar } from 'lucide-react';
import { correlationService } from '../../../services/correlationService';
import type { CorrelationResult } from '../../../types';
import { SpotlightCard } from '../../ui/motion/SpotlightCard';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Brain size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Behavioral Pearson Correlation Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                In-Browser r-calc
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Statistical relationships between daily habit execution, mood valence, and day of week.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-[#13151f] p-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Patterns' },
            { id: 'mood', label: 'Mood' },
            { id: 'day', label: 'Day of Week' },
            { id: 'habit', label: 'Habit Pairs' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono rounded-md transition-all',
                activeFilter === f.id
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
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
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500">Computing correlation vectors...</span>
        </div>
      ) : filtered.length === 0 ? (
        <SpotlightCard className="p-8 rounded-xl bg-[#0e1017]/60 border border-white/[0.06] text-center space-y-2">
          <Activity size={24} className="mx-auto text-slate-600 mb-2" />
          <h4 className="text-sm font-medium text-slate-300">Insufficient Local Variance Data</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Log at least 5 days of habits and mood ratings to activate the Pearson mathematical correlation engine.
          </p>
        </SpotlightCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item, idx) => {
            const badge = getCorrelationBadge(item.correlation);
            const IconComponent = badge.icon;
            const isDay = item.factorBType === 'day';
            const isMood = item.factorBType === 'mood';

            return (
              <SpotlightCard
                key={`${item.habitA}-${item.factorB}-${idx}`}
                className="p-4 rounded-xl bg-[#0e1017]/80 border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                        {item.habitAName}
                      </span>
                      <ArrowRight size={12} className="text-slate-500 flex-shrink-0" />
                      <span className="text-xs font-mono text-purple-300 truncate max-w-[120px]">
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

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/[0.04]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {badge.label}
                  </span>
                  <span>n = {item.sampleSize} days sampled</span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
