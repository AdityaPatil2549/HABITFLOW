import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Share2, Sparkles, BarChart3, Brain, FileText } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useProfileStore } from '../store/profileStore';
import { gamificationService } from '../services/gamificationService';
import { soundService } from '../services/soundService';
import { db } from '../db';
import { ReviewSummaryCard } from '../components/review/workstation/ReviewSummaryCard';
import { HabitPerformanceList, HabitPerformanceItem } from '../components/review/workstation/HabitPerformanceList';
import { HabitMoodCorrelationMatrix } from '../components/review/workstation/HabitMoodCorrelationMatrix';
import { WeeklyReflectionCard } from '../components/review/workstation/WeeklyReflectionCard';
import { MilestoneShareModal } from '../components/review/workstation/MilestoneShareModal';
import { cn } from '../lib/utils';

export function WeeklyReviewPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { profile } = useProfileStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'habits' | 'correlation' | 'reflection'>('summary');
  const [weeklyHabitsDone, setWeeklyHabitsDone] = useState(0);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Load store data and database logs
  useEffect(() => {
    let mounted = true;
    document.title = 'Weekly Retrospective — HabitFlow';

    Promise.all([
      loadHabits(),
      loadTasks(),
      gamificationService.getUserXP(),
    ]).then(([_, __, xp]) => {
      if (!mounted) return;
      if (xp) setWeeklyXp(xp.weeklyScore ?? 0);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [loadHabits, loadTasks]);

  // Load weekly habit logs directly from Dexie
  useEffect(() => {
    let mounted = true;
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');

    db.habitLogs
      .where('date')
      .between(startStr, endStr, true, true)
      .filter(l => !l.isFrozen)
      .toArray()
      .then(async logs => {
        const habitRows = await db.habits.toArray();
        const targetMap = new Map(habitRows.map(h => [h.id, h.targetValue || 1]));
        const completed = logs.filter(l => l.value >= (targetMap.get(l.habitId) ?? 1));
        if (mounted) setWeeklyHabitsDone(completed.length);
      })
      .catch(() => {
        if (mounted) setWeeklyHabitsDone(0);
      });

    return () => { mounted = false; };
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') { setActiveTab('summary'); soundService.playTick(); }
      else if (e.key === '2') { setActiveTab('habits'); soundService.playTick(); }
      else if (e.key === '3') { setActiveTab('correlation'); soundService.playTick(); }
      else if (e.key === '4') { setActiveTab('reflection'); soundService.playTick(); }
      else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShareModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computations
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const score = activeHabits.length
    ? Math.min(100, Math.round((weeklyHabitsDone / (activeHabits.length * 7)) * 100))
    : 0;

  const tasksDoneThisWeek = tasks.filter(
    t => t.completed && t.completedAt && new Date(t.completedAt) >= weekStart
  ).length;

  const bestStreak = habits.length ? Math.max(0, ...habits.map(h => h.streak.current)) : 0;

  const getHeadline = (pct: number) => {
    if (!activeHabits.length) return "Initialize your ritual stack 🌱";
    if (pct >= 85) return 'Flawless execution cycle 🔥';
    if (pct >= 70) return 'High compounding momentum 💪';
    if (pct >= 50) return 'Solid foundation maintained 📈';
    if (pct >= 25) return 'Friction absorbed — re-calibrate ⚡';
    return 'Reset standard for the upcoming cycle 🌧';
  };

  const getQuote = (pct: number) => {
    if (pct >= 80) return 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.';
    if (pct >= 50) return 'Small disciplines repeated with consistency every day lead to great achievements.';
    return 'Never let a slip turn into a slide. The next ritual starts immediately.';
  };

  const headline = getHeadline(score);
  const quote = getQuote(score);

  // Performance roster data
  const habitItems: HabitPerformanceItem[] = useMemo(() => {
    if (!activeHabits.length) return [];
    const sorted = [...activeHabits].sort((a, b) => b.completionRate30Days - a.completionRate30Days);
    const topId = sorted[0]?.id;
    const strugglingId = sorted.filter(h => h.completionRate30Days < 0.5)[0]?.id;

    return sorted.map(h => ({
      id: h.id,
      name: h.name,
      icon: h.icon || 'zap',
      category: h.category,
      rate: Math.round(h.completionRate30Days * 100),
      streak: h.streak.current,
      isBest: h.id === topId,
      isStruggling: h.id === strugglingId,
    }));
  }, [activeHabits]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--tx-primary)] tracking-tight">
              Weekly Retrospective
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--sf-overlay)] text-[var(--tx-muted)] border border-[var(--border-default)]">
              {weekLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--tx-secondary)] mt-1">
            Offline algorithmic synthesis of your habits, mood vectors, and task throughput.
          </p>
        </div>

        {/* Share / Export Action */}
        <button
          onClick={() => {
            setShareModalOpen(true);
            soundService.playTick();
          }}
          className="btn-secondary px-4 py-2 text-xs font-mono flex items-center gap-2 self-start sm:self-auto"
        >
          <Share2 size={14} className="text-[var(--accent-ink)]" />
          Export Artifact <span className="text-xs text-[var(--tx-muted)] font-mono">[E]</span>
        </button>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--sf-raised)] rounded-xl border border-[var(--border-default)] overflow-x-auto">
        {([
          { id: 'summary', label: 'Executive Summary', icon: Sparkles, hotkey: '1' },
          { id: 'habits', label: 'Habit Breakdown', icon: BarChart3, hotkey: '2' },
          { id: 'correlation', label: 'Pearson Matrix', icon: Brain, hotkey: '3' },
          { id: 'reflection', label: 'Reflection & Intention', icon: FileText, hotkey: '4' },
        ] as const).map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                soundService.playTick();
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-semibold'
                  : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)]'
              )}
            >
              <IconComponent size={14} className={isActive ? 'text-[var(--accent-fg)]' : 'text-[var(--tx-muted)]'} />
              <span>{tab.label}</span>
              <span className={cn('text-xs opacity-80 font-mono', isActive ? 'text-[var(--accent-fg)]' : 'text-[var(--tx-muted)]')}>
                [{tab.hotkey}]
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels with Smooth Motion */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[var(--tx-muted)]">Compiling retrospective data...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="tab-summary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
            >
              <ReviewSummaryCard
                score={score}
                weekLabel={weekLabel}
                tasksCompleted={tasksDoneThisWeek}
                habitsCompleted={weeklyHabitsDone}
                bestStreak={bestStreak}
                weeklyXp={weeklyXp}
                headline={headline}
                quote={quote}
              />
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="tab-habits"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
            >
              <HabitPerformanceList habits={habitItems} />
            </motion.div>
          )}

          {activeTab === 'correlation' && (
            <motion.div
              key="tab-correlation"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
            >
              <HabitMoodCorrelationMatrix />
            </motion.div>
          )}

          {activeTab === 'reflection' && (
            <motion.div
              key="tab-reflection"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
            >
              <WeeklyReflectionCard />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Export / Share Modal */}
      <MilestoneShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        userName={profile?.name || 'HabitFlow User'}
        avatarUrl={profile?.avatar || undefined}
        score={score}
        headline={headline}
        habitsCompleted={weeklyHabitsDone}
        tasksCompleted={tasksDoneThisWeek}
        bestStreak={bestStreak}
        weeklyXp={weeklyXp}
        weekLabel={weekLabel}
      />
    </div>
  );
}
