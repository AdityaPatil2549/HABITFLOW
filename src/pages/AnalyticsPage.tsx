import { useEffect, useState, useMemo } from 'react';
import { useHabitStore } from '../store/habitStore';
import { useTaskStore } from '../store/taskStore';
import { useMoodStore } from '../store/moodStore';
import { db } from '../db';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell, ComposedChart, Legend, Area, AreaChart,
} from 'recharts';
import { format, subDays, subWeeks, startOfWeek, eachDayOfInterval, getDay, subYears } from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS = ['Overview', 'Insights', 'Per Habit', 'Tasks', 'Heatmap'] as const;
type TabType = (typeof TABS)[number];

const TOOLTIP_STYLE = {
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#dae2fd',
  fontSize: 13,
};

// ─── 365-Day Yearly Heatmap ────────────────────────────────────
function YearlyHeatmap({ habits }: { habits: any[] }) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    if (!habits.length) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const today = new Date();
      const yearAgo = subYears(today, 1);
      const yearAgoStr = format(yearAgo, 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const days = eachDayOfInterval({ start: yearAgo, end: today });

      // ── Single bulk query for the entire year ──────────────────
      const allLogs = await db.habitLogs
        .where('date')
        .between(yearAgoStr, todayStr, true, true)
        .toArray();

      // Group logs by date for O(1) lookup
      const logsByDate = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
        logsByDate.get(log.date)!.push(log);
      }
      // ──────────────────────────────────────────────────────────

      const map: Record<string, number> = {};
      for (const day of days) {
        const ds = format(day, 'yyyy-MM-dd');
        const logs = logsByDate.get(ds) ?? [];
        const scheduled = habits.filter(h =>
          h.frequency === 'daily' ||
          (h.frequency === 'weekly' && (h.frequencyDays ?? []).includes(day.getDay()))
        );
        map[ds] = scheduled.length ? logs.filter(l => l.value >= 1).length / scheduled.length : 0;
      }
      setData(map);
      setLoading(false);
    })();
  }, [habits]);

  function colorFor(val: number) {
    if (val === 0) return 'rgba(255,255,255,0.04)';
    if (val < 0.25) return '#166534';
    if (val < 0.5) return '#16a34a';
    if (val < 0.75) return '#22c55e';
    return '#4ade80';
  }

  const today = new Date();
  const yearAgo = subYears(today, 1);
  const days = eachDayOfInterval({ start: yearAgo, end: today });

  // Build weeks grid
  const weeks: { date: string; value: number; dow: number }[][] = [];
  let week: { date: string; value: number; dow: number }[] = [];
  days.forEach((d, i) => {
    const ds = format(d, 'yyyy-MM-dd');
    week.push({ date: ds, value: data[ds] ?? 0, dow: d.getDay() });
    if (d.getDay() === 6 || i === days.length - 1) { weeks.push(week); week = []; }
  });

  // Month labels: find week index where month changes
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((wk, wi) => {
    const firstDay = wk[0];
    if (firstDay) {
      const d = new Date(firstDay.date + 'T00:00:00');
      if (wi === 0 || d.getDate() <= 7) {
        monthLabels.push({ label: MONTHS[d.getMonth()], col: wi });
      }
    }
  });

  if (loading) return <div className="h-40 flex items-center justify-center text-slate-500 text-sm animate-pulse">Loading year of data…</div>;

  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2 -mx-1">
        <svg
          width={weeks.length * STEP + 30}
          height={7 * STEP + 24}
          className="block"
        >
          {/* Month labels */}
          {monthLabels.map(({ label, col }) => (
            <text key={`${label}-${col}`} x={col * STEP + 30} y={10} fill="#475569" fontSize={10} fontFamily="Inter, sans-serif">
              {label}
            </text>
          ))}
          {/* Day-of-week labels */}
          {['M','W','F'].map((l, i) => (
            <text key={l} x={4} y={12 + (i * 2 + 1) * STEP} fill="#475569" fontSize={9} fontFamily="Inter, sans-serif" alignmentBaseline="middle">
              {l}
            </text>
          ))}
          {/* Cells */}
          {weeks.map((wk, wi) =>
            wk.map((day) => (
              <rect
                key={day.date}
                x={wi * STEP + 30}
                y={12 + day.dow * STEP}
                width={CELL}
                height={CELL}
                rx={3}
                fill={colorFor(day.value)}
                style={{ transition: 'fill 0.3s' }}
              >
                <title>{day.date}: {Math.round(day.value * 100)}% completion</title>
              </rect>
            ))
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
        ))}
        <span>More</span>
        <span className="ml-auto text-slate-600">Showing {days.length} days</span>
      </div>

      {/* Summary stats */}
      {Object.keys(data).length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Active Days', value: Object.values(data).filter(v => v > 0).length },
            { label: 'Perfect Days', value: Object.values(data).filter(v => v === 1).length },
            { label: 'Avg Rate', value: `${Math.round((Object.values(data).reduce((a, b) => a + b, 0) / Object.values(data).length) * 100)}%` },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center bg-white/3 border border-white/5">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-Habit Heatmap (26 weeks) ─────────────────────────────
function Heatmap({ logs }: { logs: Record<string, number> }) {
  const weeks = 26;
  const today = new Date();
  const startDate = subWeeks(today, weeks);
  const days = eachDayOfInterval({ start: startDate, end: today });
  const grid: { date: string; value: number }[][] = [];
  let week: { date: string; value: number }[] = [];
  days.forEach((d, i) => {
    const ds = format(d, 'yyyy-MM-dd');
    week.push({ date: ds, value: logs[ds] ?? 0 });
    if (d.getDay() === 6 || i === days.length - 1) { grid.push(week); week = []; }
  });
  function colorFor(val: number) {
    if (val === 0) return 'rgba(255,255,255,0.04)';
    if (val < 0.4) return 'rgba(99,102,241,0.3)';
    if (val < 0.7) return 'rgba(99,102,241,0.6)';
    return '#6366f1';
  }
  return (
    <div className="overflow-x-auto pb-2">
      <svg width={grid.length * 14} height={7 * 14}>
        {grid.map((wk, wi) =>
          wk.map((day) => (
            <rect key={day.date} x={wi * 14} y={day.date ? DAY_NAMES.indexOf(format(new Date(day.date + 'T00:00:00'), 'EEE') as any) * 14 : 0} width={11} height={11} rx={3} fill={colorFor(day.value)}>
              <title>{day.date}: {Math.round(day.value * 100)}%</title>
            </rect>
          ))
        )}
      </svg>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <span>Less</span>
        {[0, 0.3, 0.6, 1].map(v => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Weekly Radar ──────────────────────────────────────────────
function WeeklyRadar({ habits }: { habits: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const today = new Date();
      const week = DAY_NAMES.map((name, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - today.getDay() + i);
        return { day: name, date: format(d, 'yyyy-MM-dd') };
      });
      const rows = await Promise.all(week.map(async ({ day, date }) => {
        const logs = await db.habitLogs.where('date').equals(date).toArray();
        const scheduled = habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.frequencyDays ?? []).includes(new Date(date).getDay())));
        return { day, completion: scheduled.length ? Math.round((logs.length / scheduled.length) * 100) : 0 };
      }));
      setData(rows);
    })();
  }, [habits]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
        <Radar name="Completion %" dataKey="completion" stroke="#818cf8" fill="rgba(129,140,248,0.2)" strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── 30-day Area Trend ─────────────────────────────────────────
function TrendLine({ habits }: { habits: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
      const rows = await Promise.all(days.map(async date => {
        const logs = await db.habitLogs.where('date').equals(date).toArray();
        const scheduled = habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.frequencyDays ?? []).includes(new Date(date).getDay())));
        return { date: date.slice(5), completion: scheduled.length ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100) : 0 };
      }));
      setData(rows);
    })();
  }, [habits]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Completion']} />
        <Area type="monotone" dataKey="completion" stroke="#818cf8" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Task Throughput ───────────────────────────────────────────
function TaskThroughput({ tasks }: { tasks: any[] }) {
  const data = useMemo(() => {
    const weeks: Record<string, { created: number; completed: number }> = {};
    tasks.forEach(t => {
      const wk = format(startOfWeek(new Date(t.createdAt)), 'MM/dd');
      if (!weeks[wk]) weeks[wk] = { created: 0, completed: 0 };
      weeks[wk].created++;
      if (t.completed) weeks[wk].completed++;
    });
    return Object.entries(weeks).slice(-8).map(([week, v]) => ({ week, ...v }));
  }, [tasks]);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="created" name="Created" fill="rgba(129,140,248,0.5)" radius={[4,4,0,0]} />
        <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Best/Worst Day ────────────────────────────────────────────
function BestWorstDay({ habits }: { habits: any[] }) {
  const [dayData, setDayData] = useState<{ day: string; pct: number }[]>([]);
  useEffect(() => {
    (async () => {
      const days90 = Array.from({ length: 90 }, (_, i) => subDays(new Date(), i));
      const counts: Record<number, { done: number; total: number }> = {};
      for (const d of days90) {
        const dow = getDay(d);
        if (!counts[dow]) counts[dow] = { done: 0, total: 0 };
        const date = format(d, 'yyyy-MM-dd');
        const scheduled = habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.frequencyDays ?? []).includes(dow)));
        if (!scheduled.length) continue;
        const logs = await db.habitLogs.where('date').equals(date).toArray();
        counts[dow].done += logs.filter(l => l.value >= 1).length;
        counts[dow].total += scheduled.length;
      }
      setDayData(DAY_NAMES.map((day, i) => ({ day, pct: counts[i]?.total ? Math.round((counts[i].done / counts[i].total) * 100) : 0 })));
    })();
  }, [habits]);
  const best = dayData.reduce((a, b) => b.pct > a.pct ? b : a, { day: '—', pct: 0 });
  const worst = dayData.reduce((a, b) => b.pct < a.pct ? b : a, { day: '—', pct: 100 });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-xs text-slate-400 mb-1">Best Day</p>
          <p className="font-bold text-white">{best.day}</p>
          <p className="text-emerald-400 text-sm font-bold">{best.pct}%</p>
        </div>
        <div className="rounded-xl p-4 text-center border border-red-500/20 bg-red-500/5">
          <div className="text-2xl mb-1">⚠️</div>
          <p className="text-xs text-slate-400 mb-1">Weakest Day</p>
          <p className="font-bold text-white">{worst.day}</p>
          <p className="text-orange-400 text-sm font-bold">{worst.pct}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={dayData}>
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Completion']} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {dayData.map((d, i) => (
              <Cell key={i} fill={d.day === best.day ? '#10b981' : d.day === worst.day ? '#ef4444' : 'rgba(129,140,248,0.6)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Habit-Mood Correlation ────────────────────────────────────
function HabitMoodCorrelation({ habits, moods }: { habits: any[]; moods: any[] }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
      const rows = await Promise.all(days.map(async date => {
        const logs = await db.habitLogs.where('date').equals(date).toArray();
        const scheduled = habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.frequencyDays ?? []).includes(new Date(date).getDay())));
        const pct = scheduled.length ? Math.round((logs.filter(l => l.value >= 1).length / scheduled.length) * 100) : 0;
        const moodLog = moods.find(m => m.date === date);
        return { date: date.slice(5), completion: pct, mood: moodLog ? moodLog.score : null };
      }));
      setData(rows);
    })();
  }, [habits, moods]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
        <YAxis yAxisId="right" orientation="right" domain={[1, 5]} tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="completion" name="Completion %" fill="rgba(129,140,248,0.5)" radius={[4,4,0,0]} />
        <Line yAxisId="right" type="monotone" dataKey="mood" name="Mood (1–5)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function StatCard({ icon, label, value, sub, colorClass = 'kpi-card-indigo', iconColor = '#818cf8' }: { icon: string; label: string; value: string | number; sub?: string; colorClass?: string; iconColor?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn("glass-card rounded-2xl p-6 text-center relative overflow-hidden group", colorClass)}
    >
      <span className="absolute -right-2 -bottom-2 text-6xl opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-black text-white tracking-tight mb-1">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider opacity-60">{sub}</p>}
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <span className="text-4xl mb-3">📊</span>
      <p className="text-sm">Not enough data yet.</p>
      <p className="text-xs mt-1">Keep logging your habits to unlock insights.</p>
    </div>
  );
}

// ─── Dynamic Insights ──────────────────────────────────────────
function DynamicInsights({ habits }: { habits: any[] }) {
  const [insights, setInsights] = useState<{ icon: string; title: string; body: string }[]>([]);

  useEffect(() => {
    if (habits.length === 0) return;
    
    const newInsights: { icon: string; title: string; body: string }[] = [];
    
    // Insight 1: Longest active streak
    const bestCurrent = [...habits].sort((a, b) => b.streak.current - a.streak.current)[0];
    if (bestCurrent && bestCurrent.streak.current >= 3) {
      newInsights.push({
        icon: '🔥',
        title: 'Streak Master',
        body: `You're on a ${bestCurrent.streak.current}-day streak for "${bestCurrent.name}". Keep the momentum going!`,
      });
    } else {
      newInsights.push({
        icon: '🌱',
        title: 'Fresh Start',
        body: 'Every day is a new opportunity. Start building your streaks today!',
      });
    }

    // Insight 2: Overall consistency
    const avgComp = Math.round((habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100);
    if (avgComp > 80) {
      newInsights.push({
        icon: '⭐',
        title: 'Highly Consistent',
        body: `Your 30-day completion rate is an impressive ${avgComp}%. You've built solid routines.`,
      });
    } else if (avgComp > 40) {
      newInsights.push({
        icon: '📈',
        title: 'Steady Progress',
        body: `Your ${avgComp}% completion rate shows good effort. Focus on your hardest habits next.`,
      });
    } else {
       newInsights.push({
        icon: '🎯',
        title: 'Room to Grow',
        body: `Focus on completing just one core habit daily to build momentum.`,
      });
    }

    // Insight 3: Best Category
    const catCounts: Record<string, number> = {};
    habits.forEach(h => {
      catCounts[h.category] = (catCounts[h.category] || 0) + h.completionRate30Days;
    });
    const bestCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestCat && bestCat[1] > 0) {
      newInsights.push({
        icon: '🏆',
        title: `${bestCat[0]} Champion`,
        body: `You've been most consistent with your ${bestCat[0]} habits lately.`,
      });
    } else {
       newInsights.push({
        icon: '⚖️',
        title: 'Find Balance',
        body: `Try to spread your focus evenly across different areas of your life.`,
      });
    }

    setInsights(newInsights);
  }, [habits]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {insights.map(c => (
        <div key={c.title} className="glass-card rounded-2xl p-5 border-l-4 border-l-brand-500/40">
          <span className="text-2xl">{c.icon}</span>
          <h4 className="text-sm font-semibold text-white mt-3 mb-1">{c.title}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Analytics Page ────────────────────────────────────────────
export function AnalyticsPage() {
  const { habits, loadHabits } = useHabitStore();
  const { tasks, loadTasks } = useTaskStore();
  const { moods, loadMoods } = useMoodStore();
  const [tab, setTab] = useState<TabType>('Overview');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useEffect(() => { loadHabits(); loadTasks(); loadMoods(); }, [loadHabits, loadTasks, loadMoods]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? habits[0] ?? null;

  useEffect(() => {
    if (!selectedHabit) return;
    (async () => {
      const logs = await db.habitLogs.where('habitId').equals(selectedHabit.id).toArray();
      const map: Record<string, number> = {};
      logs.forEach(l => {
        map[l.date] = selectedHabit.type === 'boolean' ? (l.value >= 1 ? 1 : 0) : Math.min(l.value / selectedHabit.targetValue, 1);
      });
      setHeatmapData(map);
    })();
  }, [selectedHabit]);

  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak.best)) : 0;
  const avgCompletion = habits.length ? Math.round((habits.reduce((s, h) => s + h.completionRate30Days, 0) / habits.length) * 100) : 0;
  const tasksDone = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Analytics</p>
          <h1 className="text-3xl font-bold text-white">Your Progress Report</h1>
          <p className="text-slate-400 text-sm mt-1">Track, analyze, and improve your habits over time.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl w-fit border border-white/5">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-brand-500/20 text-brand-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="🔥" label="Active Habits" value={habits.filter(h => !h.archived).length} sub="tracking now" colorClass="kpi-card-amber" />
            <StatCard icon="🏆" label="Best Streak" value={bestStreak ? `${bestStreak}d` : '—'} sub="all time" colorClass="kpi-card-indigo" />
            <StatCard icon="✅" label="Tasks Done" value={tasksDone} sub={`of ${tasks.length} total`} colorClass="kpi-card-emerald" />
            <StatCard icon="📈" label="30d Avg" value={avgCompletion ? `${avgCompletion}%` : '—'} sub="completion rate" colorClass="kpi-card-indigo" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Weekly Pattern" subtitle="Completion rate by day of week">
              <WeeklyRadar habits={habits} />
            </ChartCard>
            <ChartCard title="Best & Weakest Days" subtitle="Based on last 90 days of data">
              {habits.length > 0 ? <BestWorstDay habits={habits} /> : <EmptyChart />}
            </ChartCard>
          </div>

          <ChartCard title="30-Day Completion Trend" subtitle="Daily habit completion rate over the last month">
            {habits.length > 0 ? <TrendLine habits={habits} /> : <EmptyChart />}
          </ChartCard>
        </div>
      )}

      {/* ── Insights ── */}
      {tab === 'Insights' && (
        <div className="space-y-6">
          <ChartCard
            title="Habit Completion vs. Daily Mood"
            subtitle="Discover how keeping up with your habits affects your energy, and vice versa (30 days)"
          >
            {habits.length > 0 ? <HabitMoodCorrelation habits={habits} moods={moods} /> : <EmptyChart />}
          </ChartCard>

          {/* Dynamic insight callouts */}
          <DynamicInsights habits={habits} />
        </div>
      )}

      {/* ── Per Habit ── */}
      {tab === 'Per Habit' && (
        <div className="space-y-6">
          {habits.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              {/* Habit selector pills */}
              <div className="flex flex-wrap gap-2">
                {habits.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selectedHabit?.id === h.id
                        ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                        : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span>{h.icon}</span> {h.name}
                  </button>
                ))}
              </div>

              {selectedHabit && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon="🔥" label="Current Streak" value={`${selectedHabit.streak.current}d`} colorClass="kpi-card-amber" />
                    <StatCard icon="🏆" label="Best Streak" value={`${selectedHabit.streak.best}d`} colorClass="kpi-card-indigo" />
                    <StatCard icon="📈" label="30d Completion" value={`${Math.round(selectedHabit.completionRate30Days * 100)}%`} colorClass="kpi-card-indigo" />
                    <StatCard icon="📅" label="Since" value={selectedHabit.startDate} colorClass="kpi-card-emerald" />
                  </div>

                  <ChartCard title={`${selectedHabit.icon} ${selectedHabit.name} — Completion Heatmap`} subtitle="Last 26 weeks">
                    <Heatmap logs={heatmapData} />
                  </ChartCard>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tasks ── */}
      {tab === 'Tasks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total Tasks" value={tasks.length} colorClass="kpi-card-indigo" />
            <StatCard icon="✅" label="Completed" value={tasksDone} colorClass="kpi-card-emerald" />
            <StatCard icon="⏳" label="Pending" value={tasks.filter(t => !t.completed).length} colorClass="kpi-card-amber" />
            <StatCard icon="🔴" label="Urgent" value={tasks.filter(t => t.priority === 0 && !t.completed).length} colorClass="kpi-card-rose" />
          </div>
          <ChartCard title="Task Throughput" subtitle="Created vs. completed per week (last 8 weeks)">
            {tasks.length > 0 ? <TaskThroughput tasks={tasks} /> : <EmptyChart />}
          </ChartCard>
        </div>
      )}

      {/* ── Heatmap ── */}
      {tab === 'Heatmap' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">🟩 365-Day Activity Heatmap</h3>
              <p className="text-xs text-slate-400 mt-1">Your overall habit completion across the entire last year, just like GitHub.</p>
            </div>
            {habits.length > 0 ? <YearlyHeatmap habits={habits} /> : <EmptyChart />}
          </div>
        </div>
      )}
    </div>
  );
}
