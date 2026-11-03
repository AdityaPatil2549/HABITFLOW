import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Zap,
  CheckCircle2,
  Sparkles,
  Plus,
  Maximize2,
  Minimize2,
  TrendingUp,
  Target,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useGamificationStore } from '../store/gamificationStore';
import { useModalStore } from '../store/modalStore';
import { momentumEngine, DailyRitualGroup } from '../services/momentumEngine';
import { TactileHabitCard } from '../components/habits/TactileHabitCard';
import { SlidingNumber } from '../components/ui/motion/SlidingNumber';
import type { HabitWithStreak } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { getHabitEmoji } from '../lib/emoji';
import { GlassEmojiCapsule } from '../components/common/GlassEmojiCapsule';

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, loading, loadHabits, logHabit, unlogHabit } = useHabitStore();
  const { loadTasks } = useTaskStore();
  const { userXP, loadXP } = useGamificationStore();
  const { setQuickAddOpen } = useModalStore();

  const [globalMomentum, setGlobalMomentum] = useState<number>(0);
  const [zenMode, setZenMode] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Today — HabitFlow';
    loadHabits();
    loadTasks();
    loadXP();
  }, [loadHabits, loadTasks, loadXP]);

  // Recalculate client-side momentum whenever habits change
  useEffect(() => {
    momentumEngine.calculateGlobalMomentum().then(setGlobalMomentum).catch(console.warn);
  }, [habits]);

  // Set of completed habit IDs for today
  const completedHabitIds = useMemo(() => {
    return new Set(
      habits
        .filter(h => (h.todayLog?.value ?? 0) >= (h.targetValue || 1))
        .map(h => h.id)
    );
  }, [habits]);

  // Group habits by Morning, Afternoon, Evening, Anytime rituals
  const ritualGroups = useMemo(() => {
    return momentumEngine.groupHabitsByRitual(habits, completedHabitIds);
  }, [habits, completedHabitIds]);

  // Daily statistics
  const totalHabits = habits.length;
  const completedCount = completedHabitIds.size;
  const completionPercentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const maxStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.streak?.current || 0), 0);
  }, [habits]);

  // Toggle habit completion handler
  const handleToggleHabit = useCallback(
    async (habit: HabitWithStreak) => {
      const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
      if (isDone) {
        await unlogHabit(habit.id);
      } else {
        await logHabit(habit.id, 1);
      }
    },
    [logHabit, unlogHabit]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setZenMode(prev => !prev);
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (habits[index]) {
          e.preventDefault();
          handleToggleHabit(habits[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [habits, handleToggleHabit]);

  // First incomplete habit for Zen mode
  const nextUpHabit = useMemo(() => {
    return habits.find(h => (h.todayLog?.value ?? 0) < (h.targetValue || 1));
  }, [habits]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-32 space-y-8">
      {/* ── TOP HEADER / MOMENTUM PULSE ──────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] relative">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Today's Ritual</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-sans">{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            Daily Momentum
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            High-velocity habit tracking powered by client-side half-life exponential decay.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setZenMode(prev => !prev)}
            aria-label="Toggle Zen Focus Mode"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-xl border active:scale-95',
              zenMode
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.08]'
            )}
          >
            {zenMode ? <Minimize2 className="w-3.5 h-3.5 text-purple-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>Zen ({zenMode ? 'On' : 'Z'})</span>
          </button>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:shadow-[0_0_32px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* ── High-End Glass KPI Quad ─────────────────────────────── */}
      {!zenMode && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4" aria-label="Momentum statistics">
          {/* 1. Momentum Score */}
          <div className="relative p-5 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">Momentum</span>
              <TrendingUp size={15} className="text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <SlidingNumber value={globalMomentum} />
              <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: `${Math.min(100, Math.max(5, globalMomentum))}%` }}
              />
            </div>
          </div>

          {/* 2. Completion Rate */}
          <div className="relative p-5 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">Today's Rate</span>
              <CheckCircle2 size={15} className="text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <SlidingNumber value={completionPercentage} />
              <span className="text-xs text-blue-400 font-normal">%</span>
            </div>
            <p className="mt-2 text-[11px] font-mono text-slate-400">
              <span className="text-white font-bold">{completedCount}</span> of <span className="text-white font-bold">{totalHabits}</span> rituals checked
            </p>
          </div>

          {/* 3. Top Streak */}
          <div className="relative p-5 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">Peak Streak</span>
              <Flame size={15} className="text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono flex items-baseline gap-1">
              <SlidingNumber value={maxStreak} />
              <span className="text-xs text-amber-400/70 font-normal">days</span>
            </div>
            <p className="mt-2 text-[11px] font-mono text-slate-400">
              Unbroken discipline
            </p>
          </div>

          {/* 4. Energy XP */}
          <div className="relative p-5 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">Total XP</span>
              <Zap size={15} className="text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
              <SlidingNumber value={userXP?.total || 0} />
            </div>
            <p className="mt-2 text-[11px] font-mono text-slate-400 truncate">
              Rank: <span className="text-purple-300 font-semibold">{userXP?.level || 'Initiate'}</span>
            </p>
          </div>
        </section>
      )}

      {/* ── ZEN FOCUS MODE (Distraction-Free) ─────────────────────── */}
      <AnimatePresence>
        {zenMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="my-8 p-8 sm:p-14 rounded-3xl bg-[#0e101a]/85 border border-purple-500/30 text-center shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 mb-8 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Zen Focus Active</span>
            </div>

            {nextUpHabit ? (
              <div className="max-w-md mx-auto relative z-10">
                <GlassEmojiCapsule
                  icon={nextUpHabit.icon}
                  category={nextUpHabit.category}
                  size="xl"
                  interactive={true}
                  className="mx-auto mb-6 shadow-2xl"
                />
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                  {nextUpHabit.name}
                </h2>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Focus purely on this single ritual right now. Press <kbd className="px-2 py-1 rounded-lg bg-white/10 font-mono text-xs text-white border border-white/10">1</kbd> or click below to mark it done.
                </p>

                <button
                  onClick={() => handleToggleHabit(nextUpHabit)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  <span>Mark Done & Advance</span>
                </button>
              </div>
            ) : (
              <div className="py-8 relative z-10">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-black text-white mb-2">All Daily Rituals Complete!</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  You have conquered today's momentum. Take time to rest and recharge for tomorrow's flow.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DAILY RITUAL SEGMENTS (Morning, Afternoon, Evening, Anytime) ── */}
      {!zenMode && (
        <div className="space-y-10">
          {loading && habits.length === 0 ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : ritualGroups.length === 0 ? (
            /* Luxury Empty State */
            <div className="text-center py-16 px-6 rounded-3xl border border-white/[0.08] bg-[#0e101a]/60 backdrop-blur-2xl my-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-4xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                ✨
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Design Your Daily Ritual
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                Start building atomic momentum today. Add your first morning or evening habit to activate the tracker.
              </p>
              <button
                onClick={() => setQuickAddOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Your First Habit</span>
              </button>
            </div>
          ) : (
            ritualGroups.map(group => (
              <section key={group.timeSlot} className="space-y-4" aria-labelledby={`ritual-${group.timeSlot}`}>
                {/* Ritual Header Capsule */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {group.timeSlot === 'morning' ? '🌅' : group.timeSlot === 'afternoon' ? '☀️' : group.timeSlot === 'evening' ? '🌙' : '✨'}
                    </span>
                    <h2 id={`ritual-${group.timeSlot}`} className="text-lg font-bold text-white tracking-tight">
                      {group.label}
                    </h2>
                  </div>

                  <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-emerald-400 font-bold">{group.completedCount}</span> of {group.totalCount} completed
                  </span>
                </div>

                {/* Habit Cards in this ritual */}
                <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
                  {group.habits.map((habit, idx) => (
                    <TactileHabitCard
                      key={habit.id}
                      habit={habit as HabitWithStreak}
                      onToggle={handleToggleHabit}
                      index={idx}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
