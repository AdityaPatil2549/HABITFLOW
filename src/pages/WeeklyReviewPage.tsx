import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Share2, Sparkles, BarChart3, Brain, FileText, ArrowRight } from 'lucide-react';
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
      .filter(l => l.value >= 1 && !l.isFrozen)
      .toArray()
      .then(logs => {
        if (mounted) setWeeklyHabitsDone(logs.length);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Weekly Retrospective
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
              {weekLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Offline algorithmic synthesis of your habits, mood vectors, and task throughput.
          </p>
        </div>

        {/* Share / Export Action */}
        <button
          onClick={() => {
            setShareModalOpen(true);
            soundService.playTick();
          }}
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs font-mono flex items-center gap-2 transition-all self-start sm:self-auto active:scale-95"
        >
          <Share2 size={14} className="text-purple-400" />
          Export Artifact <span className="text-[10px] text-slate-500 font-mono">[E]</span>
        </button>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#13151f] rounded-xl border border-white/[0.06] overflow-x-auto">
        {[
          { id: 'summary', label: 'Executive Summary', icon: Sparkles, hotkey: '1' },
          { id: 'habits', label: 'Habit Breakdown', icon: BarChart3, hotkey: '2' },
          { id: 'correlation', label: 'Pearson Matrix', icon: Brain, hotkey: '3' },
          { id: 'reflection', label: 'Reflection & Intention', icon: FileText, hotkey: '4' },
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                soundService.playTick();
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap',
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              )}
            >
              <IconComponent size={14} className={isActive ? 'text-black' : 'text-slate-500'} />
              <span>{tab.label}</span>
              <span className={cn('text-[10px] opacity-60 font-mono', isActive ? 'text-black/60' : 'text-slate-600')}>
                [{tab.hotkey}]
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels with Smooth Motion */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500">Compiling retrospective data...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="tab-summary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HabitPerformanceList habits={habitItems} />
            </motion.div>
          )}

          {activeTab === 'correlation' && (
            <motion.div
              key="tab-correlation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HabitMoodCorrelationMatrix />
            </motion.div>
          )}

          {activeTab === 'reflection' && (
            <motion.div
              key="tab-reflection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
