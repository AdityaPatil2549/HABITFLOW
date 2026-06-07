import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, CheckCircle2, ArrowRight, Zap, GripHorizontal } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { habitService } from '../../services/habitService';
import { format } from 'date-fns';
import { IconRenderer } from '../common/IconRenderer';
import { NLPQuickAdd } from '../habits/NLPQuickAdd';
import { useCompletionEffects } from '../ui/CompletionEffects';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { AnimatedCheckmark } from '../ui/AnimatedCheckmark';

export function HabitsWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const navigate = useNavigate();
  const { habits, logHabit, unlogHabit, loading } = useHabitStore();
  const { fireConfetti } = useCompletionEffects();
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const logDebounceRef = useRef<Set<string>>(new Set());

  const today = format(new Date(), 'yyyy-MM-dd');
  const scheduled = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, today));

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div data-tour="habits-widget" className="w-full relative group widget-container">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <TiltCard borderGlow className="w-full h-full">
        <SpotlightCard variants={item} className="h-full rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Active Habits
            </h2>
            <div className="flex items-center gap-2 mr-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSmartAdd(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
              >
                <Zap size={12} />
                Smart Add
              </motion.button>
              <button
                onClick={() => navigate('/habits')}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest"
              >
                Manage
              </button>
            </div>
          </div>

          {showSmartAdd && document.body && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <NLPQuickAdd
                onClose={() => setShowSmartAdd(false)}
                onHabitCreated={() => setShowSmartAdd(false)}
              />
            </div>,
            document.body
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : scheduled.length === 0 ? (
            <EmptyState 
              icon={Flame} 
              title="No habits today" 
              description="Add your first habit to start building streaks." 
              actionLabel="Add a habit" 
              onAction={() => navigate('/habits')} 
              className="my-4"
            />
          ) : (
            <Reorder.Group axis="y" values={scheduled.slice(0, 6)} onReorder={() => {}} className="space-y-2">
              {scheduled.slice(0, 6).map((h, i, arr) => {
                const isDone = h.todayLog && h.todayLog.value >= 1;
                return (
                  <Reorder.Item
                    key={h.id}
                    value={h}
                    className="relative"
                  >
                    <div
                      onClick={() => {
                        if (logDebounceRef.current.has(h.id)) return;
                        logDebounceRef.current.add(h.id);
                        const action = isDone ? unlogHabit(h.id) : logHabit(h.id, 1);
                        if (!isDone) fireConfetti();
                        Promise.resolve(action).finally(() => logDebounceRef.current.delete(h.id));
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group/habit flex items-center gap-3 ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 hover:bg-brand-500/5'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active/habit:scale-90 ${isDone ? 'bg-emerald-500/20' : 'bg-white/5'}`}
                      >
                        <IconRenderer
                          name={h.icon}
                          size={18}
                          color={isDone ? '#10b981' : 'var(--brand-400)'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${isDone ? 'text-emerald-400' : 'text-white'}`}
                        >
                          {h.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 relative">
                          {h.streak.current >= 7 && (
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute -left-1 -top-1 w-4 h-4 bg-orange-500/20 rounded-full blur-sm"
                            />
                          )}
                          <Flame
                            size={10}
                            className={
                              h.streak.current >= 7
                                ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                                : h.streak.current > 0
                                  ? 'text-orange-500/80'
                                  : 'text-slate-600'
                            }
                          />
                          <span className={`text-[10px] font-bold ${h.streak.current >= 7 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {h.streak.current}d streak
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}
                      >
                        {isDone && <AnimatedCheckmark size={18} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
          {scheduled.length > 6 && (
            <button
              onClick={() => navigate('/habits')}
              className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest pt-3 transition-colors"
            >
              + {scheduled.length - 6} more habits
            </button>
          )}
        </SpotlightCard>
      </TiltCard>
    </div>
  );
}
