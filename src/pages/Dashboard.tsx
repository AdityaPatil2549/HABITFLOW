import { useEffect, useState, useRef } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useMoodStore } from '../store/moodStore';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Flame,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Plus,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Smile,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconRenderer } from '../components/common/IconRenderer';
import { db } from '../db';
import { habitService } from '../services/habitService';
import { useGamificationStore } from '../store/gamificationStore';
import { calculateStats } from '../services/gamificationService';
import type { MoodScore } from '../types';
import { cn } from '../lib/utils';
import { AICoachCard } from '../components/coach/AICoachCard';
import { NLPQuickAdd } from '../components/habits/NLPQuickAdd';

import { useCompletionEffects } from '../components/ui/CompletionEffects';
import { FloatingOrbs } from '../components/ui/FloatingOrbs';
import { DailyQuote } from '../components/ui/DailyQuote';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Scroll3DReveal } from '../components/ui/Scroll3DReveal';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { TiltCard } from '../components/ui/TiltCard';

const PROFILE_KEY = 'habitflow_profile';

// Compute 7-day chart data from real logs
async function computeWeekChart(
  habits: any[]
): Promise<{ day: string; pct: number; date: string }[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE') };
  });

  return Promise.all(
    days.map(async ({ date, day }) => {
      const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
      if (!scheduled.length) return { day, date, pct: 0 };
      const logs = await db.habitLogs.where('date').equals(date).toArray();
      const done = logs.filter(l => {
        const habit = scheduled.find(h => h.id === l.habitId);
        if (!habit) return false;
        if (habit.type === 'boolean') return l.value >= 1;
        return l.value >= habit.targetValue;
      }).length;
      return { day, date, pct: Math.round((done / scheduled.length) * 100) };
    })
  );
}

export default Dashboard;

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, loadHabits, logHabit, unlogHabit } = useHabitStore();
  const { tasks, loadTasks, completeTask } = useTaskStore();
  const { userXP, loadXP } = useGamificationStore();
  const { todayMood, loadMoods, logMood } = useMoodStore();
  const { fireConfetti } = useCompletionEffects();
  const [userName, setUserName] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw).name || 'User' : 'User';
    } catch {
      return 'User';
    }
  });
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [weekChart, setWeekChart] = useState<{ day: string; pct: number; date: string }[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const logDebounceRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadHabits();
    loadTasks();
    loadXP();
    loadMoods();
    const sync = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          setUserName(p.name);
          setUserAvatar(p.avatar);
        }
      } catch {
        // Ignore localStorage reading/parsing issues
      }
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('profile-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profile-updated', sync);
    };
  }, [loadHabits, loadTasks, loadXP, loadMoods]);

  useEffect(() => {
    document.title = 'Dashboard — HabitFlow';
  }, []);

  // Compute real chart whenever habits load
  useEffect(() => {
    let mounted = true;
    const loadChart = async () => {
      if (!habits.length) {
        if (mounted) setChartLoading(false);
        return;
      }
      if (mounted) setChartLoading(true);
      const data = await computeWeekChart(habits);
      if (mounted) {
        setWeekChart(data);
        setChartLoading(false);
      }
    };
    loadChart();
    return () => { mounted = false; };
  }, [habits]);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Habit progress for today
  const scheduled = habits.filter(h => {
    if (h.archived) return false;
    return habitService.isScheduledForDate(h, today);
  });
  const done = scheduled.filter(h => !!h.todayLog && h.todayLog.value >= 1).length;
  const remaining = scheduled.length - done;
  const pct = scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0;

  // Ring math
  const circ = 2 * Math.PI * 78;
  const offset = circ - (circ * pct) / 100;

  // Tasks due today
  const todayTasks = tasks.filter(
    t => !t.parentId && !t.completed && t.dueDate && t.dueDate <= today
  );

  // Streak at-risk: habits not done today that have a live streak, after 6 PM
  const hour = new Date().getHours();
  const atRiskHabits = hour >= 20 ? scheduled.filter(h => !h.todayLog && h.streak.current > 0) : [];

  // Week trend: compare last 3 days vs prev 4 days
  const recent = weekChart.slice(4);
  const prev = weekChart.slice(0, 4);
  const recentAvg = recent.length ? recent.reduce((s, d) => s + d.pct, 0) / recent.length : 0;
  const prevAvg = prev.length ? prev.reduce((s, d) => s + d.pct, 0) / prev.length : 0;
  const trendDelta = Math.round(recentAvg - prevAvg);

  // XP stats
  const xpStats = userXP ? calculateStats(userXP.total) : null;

  const [showSmartAdd, setShowSmartAdd] = useState(false);

  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  // SVG chart rendering from real data
  const chartPoints =
    weekChart.length === 7
      ? weekChart.map((d, i) => {
          const x = (i / 6) * 380 + 10;
          const y = 110 - (d.pct / 100) * 100;
          return { x, y, ...d };
        })
      : [];

  const polyline = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = chartPoints.length
    ? `M${chartPoints[0].x},110 ` +
      chartPoints.map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${chartPoints[chartPoints.length - 1].x},110 Z`
    : '';

      <FloatingOrbs />
      
      {/* ── Massive Awwwards Header ── */}
      <motion.div
        variants={item}
        className="flex flex-col gap-6 sm:gap-8 pb-10"
      >
        <div className="flex flex-col gap-2 relative">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none relative z-10 drop-shadow-2xl">
            {greeting}, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-brand-400 via-brand-500 to-indigo-600">
              {userName}
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg sm:text-xl font-medium mt-4 max-w-xl">
            {done === scheduled.length && scheduled.length > 0
              ? '🎉 Incredible. You have conquered all habits for today.'
              : done > 0
                ? `${done} of ${scheduled.length} habits logged. Maintain the momentum.`
                : scheduled.length > 0
                  ? `You have ${scheduled.length} targets locked in for today.`
                  : 'Your canvas is empty. Plot your trajectory.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/habits')}
            className="group relative flex items-center gap-3 px-6 py-4 rounded-2xl bg-white text-slate-950 font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)]"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Engage Habit</span>
          </button>
          
          {xpStats && (
            <div className="flex flex-col items-start gap-1 ml-4 px-6 py-3 rounded-2xl vision-panel backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span className="text-base font-bold text-white tracking-wide">{userXP?.total ?? 0} XP</span>
              </div>
              <div className="w-32 h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                  style={{ width: `${xpStats.levelProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Daily Quote ── */}
      <motion.div variants={item} className="mb-12">
        <DailyQuote />
      </motion.div>

      {/* ── Streak At-Risk Warning ── */}
      {atRiskHabits.length > 0 && (
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 rounded-[2rem] border border-red-500/30 bg-red-500/10 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(239,68,68,0.3)] mb-12"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-red-400 tracking-tight">
              {atRiskHabits.length === 1
                ? `Critical: "${atRiskHabits[0].name}" streak is at risk!`
                : `Critical: ${atRiskHabits.length} streaks at risk today!`}
            </h3>
            <p className="text-sm font-medium text-red-400/80 mt-1">
              {atRiskHabits.map(h => `${h.name} (${h.streak.current}d)`).join(' · ')}
            </p>
          </div>
          <button
            onClick={() => navigate('/habits')}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-colors whitespace-nowrap border border-red-500/30"
          >
            Avert Crisis →
          </button>
        </motion.div>
      )}

      {/* ── AI Coach ── */}
      <motion.div variants={item} className="mb-12">
        <AICoachCard />
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-20">
        <TiltCard className="lg:col-span-1 h-full">
        <SpotlightCard
          variants={item}
          className="h-full rounded-[2.5rem] p-6 sm:p-10 relative"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Trophy size={100} className="text-brand-400" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white mb-4 sm:mb-6">Today's Target</h2>

          <div className="flex justify-center mb-4 sm:mb-6 relative group/ring">
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000',
                pct >= 100 ? 'bg-rose-500 scale-110 opacity-30' : 'bg-brand-500'
              )}
            />

            <svg
              className="w-36 h-36 sm:w-48 sm:h-48 -rotate-90 relative z-10"
              viewBox="0 0 192 192"
            >
              <circle
                cx="96"
                cy="96"
                r="78"
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="12"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="78"
                fill="transparent"
                stroke="url(#alive-ring-grad)"
                strokeWidth="12"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.8, ease: 'circOut' }}
                strokeLinecap="round"
                className={cn(pct >= 100 && 'animate-pulse')}
                style={{
                  filter: `drop-shadow(0 0 12px ${pct >= 100 ? 'rgba(244,63,94,0.5)' : 'rgba(139,92,246,0.4)'})`,
                }}
              />
              <defs>
                <linearGradient id="alive-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-4xl sm:text-5xl font-black text-white tracking-tighter flex items-baseline"
              >
                <AnimatedNumber value={pct} />
                <span className="text-xl sm:text-2xl text-slate-500 ml-0.5">%</span>
              </motion.span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                Complete
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Done
              </p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">
                <AnimatedNumber value={done} />
              </p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Left
              </p>
              <p className="text-base sm:text-lg font-bold text-white">
                <AnimatedNumber value={remaining} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total
              </p>
              <p className="text-base sm:text-lg font-bold text-white">
                <AnimatedNumber value={scheduled.length} />
              </p>
            </div>
          </div>
        </SpotlightCard>
        </TiltCard>

        {/* REAL 7-Day Chart */}
        <Scroll3DReveal delay={0.2} className="lg:col-span-2">
        <TiltCard className="h-full">
        <SpotlightCard variants={item} className="h-full rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-brand-400" /> 7-Day Performance
              </h2>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-1">
                Your habit completion rate over the last week
              </p>
            </div>
            {!chartLoading && weekChart.length > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                  trendDelta >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {trendDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trendDelta >= 0 ? '+' : ''}
                {trendDelta}%
              </div>
            )}
          </div>

          <div className="h-28 sm:h-40 w-full">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
              </div>
            ) : chartPoints.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Target size={28} className="opacity-40" />
                <p className="text-xs">Log habits to see your performance chart</p>
              </div>
            ) : (
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="line-grad-real" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--brand-400)" />
                  </linearGradient>
                  <linearGradient id="area-grad-real" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(pctLine => {
                  const y = 110 - (pctLine / 100) * 100;
                  return (
                    <line
                      key={pctLine}
                      x1="10"
                      y1={y}
                      x2="390"
                      y2={y}
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Area fill */}
                <path d={areaPath} fill="url(#area-grad-real)" />
                {/* Line */}
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="url(#line-grad-real)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {chartPoints.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#0f172a"
                      stroke="var(--brand-400)"
                      strokeWidth="2"
                    />
                    {p.pct > 0 && (
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fontSize="8"
                        fill="rgba(148,163,184,0.8)"
                      >
                        {p.pct}%
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            )}
          </div>
          {/* Day labels */}
          {!chartLoading && chartPoints.length > 0 && (
            <div className="flex justify-between mt-2 px-1">
              {weekChart.map(d => (
                <span
                  key={d.date}
                  className={`text-[10px] font-bold ${d.date === today ? 'text-brand-400' : 'text-slate-600'}`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          )}
        </SpotlightCard>
        </TiltCard>
        </Scroll3DReveal>
      </div>

      {/* ── Today's Tasks ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Due Tasks */}
        <TiltCard className="w-full h-full">
        <SpotlightCard variants={item} className="h-full rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> Due & Overdue
            </h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">All clear!</p>
                  <p className="text-xs text-slate-500 mt-0.5">No tasks due today.</p>
                </div>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center justify-center gap-1 mt-2"
                >
                  Add a task <ArrowRight size={12} className="relative top-[0.5px]" />
                </button>
              </div>
            ) : (
              todayTasks.slice(0, 5).map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                >
                  <button
                    onClick={() => completeTask(t.id)}
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0 hover:border-brand-400 hover:bg-brand-500/10 transition-all"
                  >
                    <CheckCircle2
                      size={11}
                      className="text-transparent group-hover:text-brand-400 transition-colors"
                    />
                  </button>
                  <div
                    className={`w-1 h-6 rounded-full flex-shrink-0 ${['bg-red-500', 'bg-orange-500', 'bg-brand-500', 'bg-slate-600'][t.priority]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t.dueDate === today ? 'Due today' : '⚠️ Overdue'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))
            )}
            {todayTasks.length > 5 && (
              <button
                onClick={() => navigate('/tasks')}
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest pt-1 transition-colors"
              >
                + {todayTasks.length - 5} more tasks
              </button>
            )}
          </div>
        </SpotlightCard>
        </TiltCard>

        {/* Habit Checklist */}
        <TiltCard className="w-full">
        <SpotlightCard variants={item} className="rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Active Habits
            </h2>
            <div className="flex items-center gap-2">
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

          {/* Smart Add Modal Overlay */}
          {showSmartAdd && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <NLPQuickAdd
                onClose={() => setShowSmartAdd(false)}
                onHabitCreated={(habit) => {
                  setShowSmartAdd(false);
                }}
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-center gap-3 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 hover:bg-brand-500/5'
                    } ${isLastOdd ? 'sm:col-span-2' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-90 ${isDone ? 'bg-emerald-500/20' : 'bg-white/5'}`}
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

      {/* ── Daily Mood Check-in ── */}
      <Scroll3DReveal delay={0.3}>
        <TiltCard>
          <SpotlightCard variants={item} className="rounded-[2.5rem] p-6 sm:p-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Smile size={18} className="text-brand-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white">How are you feeling today?</h2>
              </div>
              {todayMood && <span className="text-xs text-slate-500 font-medium">Logged ✔</span>}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { score: 1, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f61e/512.webp', label: 'Rough', color: '#f43f5e' },
                  { score: 2, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f615/512.webp', label: 'Meh', color: '#fb923c' },
                  { score: 3, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/512.webp', label: 'Okay', color: '#facc15' },
                  { score: 4, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.webp', label: 'Good', color: '#4ade80' },
                  { score: 5, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.webp', label: 'Great', color: '#10b981' },
                ] as { score: MoodScore; emojiUrl: string; label: string; color: string }[]
              ).map(({ score, emojiUrl, label, color }) => {
                const isSelected = todayMood?.score === score;
                return (
                  <button
                    key={score}
                    disabled={savingMood}
                    onClick={async () => {
                      setSavingMood(true);
                      try {
                        await logMood(score);
                      } finally {
                        setSavingMood(false);
                      }
                    }}
                    className="flex flex-col items-center group relative py-2 z-10"
                  >
                    <div
                      className={cn(
                        'mood-ring mb-2 sm:mb-3 relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform duration-500',
                        isSelected && 'active animate-mood-bounce'
                      )}
                      style={{ '--ring-color': color + '40' } as any}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="mood-glow"
                          className="absolute inset-0 rounded-full blur-xl"
                          style={{ background: color + '50' }}
                        />
                      )}
                      <img
                        src={emojiUrl}
                        alt={label}
                        className={cn(
                          'relative z-10 w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-300',
                          isSelected
                            ? 'scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                            : 'saturate-0 opacity-40 group-hover:saturate-100 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-active:scale-95'
                        )}
                        style={
                          isSelected
                            ? { filter: `drop-shadow(0 0 16px ${color}80)` }
                            : {}
                        }
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-bold tracking-tight transition-colors relative z-10',
                        isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>
        </TiltCard>
      </Scroll3DReveal>
    </motion.div>
  );
}
