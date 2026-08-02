import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, GripHorizontal } from 'lucide-react';
import { aiCoachService } from '../../services/aiCoachService';
import { TiltCard } from '../ui/TiltCard';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TextEffect } from '../ui/text-effect';
import type { AIInsight } from '../../types';
import { db } from '../../db';

export function AICoachWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    aiCoachService.getCoachInsights().then(res => {
      // Filter out read insights or just show the top unread ones
      const unread = res.filter(i => !i.read);
      setInsights(unread.length > 0 ? unread : res.slice(0, 3));
      setLoading(false);
    });
  }, []);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insights.length === 0) return;
    const current = insights[currentIndex];
    
    // Mark as read in DB
    await db.ai_insights.update(current.id, { read: true });
    
    // Remove from local state
    const newInsights = [...insights];
    newInsights.splice(currentIndex, 1);
    setInsights(newInsights);
    
    if (currentIndex >= newInsights.length) {
      setCurrentIndex(Math.max(0, newInsights.length - 1));
    }
  };

  const nextInsight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % insights.length);
  };

  if (loading) {
    return (
      <TiltCard borderGlow className="w-full h-full min-h-[160px]">
        <SpotlightCard className="h-full rounded-[2.5rem] p-6 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border-2 border-brand-500/50 border-t-brand-500 animate-spin" />
        </SpotlightCard>
      </TiltCard>
    );
  }

  if (insights.length === 0) {
    return null; // Don't render the widget if there are no insights
  }

  const currentInsight = insights[currentIndex];

  return (
    <div data-tour="ai-coach-widget" className="w-full h-full relative group widget-container">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-4 right-4 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <TiltCard borderGlow className="w-full h-full">
        <SpotlightCard className="h-full rounded-[2.5rem] p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                <Sparkles size={16} className="text-brand-400" />
              </div>
              <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest">
                AI Coach
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {insights.length > 1 && (
                <span className="text-[10px] font-bold text-slate-500">
                  {currentIndex + 1} of {insights.length}
                </span>
              )}
              <button
                onClick={handleDismiss}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative z-10 min-h-[80px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentInsight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{currentInsight.icon}</span>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">{currentInsight.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      <TextEffect as="span" per="word" preset="blur">{currentInsight.body}</TextEffect>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {insights.length > 1 && (
            <div className="mt-4 flex justify-end relative z-10">
              <button
                onClick={nextInsight}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg"
              >
                Next Insight <ArrowRight size={14} />
              </button>
            </div>
          )}
        </SpotlightCard>
      </TiltCard>
    </div>
  );
}
