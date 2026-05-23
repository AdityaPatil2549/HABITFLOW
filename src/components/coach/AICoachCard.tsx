import { useState, useEffect } from 'react';
import { aiCoachService } from '@/services/aiCoachService';
import type { AIInsight } from '@/types';
import { Sparkles, Brain, TrendingUp, AlertTriangle, ChevronRight, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, typeof Sparkles> = {
  '📊': Brain,
  '☀️': Lightbulb,
  '🌅': Lightbulb,
  '⚡': TrendingUp,
  '🎯': TrendingUp,
  '💫': Sparkles,
  '✨': Sparkles,
  '🌙': Sparkles,
  '📉': AlertTriangle,
  '📈': TrendingUp,
  '🔄': AlertTriangle,
};

export function AICoachCard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    aiCoachService.getCoachInsights().then(data => {
      setInsights(data);
      setLoading(false);
    }).catch((err) => { console.error('AICoachError:', err); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent border border-purple-500/20 p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Coach</h3>
            <p className="text-xs text-slate-400">Analyzing your habits...</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 rounded-full bg-white/5 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-white/5 animate-pulse w-3/4" />
          <div className="h-3 rounded-full bg-white/5 animate-pulse w-5/6" />
        </div>
      </motion.div>
    );
  }

  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent border border-purple-500/20 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Coach</h3>
            <p className="text-xs text-slate-400">Complete a few habits to unlock personalized insights!</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const current = insights[activeIdx % insights.length];
  const IconComp = ICON_MAP[current.icon] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent border border-purple-500/20"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/5 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Coach</h3>
              <p className="text-[10px] text-purple-400/60 uppercase tracking-wider font-semibold">Personalized for you</p>
            </div>
          </div>
          {insights.length > 1 && (
            <div className="flex gap-1">
              {insights.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeIdx % insights.length ? 'bg-purple-400 w-4' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Insight content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <IconComp size={16} className="text-purple-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white mb-1">{current.title}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{current.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {insights.length > 1 && (
          <button
            onClick={() => setActiveIdx(prev => (prev + 1) % insights.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
