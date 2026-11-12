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
import type { HabitWithStreak } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { getHabitEmoji } from '../lib/emoji';
import { soundService } from '../services/soundService';

const STARTER_HABITS = [
  { name: 'Drink 500ml Water', icon: '💧', category: 'health', timeOfDay: 'morning', color: '#10B981', desc: 'Hydrate immediately upon waking' },
  { name: '10m Mindfulness Meditation', icon: '🧘', category: 'mindfulness', timeOfDay: 'morning', color: '#06B6D4', desc: 'Clear mental noise and sharpen focus', stackAfterName: 'Drink 500ml Water' },
  { name: 'Read 10 Pages', icon: '📖', category: 'learning', timeOfDay: 'evening', color: '#6366F1', desc: 'Daily compounding knowledge' },
  { name: '20m Brisk Walk', icon: '🚶', category: 'fitness', timeOfDay: 'afternoon', color: '#10B981', desc: 'Physical vitality & active rest' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, loading, loadHabits, logHabit, unlogHabit, addHabit } = useHabitStore();
  const { loadTasks } = useTaskStore();
  const { userXP, loadXP } = useGamificationStore();
  const { setQuickAddOpen } = useModalStore();

  const [globalMomentum, setGlobalMomentum] = useState<number>(0);
  const [zenMode, setZenMode] = useState<boolean>(false);

  const handleAddStarter = async (starter: typeof STARTER_HABITS[0]) => {
    soundService.playBadge();
    let stackAfterHabitId: string | undefined = undefined;
    if ((starter as any).stackAfterName) {
      const parent = habits.find(h => h.name.includes((starter as any).stackAfterName));
      if (parent) stackAfterHabitId = parent.id;
    }
    await addHabit({
      name: starter.name,
      icon: starter.icon,
      category: starter.category,
      timeOfDay: starter.timeOfDay as any,
      stackAfterHabitId,
      frequency: 'daily',
      type: 'boolean',
      targetValue: 1,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      graceDayEnabled: false,
      archived: false,
      color: starter.color,
    });
  };

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
        // Play synaptic laser spark if this habit primes any downstream child
        const hasChildren = habits.some(h => h.stackAfterHabitId === habit.id);
        if (hasChildren) {
          soundService.playSynapseSpark();
          setTimeout(() => soundService.playUnlatchClick(), 260);
        }
      }
    },
    [habits, logHabit, unlogHabit]
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-40 lg:pb-16 space-y-8">
      {/* ── TOP HEADER / MOMENTUM PULSE ──────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] relative">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Today's Habits</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-sans">{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3 font-display">
            Daily Momentum
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Build unbroken daily consistency and watch your compounding momentum grow.
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
                <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-3xl mx-auto mb-6">
                  {getHabitEmoji(nextUpHabit.icon)}
                </div>
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

      {/* ── ONBOARDING EMPTY STATE (When user has 0 habits) ─────────── */}
      {!zenMode && !loading && habits.length === 0 && (
        <div className="text-center py-12 px-6 sm:px-10 rounded-3xl border border-white/[0.1] bg-[#0c0f18]/80 backdrop-blur-2xl my-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_24px_rgba(16,185,129,0.25)]">
            ✨
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Welcome to HabitFlow
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            Consistency begins with a single atomic step. Pick a starter habit below to activate your daily momentum tracking.
          </p>

          {/* Quick Starter Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-8 text-left">
            {STARTER_HABITS.map(starter => (
              <button
                key={starter.name}
                onClick={() => handleAddStarter(starter)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/30 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-2xl shrink-0">{starter.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {starter.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {starter.desc}
                    </div>
                  </div>
                </div>
                <span className="ml-2 text-xs font-mono font-semibold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  + Add
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.12] font-semibold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Custom Habit</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2-COLUMN SPLIT DESKTOP LAYOUT (HABITS FRONT & CENTER) ──── */}
      {!zenMode && (habits.length > 0 || loading) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT PANE: HABITS & RITUAL TIMELINE (7 COLS ON DESKTOP) ── */}
          <div className="lg:col-span-7 space-y-8 order-1">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Flow</h2>
              </div>
              <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <span className="text-emerald-400 font-bold">{completedCount}</span> of {totalHabits} completed
              </span>
            </div>

            {loading && habits.length === 0 ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-[88px] rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-center justify-between animate-pulse relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-white/[0.08] rounded-md" />
                        <div className="h-3 w-24 bg-white/[0.04] rounded-md" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex-shrink-0 ml-4" />
                  </div>
                ))}
              </div>
            ) : (
              ritualGroups.map(group => (
                <section key={group.timeSlot} className="space-y-4" aria-labelledby={`ritual-${group.timeSlot}`}>
                  {/* Ritual Header Capsule */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {group.timeSlot === 'morning' ? '🌅' : group.timeSlot === 'afternoon' ? '☀️' : group.timeSlot === 'evening' ? '🌙' : '✨'}
                      </span>
                      <h3 id={`ritual-${group.timeSlot}`} className="text-base font-bold text-white tracking-tight">
                        {group.label}
                      </h3>
                    </div>

                    <span className="text-xs font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-emerald-400 font-bold">{group.completedCount}</span> of {group.totalCount} completed
                    </span>
                  </div>

                  {/* Atomic Habit Stacking Pipeline */}
                  <div className="relative space-y-1">
                    {(() => {
                      const nodes = momentumEngine.resolveHabitStack(group.habits, completedHabitIds);
                      return nodes.map((node, idx) => {
                        const habitWithStreak = node.habit as HabitWithStreak;
                        const isDone = node.isCompletedToday;
                        const hasNext = idx < nodes.length - 1;
                        const nextNode = hasNext ? nodes[idx + 1] : null;

                        return (
                          <div key={node.habit.id} className="relative">
                            <TactileHabitCard
                              habit={habitWithStreak}
                              onToggle={handleToggleHabit}
                              index={idx}
                              isPrimed={node.isPrimed}
                              isLocked={node.isLocked}
                              parentHabitName={node.parentHabit?.name}
                              chainPosition={{ current: node.chainDepth + 1, total: node.chainTotal }}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* ── RIGHT PANE: SUMMARY METRICS (5 COLS) ─ */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:sticky lg:top-6">
            {/* 2x2 Summary KPI Quad */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5" aria-label="Momentum statistics">
              {/* 1. Momentum Score */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-neutral-900/60 border border-white/10 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Momentum</span>
                  <TrendingUp size={14} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono flex items-baseline gap-1 tabular-nums">
                  <span>{globalMomentum}</span>
                  <span className="text-xs text-neutral-400 font-normal">/ 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden mt-2.5">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, globalMomentum))}%` }}
                  />
                </div>
              </div>

              {/* 2. Completion Rate */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-neutral-900/60 border border-white/10 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Today's Rate</span>
                  <CheckCircle2 size={14} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono flex items-baseline gap-1 tabular-nums">
                  <span>{completionPercentage}</span>
                  <span className="text-xs text-neutral-400 font-normal">%</span>
                </div>
                <p className="mt-2 text-xs font-mono text-neutral-400 truncate tabular-nums">
                  <span className="text-white font-semibold">{completedCount}</span> / <span className="text-white font-semibold">{totalHabits}</span> habits
                </p>
              </div>

              {/* 3. Top Streak */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-neutral-900/60 border border-white/10 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Peak Streak</span>
                  <Flame size={14} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono flex items-baseline gap-1 tabular-nums">
                  <span>{maxStreak}</span>
                  <span className="text-xs text-neutral-400 font-normal">days</span>
                </div>
                <p className="mt-2 text-xs font-mono text-neutral-400">
                  Longest active streak
                </p>
              </div>

              {/* 4. Energy XP */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-neutral-900/60 border border-white/10 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">Total XP</span>
                  <Zap size={14} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
                  <span>{userXP?.total || 0}</span>
                </div>
                <p className="mt-2 text-xs font-mono text-neutral-400 truncate">
                  Rank: <span className="text-neutral-200 font-semibold">{userXP?.level || 'Initiate'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
