import { useEffect, useState, useMemo, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Maximize2, Minimize2, Sparkles, ArrowRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useGamificationStore } from '../store/gamificationStore';
import { useModalStore } from '../store/modalStore';
import { db, getOrCreateSettings } from '../db';
import { momentumEngine } from '../services/momentumEngine';
import { calculateStats } from '../services/gamificationService';
import { aiCoachService } from '../services/aiCoachService';
import { resolveTelemetryMode } from '../lib/theme';
import { TactileHabitCard } from '../components/habits/TactileHabitCard';
import { RelayRail } from '../components/habits/RelayRail';
import { HabitEditorDrawer } from '../components/habits/workstation/HabitEditorDrawer';
import { MomentumHorizon } from '../components/dashboard/MomentumHorizon';
import { TodayTasks } from '../components/dashboard/TodayTasks';
import { MoodPulse } from '../components/dashboard/MoodPulse';
import type { AIInsight, Habit, HabitLog, HabitWithStreak, TelemetryMode } from '../types';
import { cn } from '../lib/utils';
import { soundService } from '../services/soundService';

interface StarterHabitTemplate {
  name: string;
  icon: string;
  category: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  color: string;
  desc: string;
  stackAfterName?: string;
}

const STARTER_HABITS: StarterHabitTemplate[] = [
  { name: 'Drink 500ml Water', icon: '💧', category: 'health', timeOfDay: 'morning', color: '#22C55E', desc: 'Hydrate immediately upon waking' },
  { name: '10m Mindfulness Meditation', icon: '🧘', category: 'mindfulness', timeOfDay: 'morning', color: '#06B6D4', desc: 'Clear mental noise and sharpen focus', stackAfterName: 'Drink 500ml Water' },
  { name: 'Read 10 Pages', icon: '📖', category: 'learning', timeOfDay: 'evening', color: '#8B5CF6', desc: 'Daily compounding knowledge' },
  { name: '20m Brisk Walk', icon: '🚶', category: 'fitness', timeOfDay: 'afternoon', color: '#3B82F6', desc: 'Physical vitality & active rest' },
];

export function Dashboard() {
  const { habits, loading, loadHabits, logHabit, incrementHabit, unlogHabit, addHabit, updateHabit } = useHabitStore();
  const { loadTasks } = useTaskStore();
  const { userXP, loadXP } = useGamificationStore();
  const { setQuickAddOpen } = useModalStore();

  const [globalMomentum, setGlobalMomentum] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<HabitLog[]>([]);
  const [quickInsight, setQuickInsight] = useState<AIInsight | null>(null);
  const [telemetryMode, setTelemetryMode] = useState<TelemetryMode>('scaffold');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);
  const [bypassedHabitIds, setBypassedHabitIds] = useState<Set<string>>(new Set());

  const handleAddStarter = async (starter: StarterHabitTemplate) => {
    soundService.playBadge();
    let stackAfterHabitId: string | undefined;
    if (starter.stackAfterName) {
      const parent = habits.find(h => h.name.includes(starter.stackAfterName!));
      if (parent) stackAfterHabitId = parent.id;
    }
    await addHabit({
      name: starter.name,
      icon: starter.icon,
      category: starter.category,
      timeOfDay: starter.timeOfDay,
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

  const numericLevel = calculateStats(userXP?.total ?? 0).numericLevel;

  useEffect(() => {
    const syncTelemetry = async () => {
      const s = await getOrCreateSettings();
      setTelemetryMode(resolveTelemetryMode(s, numericLevel));
    };
    syncTelemetry();
    window.addEventListener('habitflow-appearance-changed', syncTelemetry);
    return () => window.removeEventListener('habitflow-appearance-changed', syncTelemetry);
  }, [numericLevel]);

  // Fetch recent logs (30d window for momentum + 7d continuity tape + weekly sparkline)
  useEffect(() => {
    let active = true;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const windowStartStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    Promise.all([
      momentumEngine.calculateGlobalMomentum(),
      db.habitLogs.where('date').between(windowStartStr, todayStr, true, true).toArray(),
      aiCoachService.getRecentInsights(1),
    ])
      .then(([momentumScore, logs, insights]) => {
        if (!active) return;
        setGlobalMomentum(momentumScore);
        setRecentLogs(logs);
        setQuickInsight(insights[0] ?? null);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [habits]);

  // Per-habit grouped logs & individual momentum score
  const habitMetricsMap = useMemo(() => {
    const logsByHabit = new Map<string, HabitLog[]>();
    for (const log of recentLogs) {
      const arr = logsByHabit.get(log.habitId) || [];
      arr.push(log);
      logsByHabit.set(log.habitId, arr);
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const map = new Map<string, { logs: HabitLog[]; score: number }>();

    for (const h of habits) {
      const hLogs = logsByHabit.get(h.id) || [];
      const target = h.targetValue || 1;
      const completedDates = hLogs
        .filter(l => !l.isFrozen && l.value >= target)
        .map(l => l.date);
      const metrics = momentumEngine.calculateHabitMomentum(completedDates, todayStr);
      map.set(h.id, { logs: hLogs, score: metrics.score });
    }
    return map;
  }, [habits, recentLogs]);

  // 7-day daily completion sparkline for MomentumHorizon
  const weeklySeries = useMemo(() => {
    if (habits.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const targetMap = new Map(habits.map(h => [h.id, h.targetValue || 1]));
    const today = new Date();
    const series: number[] = [];

    for (let offset = 6; offset >= 0; offset--) {
      const dateStr = format(subDays(today, offset), 'yyyy-MM-dd');
      const doneSet = new Set(
        recentLogs
          .filter(l => l.date === dateStr && !l.isFrozen && l.value >= (targetMap.get(l.habitId) ?? 1))
          .map(l => l.habitId)
      );
      series.push(Math.round((doneSet.size / habits.length) * 100));
    }
    return series;
  }, [habits, recentLogs]);

  // Set of completed habit IDs for today
  const completedHabitIds = useMemo(() => {
    return new Set(
      habits
        .filter(h => (h.todayLog?.value ?? 0) >= (h.targetValue || 1))
        .map(h => h.id)
    );
  }, [habits]);

  const ritualGroups = useMemo(() => {
    return momentumEngine.groupHabitsByRitual(habits, completedHabitIds);
  }, [habits, completedHabitIds]);

  const totalHabits = habits.length;
  const completedCount = completedHabitIds.size;
  const maxStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, h.streak?.current || 0), 0),
    [habits]
  );

  const handleToggleHabit = useCallback(
    async (habit: HabitWithStreak) => {
      const target = habit.targetValue || 1;
      const isDone = (habit.todayLog?.value ?? 0) >= target;
      if (isDone) {
        await unlogHabit(habit.id);
      } else if (habit.type === 'boolean' || target <= 1) {
        await logHabit(habit.id, 1);
        const hasChildren = habits.some(h => h.stackAfterHabitId === habit.id);
        if (hasChildren) {
          soundService.playSynapseSpark();
          setTimeout(() => soundService.playUnlatchClick(), 140);
        }
      } else {
        await incrementHabit(habit.id, 1);
      }
    },
    [habits, incrementHabit, logHabit, unlogHabit]
  );

  const handleIncrementHabit = useCallback(
    async (habit: HabitWithStreak, delta: number) => {
      await incrementHabit(habit.id, delta);
    },
    [incrementHabit]
  );

  const handleSetHabitValue = useCallback(
    async (habit: HabitWithStreak, value: number) => {
      if (value <= 0) {
        await unlogHabit(habit.id);
      } else {
        await logHabit(habit.id, value);
      }
    },
    [logHabit, unlogHabit]
  );

  const handleBypassLock = useCallback((habitId: string) => {
    setBypassedHabitIds(prev => {
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });
  }, []);

  const handleSaveHabitDetails = useCallback(
    async (data: Omit<Habit, 'id' | 'createdAt' | 'order'>, habitId?: string) => {
      if (habitId) {
        await updateHabit(habitId, data);
      } else {
        await addHabit(data);
      }
    },
    [addHabit, updateHabit]
  );

  // Keyboard shortcuts (`Z` for Zen, `1..9` quick toggle)
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

  const isMonastic = telemetryMode === 'monastic';

  const renderRitualList = (zenExpanded = false) => (
    <div className={cn(zenExpanded ? 'space-y-6' : 'space-y-6')}>
      {loading && habits.length === 0 ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-20 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-default)] p-4 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[var(--sf-overlay)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-[var(--sf-overlay)] rounded" />
                  <div className="h-3 w-28 bg-[var(--sf-overlay)] rounded" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--sf-overlay)]" />
            </div>
          ))}
        </div>
      ) : (
        ritualGroups.map(group => {
          const nodes = momentumEngine.resolveHabitStack(group.habits, completedHabitIds);
          const chronotype =
            group.timeSlot === 'morning'
              ? { icon: '🌅', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25' }
              : group.timeSlot === 'afternoon'
                ? { icon: '☀️', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/25' }
                : group.timeSlot === 'evening'
                  ? { icon: '🌙', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25' }
                  : { icon: '📌', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' };

          return (
            <section
              key={group.timeSlot}
              className="space-y-2"
              aria-labelledby={`ritual-${group.timeSlot}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-7 h-7 rounded-lg border flex items-center justify-center text-sm shadow-sm',
                      chronotype.bg,
                      chronotype.border
                    )}
                  >
                    {chronotype.icon}
                  </span>
                  <h2
                    id={`ritual-${group.timeSlot}`}
                    className="text-sm font-semibold text-[var(--tx-primary)] tracking-tight"
                  >
                    {group.label}
                  </h2>
                </div>
                {!isMonastic && (
                  <span
                    className={cn(
                      'font-data text-xs px-2.5 py-0.5 rounded-full border transition-colors',
                      group.completedCount === group.totalCount && group.totalCount > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border-[var(--border-default)]'
                    )}
                  >
                    {group.completedCount}/{group.totalCount}
                  </span>
                )}
              </div>

              <div>
                {nodes.map((node, idx) => {
                  const habitWithStreak = node.habit as HabitWithStreak;
                  const habitMetrics = habitMetricsMap.get(node.habit.id);
                  const nextHabit = node.nextInChain
                    ? habits.find(h => h.id === node.nextInChain)
                    : undefined;
                  const showRailAbove = Boolean(node.parentHabit && idx > 0);

                  return (
                    <div key={node.habit.id}>
                      {showRailAbove && (
                        <RelayRail
                          active={Boolean(
                            node.parentHabit && completedHabitIds.has(node.parentHabit.id)
                          )}
                          primed={node.isPrimed}
                          locked={node.isLocked && !bypassedHabitIds.has(node.habit.id)}
                        />
                      )}
                      <TactileHabitCard
                        habit={habitWithStreak}
                        onToggle={handleToggleHabit}
                        onIncrement={handleIncrementHabit}
                        onSetValue={handleSetHabitValue}
                        onOpenDetails={setEditingHabit}
                        onBypassLock={handleBypassLock}
                        isBypassed={bypassedHabitIds.has(node.habit.id)}
                        isPrimed={node.isPrimed}
                        isLocked={node.isLocked}
                        parentHabitName={node.parentHabit?.name}
                        nextHabitName={nextHabit?.name}
                        recentLogs={habitMetrics?.logs}
                        momentumScore={habitMetrics?.score}
                        telemetryMode={telemetryMode}
                        zenExpanded={zenExpanded}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );

  // ── Zen Mode Overlay ────────────────────────────────────────────
  if (zenMode) {
    return (
      <div
        className="min-h-[calc(100dvh-5rem)] bg-[var(--sf-dim)] rounded-2xl p-4 sm:p-8 flex flex-col items-center cursor-pointer"
        onClick={e => {
          if (e.target === e.currentTarget) setZenMode(false);
        }}
      >
        <div
          className="w-full max-w-2xl space-y-6 cursor-default"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
            <div>
              <p className="font-label-caps">Zen Execution Mode</p>
              <h1 className="font-h1 text-[var(--tx-primary)] mt-1">Today's Rituals</h1>
            </div>
            <button
              type="button"
              onClick={() => setZenMode(false)}
              className="btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-2"
            >
              <Minimize2 size={14} />
              <span>Exit (Z)</span>
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="text-sm text-[var(--tx-secondary)] py-8 text-center">
              No habits scheduled yet. Exit Zen mode to add one.
            </p>
          ) : (
            renderRitualList(true)
          )}
        </div>

        <HabitEditorDrawer
          isOpen={Boolean(editingHabit)}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveHabitDetails}
          initialHabit={editingHabit}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Top Workspace Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-label-caps">{format(new Date(), 'EEEE, MMMM d')}</p>
            {totalHabits > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30">
                {completedCount}/{totalHabits} Completed
              </span>
            )}
          </div>
          <div className="mt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx-primary)]">
              Today
            </h1>
            <p className="text-xs text-[var(--tx-secondary)] font-medium mt-0.5">
              Daily Execution Flow & Habit Kinetics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setZenMode(true)}
            aria-label="Enter Zen Focus Mode"
            className="btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-2 hover:border-[var(--accent)]/50"
          >
            <Maximize2 size={14} className="text-[var(--accent-ink)]" />
            <span>Zen (Z)</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 shadow-md shadow-[rgba(var(--brand-500-rgb),0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* ── Empty State Onboarding ── */}
      {!loading && habits.length === 0 && (
        <div className="card-raised p-6 sm:p-10 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-default)] flex items-center justify-center mx-auto text-xl">
              ◉
            </div>
            <h2 className="font-h2 text-[var(--tx-primary)]">Initialize Your Daily Sequence</h2>
            <p className="text-sm text-[var(--tx-secondary)]">
              Consistency begins with one atomic cue. Select a starter template or build a custom habit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            {STARTER_HABITS.map(starter => (
              <button
                key={starter.name}
                type="button"
                onClick={() => handleAddStarter(starter)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--accent)] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{starter.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--tx-primary)] truncate">
                      {starter.name}
                    </p>
                    <p className="text-xs text-[var(--tx-secondary)] truncate">{starter.desc}</p>
                  </div>
                </div>
                <span className="ml-2 text-xs font-mono font-semibold text-[var(--accent-ink)] shrink-0">
                  + Add
                </span>
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="btn-secondary px-5 py-2.5 text-xs inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Create Custom Habit</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Initial Zero-Habit Skeleton (Smooth matching empty state height) ── */}
      {loading && habits.length === 0 && (
        <div className="card-raised p-6 sm:p-10 text-center space-y-6 animate-pulse max-w-2xl mx-auto my-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--sf-overlay)] mx-auto" />
          <div className="h-6 w-48 bg-[var(--sf-overlay)] rounded mx-auto" />
          <div className="h-4 w-72 bg-[var(--sf-overlay)] rounded mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[var(--sf-overlay)]" />
            ))}
          </div>
        </div>
      )}

      {/* ── 8/4 Execution Split (Centered Single Column in Monastic Mode) ── */}
      {habits.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-1 gap-6 items-start',
            isMonastic ? 'max-w-2xl mx-auto' : 'lg:grid-cols-12'
          )}
        >
          {/* Top / Primary 8 Columns: Active Rituals */}
          <div className={cn('space-y-5', !isMonastic && 'lg:col-span-8')}>
            {!isMonastic && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[var(--accent-ink)]" />
                  <span className="font-label-caps">Daily Rituals</span>
                </div>
                <span className="font-data text-xs text-[var(--tx-secondary)]">
                  {completedCount} of {totalHabits} complete
                </span>
              </div>
            )}
            {renderRitualList(false)}
          </div>

          {/* Bottom / Secondary 4 Columns: Horizon, Tasks, Mood, Quick Insights */}
          {!isMonastic && (
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
              <MomentumHorizon
                globalMomentum={globalMomentum}
                completedCount={completedCount}
                totalHabits={totalHabits}
                maxStreak={maxStreak}
                weeklySeries={weeklySeries}
              />

              <TodayTasks />

              <MoodPulse />

              {/* Quick Insights (1-Sentence Summary) */}
              <section aria-label="Quick Insights" className="card-raised p-4 sm:p-5 space-y-2.5 bg-gradient-to-br from-[var(--sf-raised)] to-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles size={13} />
                    </div>
                    <span className="font-label-caps">Quick Insight</span>
                  </div>
                  <Link
                    to="/insights"
                    className="text-xs font-semibold text-[var(--accent-ink)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Insights</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-xs text-[var(--tx-secondary)] leading-relaxed">
                  {quickInsight
                    ? `${quickInsight.title}: ${quickInsight.body}`
                    : completedCount === totalHabits && totalHabits > 0
                      ? 'All scheduled rituals executed today — momentum is compounding cleanly.'
                      : 'Complete your earliest anchor habit to prime downstream chain links.'}
                </p>
              </section>
            </div>
          )}
        </div>
      )}

      <HabitEditorDrawer
        isOpen={Boolean(editingHabit)}
        onClose={() => setEditingHabit(null)}
        onSave={handleSaveHabitDetails}
        initialHabit={editingHabit}
      />
    </div>
  );
}

export default Dashboard;
