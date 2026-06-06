import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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

export function HabitsWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const navigate = useNavigate();
  const { habits, logHabit, unlogHabit } = useHabitStore();
  const { fireConfetti } = useCompletionEffects();
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const logDebounceRef = useRef<Set<string>>(new Set());

  const today = format(new Date(), 'yyyy-MM-dd');
  const scheduled = habits.filter(h => !h.archived && habitService.isScheduledForDate(h, today));

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="w-full relative group widget-container">
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

          {showSmartAdd && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <NLPQuickAdd
                onClose={() => setShowSmartAdd(false)}
                onHabitCreated={() => setShowSmartAdd(false)}
              />
            </div>
          )}

          {scheduled.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Flame size={22} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No habits today</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add your first habit to start building streaks.
                </p>
              </div>
              <button
                onClick={() => navigate('/habits')}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 mt-1"
              >
                Add a habit <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheduled.slice(0, 6).map((h, i, arr) => {
                const isDone = h.todayLog && h.todayLog.value >= 1;
                const isLastOdd = arr.length % 2 !== 0 && i === arr.length - 1;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      if (logDebounceRef.current.has(h.id)) return;
                      logDebounceRef.current.add(h.id);
                      const action = isDone ? unlogHabit(h.id) : logHabit(h.id, 1);
                      if (!isDone) fireConfetti();
                      Promise.resolve(action).finally(() => logDebounceRef.current.delete(h.id));
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group/habit flex items-center gap-3 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 hover:bg-brand-500/5'
                    } ${isLastOdd ? 'sm:col-span-2' : ''}`}
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame
                          size={9}
                          className={h.streak.current > 0 ? 'text-orange-500' : 'text-slate-600'}
                        />
                        <span className="text-[10px] font-bold text-slate-500">
                          {h.streak.current}d streak
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}
                    >
                      {isDone && <CheckCircle2 size={11} />}
                    </div>
                  </div>
                );
              })}
            </div>
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
