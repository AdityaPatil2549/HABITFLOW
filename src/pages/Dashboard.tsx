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
  CheckSquare,
  BarChart2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useGamificationStore } from '../store/gamificationStore';
import { useModalStore } from '../store/modalStore';
import { momentumEngine, DailyRitualGroup } from '../services/momentumEngine';
import { TactileHabitCard } from '../components/habits/TactileHabitCard';
import { SlidingNumber } from '../components/ui/motion/SlidingNumber';
import { Dock, DockItem, DockLabel, DockIcon } from '../components/ui/motion/Dock';
import type { HabitWithStreak } from '../types';
import { format } from 'date-fns';

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
    <div className="min-h-screen bg-[#08090C] text-slate-100 pb-32 pt-6 sm:pt-8 px-4 sm:px-8 max-w-5xl mx-auto selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── TOP HEADER / MOMENTUM PULSE ──────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold tracking-wider uppercase text-emerald-400 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span>Today's Ritual</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono normal-case">{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Daily Momentum
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZenMode(prev => !prev)}
            aria-label="Toggle Zen Focus Mode"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
          >
            {zenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>Zen ({zenMode ? 'On' : 'Z'})</span>
          </button>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* ── MOMENTUM HUD METRICS ───────────────────────────────── */}
      {!zenMode && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-8" aria-label="Momentum statistics">
          {/* Momentum Score */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Momentum</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <SlidingNumber value={globalMomentum} />
              <span className="text-xs text-emerald-400 font-sans font-bold">/ 100</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Half-life decay resilient</span>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <SlidingNumber value={completionPercentage} />
              <span className="text-xs text-slate-400 font-sans font-bold">%</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              <span className="font-mono text-slate-300 font-semibold">{completedCount}</span> of{' '}
              <span className="font-mono text-slate-300 font-semibold">{totalHabits}</span> rituals
            </div>
          </div>

          {/* Top Active Streak */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Top Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1">
              <SlidingNumber value={maxStreak} />
              <span className="text-xs text-amber-400/80 font-sans font-bold">days</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Personal best consistency
            </div>
          </div>

          {/* XP Level */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Energy XP</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              <SlidingNumber value={userXP?.total || 0} />
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Tier: <span className="text-slate-300 font-semibold">{userXP?.level || 'Builder'}</span>
            </div>
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
            className="my-12 p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-center shadow-2xl backdrop-blur-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-3 h-3" />
              <span>Zen Focus Active</span>
            </div>

            {nextUpHabit ? (
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">{nextUpHabit.icon || '🎯'}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{nextUpHabit.name}</h2>
                <p className="text-sm text-slate-400 mb-8">
                  Focus on this single ritual right now. Press <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs">1</kbd> or click below to check it off.
                </p>

                <button
                  onClick={() => handleToggleHabit(nextUpHabit)}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  <span>Mark Done & Advance</span>
                </button>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">All Daily Rituals Complete!</h2>
                <p className="text-sm text-slate-400">
                  You have conquered today's momentum. Take time to rest and recover.
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
                <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : ritualGroups.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-white/10 bg-slate-900/20 my-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-3xl">
                ✨
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Build Your Daily Ritual</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                Start small with atomic momentum. Add your first morning or evening habit to begin tracking.
              </p>
              <button
                onClick={() => setQuickAddOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Habit</span>
              </button>
            </div>
          ) : (
            ritualGroups.map(group => (
              <section key={group.timeSlot} className="space-y-3" aria-labelledby={`ritual-${group.timeSlot}`}>
                {/* Ritual Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {group.timeSlot === 'morning' ? '🌅' : group.timeSlot === 'afternoon' ? '☀️' : group.timeSlot === 'evening' ? '🌙' : '✨'}
                    </span>
                    <h2 id={`ritual-${group.timeSlot}`} className="text-base sm:text-lg font-bold text-white">
                      {group.label}
                    </h2>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-semibold">{group.completedCount}</span> / {group.totalCount} completed
                  </span>
                </div>

                {/* Habit Cards in this ritual */}
                <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
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

      {/* ── TACTILE FLOATING DOCK (Navigation) ────────────────────── */}
      <Dock className="border-white/10 bg-slate-950/85">
        <DockItem onClick={() => navigate('/dashboard')} active>
          <DockLabel>Today Ritual</DockLabel>
          <DockIcon>
            <Zap className="w-5 h-5 text-emerald-400" />
          </DockIcon>
        </DockItem>

        <DockItem onClick={() => navigate('/habits')}>
          <DockLabel>All Habits</DockLabel>
          <DockIcon>
            <Target className="w-5 h-5" />
          </DockIcon>
        </DockItem>

        <DockItem onClick={() => navigate('/tasks')}>
          <DockLabel>Tasks</DockLabel>
          <DockIcon>
            <CheckSquare className="w-5 h-5" />
          </DockIcon>
        </DockItem>

        <DockItem onClick={() => navigate('/analytics')}>
          <DockLabel>Momentum Analytics</DockLabel>
          <DockIcon>
            <BarChart2 className="w-5 h-5" />
          </DockIcon>
        </DockItem>

        <DockItem onClick={() => navigate('/profile')}>
          <DockLabel>Profile & Squad</DockLabel>
          <DockIcon>
            <User className="w-5 h-5" />
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
}

export default Dashboard;
