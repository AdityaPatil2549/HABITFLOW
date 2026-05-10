import { useEffect, useState } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useMoodStore } from '../store/moodStore';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Trophy, ArrowRight, Plus, Activity, TrendingUp, TrendingDown, Zap, Target, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconRenderer } from '../components/common/IconRenderer';
import { db } from '../db';
import { habitService } from '../services/habitService';
import { useGamificationStore } from '../store/gamificationStore';
import { calculateStats } from '../services/gamificationService';
import type { MoodScore } from '../types';

const PROFILE_KEY = 'habitflow_profile';

// Compute 7-day chart data from real logs
async function computeWeekChart(habits: any[]): Promise<{ day: string; pct: number; date: string }[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE') };
  });

  return Promise.all(
    days.map(async ({ date, day }) => {
      const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
      if (!scheduled.length) return { day, date, pct: 0 };
      const logs = await db.habitLogs.where('date').equals(date).toArray();
      const done = logs.filter(l => l.value >= 1 && scheduled.some(h => h.id === l.habitId)).length;
      return { day, date, pct: Math.round((done / scheduled.length) * 100) };
    })
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { habits, loadHabits, logHabit, unlogHabit } = useHabitStore();
  const { tasks, loadTasks, completeTask } = useTaskStore();
  const { userXP, loadXP } = useGamificationStore();
  const { todayMood, loadMoods, logMood } = useMoodStore();
  const [userName, setUserName] = useState('Alex');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [weekChart, setWeekChart] = useState<{ day: string; pct: number; date: string }[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);

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
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('profile-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('profile-updated', sync);
    };
  }, [loadHabits, loadTasks, loadXP]);

  // Compute real chart whenever habits load
  useEffect(() => {
    if (!habits.length) { setChartLoading(false); return; }
    setChartLoading(true);
    computeWeekChart(habits).then(data => {
      setWeekChart(data);
      setChartLoading(false);
    });
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
  const circ = 477;
  const offset = circ - (circ * pct) / 100;

  // Tasks due today
  const todayTasks = tasks.filter(t => !t.parentId && !t.completed && t.dueDate && t.dueDate <= today);

  // Week trend: compare last 3 days vs prev 4 days
  const recentAvg = weekChart.slice(4).reduce((s, d) => s + d.pct, 0) / 3;
  const prevAvg = weekChart.slice(0, 4).reduce((s, d) => s + d.pct, 0) / 4;
  const trendDelta = Math.round(recentAvg - prevAvg);

  // XP stats
  const xpStats = userXP ? calculateStats(userXP.total) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  // SVG chart rendering from real data
  const chartPoints = weekChart.length === 7 ? weekChart.map((d, i) => {
    const x = (i / 6) * 380 + 10;
    const y = 110 - (d.pct / 100) * 100;
    return { x, y, ...d };
  }) : [];

  const polyline = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = chartPoints.length
    ? `M${chartPoints[0].x},110 ` + chartPoints.map(p => `L${p.x},${p.y}`).join(' ') + ` L${chartPoints[6].x},110 Z`
    : '';

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/20 border-2 border-white/10 flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-white">{userName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{greeting}, {userName} 👋</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              {done === scheduled.length && scheduled.length > 0
                ? '🎉 All habits done! Outstanding work.'
                : done > 0
                ? `${done} of ${scheduled.length} habits logged today. Keep going!`
                : scheduled.length > 0
                ? `${scheduled.length} habits scheduled — let's get started!`
                : 'No habits scheduled — add one to begin!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {xpStats && (
            <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-amber-400" />
                <span className="text-xs font-bold text-white">{userXP?.total ?? 0} XP</span>
                <span className="text-[10px] text-slate-500">· Lv.{xpStats.numericLevel}</span>
              </div>
              <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${xpStats.levelProgress}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/habits')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} /> New Habit
          </button>
        </div>
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <motion.div variants={item} className="lg:col-span-1 glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Trophy size={100} className="text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-white mb-6">Today's Target</h2>

          <div className="flex justify-center mb-6 relative">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="78" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
              <motion.circle
                cx="96" cy="96" r="78" fill="transparent"
                stroke="url(#dash-grad)" strokeWidth="14"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }}
              />
              <defs>
                <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-400)" />
                  <stop offset="100%" stopColor="var(--brand-600)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{pct}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Done</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Done</p>
              <p className="text-lg font-bold text-emerald-400">{done}</p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Left</p>
              <p className="text-lg font-bold text-white">{remaining}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-lg font-bold text-white">{scheduled.length}</p>
            </div>
          </div>
        </motion.div>

        {/* REAL 7-Day Chart */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-3xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-brand-400" /> 7-Day Performance
              </h2>
              <p className="text-slate-400 text-xs mt-1">Your habit completion rate over the last week</p>
            </div>
            {!chartLoading && weekChart.length > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                trendDelta >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {trendDelta >= 0
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />
                }
                {trendDelta >= 0 ? '+' : ''}{trendDelta}%
              </div>
            )}
          </div>

          <div className="h-40 w-full">
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
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
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
                    <line key={pctLine} x1="10" y1={y} x2="390" y2={y}
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  );
                })}
                {/* Area fill */}
                <path d={areaPath} fill="url(#area-grad-real)" />
                {/* Line */}
                <polyline points={polyline} fill="none" stroke="url(#line-grad-real)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Data points */}
                {chartPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#0f172a" stroke="var(--brand-400)" strokeWidth="2" />
                    {p.pct > 0 && (
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.8)">{p.pct}%</text>
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
                <span key={d.date} className={`text-[10px] font-bold ${d.date === today ? 'text-brand-400' : 'text-slate-600'}`}>
                  {d.day}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Today's Tasks & Habits Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Due Tasks */}
        <motion.div variants={item} className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> Focus for Today
            </h2>
            <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest">
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
                <button onClick={() => navigate('/tasks')} className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 mt-1">
                  Add a task <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              todayTasks.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                  <button
                    onClick={() => completeTask(t.id)}
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0 hover:border-brand-400 hover:bg-brand-500/10 transition-all"
                  >
                    <CheckCircle2 size={11} className="text-transparent group-hover:text-brand-400 transition-colors" />
                  </button>
                  <div className={`w-1 h-6 rounded-full flex-shrink-0 ${['bg-red-500', 'bg-orange-500', 'bg-brand-500', 'bg-slate-600'][t.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-brand-400 transition-colors">{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t.dueDate === today ? 'Due today' : '⚠️ Overdue'}</p>
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
              <button onClick={() => navigate('/tasks')} className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest pt-1 transition-colors">
                + {todayTasks.length - 5} more tasks
              </button>
            )}
          </div>
        </motion.div>

        {/* Habit Checklist */}
        <motion.div variants={item} className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Active Habits
            </h2>
            <button onClick={() => navigate('/habits')} className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest">
              Manage
            </button>
          </div>

          {scheduled.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Flame size={22} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No habits today</p>
                <p className="text-xs text-slate-500 mt-0.5">Add your first habit to start building streaks.</p>
              </div>
              <button onClick={() => navigate('/habits')} className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 mt-1">
                Add a habit <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheduled.slice(0, 6).map(h => {
                const isDone = h.todayLog && h.todayLog.value >= 1;
                return (
                  <div
                    key={h.id}
                    onClick={() => { if (isDone) unlogHabit(h.id); else logHabit(h.id, 1); }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-center gap-3 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 hover:bg-brand-500/5'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-90 ${isDone ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                      <IconRenderer name={h.icon} size={18} color={isDone ? '#10b981' : 'var(--brand-400)'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isDone ? 'text-emerald-400' : 'text-white'}`}>{h.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame size={9} className={h.streak.current > 0 ? 'text-orange-500' : 'text-slate-600'} />
                        <span className="text-[10px] font-bold text-slate-500">{h.streak.current}d streak</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}>
                      {isDone && <CheckCircle2 size={11} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {scheduled.length > 6 && (
            <button onClick={() => navigate('/habits')} className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest pt-3 transition-colors">
              + {scheduled.length - 6} more habits
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Daily Mood Check-in ── */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smile size={18} className="text-brand-400" />
            <h2 className="text-sm font-bold text-white">How are you feeling today?</h2>
          </div>
          {todayMood && (
            <span className="text-xs text-slate-500 font-medium">
              Logged ✔
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          {([
            { score: 1, emoji: '😞', label: 'Rough' },
            { score: 2, emoji: '😕', label: 'Meh' },
            { score: 3, emoji: '😐', label: 'Okay' },
            { score: 4, emoji: '😊', label: 'Good' },
            { score: 5, emoji: '😄', label: 'Great' },
          ] as { score: MoodScore; emoji: string; label: string }[]).map(({ score, emoji, label }) => {
            const isSelected = todayMood?.score === score;
            return (
              <button
                key={score}
                disabled={savingMood}
                onClick={async () => {
                  setSavingMood(true);
                  await logMood(score);
                  setSavingMood(false);
                }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                  isSelected
                    ? 'border-brand-500/40 bg-brand-500/10 scale-105'
                    : 'border-white/5 bg-white/[0.02] hover:border-brand-500/20 hover:bg-brand-500/5'
                }`}
              >
                <span className={`text-2xl transition-all ${isSelected ? '' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>{emoji}</span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-brand-400' : 'text-slate-500'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
