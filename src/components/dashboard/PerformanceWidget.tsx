import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Target, GripHorizontal } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { habitService } from '../../services/habitService';
import { db } from '../../db';
import { format, subDays } from 'date-fns';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { Scroll3DReveal } from '../ui/Scroll3DReveal';

async function computeWeekChart(
  habits: any[]
): Promise<{ day: string; pct: number; date: string }[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE') };
  });

  const startDate = days[0].date;
  const endDate = days[6].date;
  
  // Single DB query for all logs in the date range
  const allLogs = await db.habitLogs.where('date').between(startDate, endDate, true, true).toArray();

  return days.map(({ date, day }) => {
    const scheduled = habits.filter(h => habitService.isScheduledForDate(h, date));
    if (!scheduled.length) return { day, date, pct: 0 };
    
    const logsForDate = allLogs.filter(l => l.date === date);
    const done = logsForDate.filter(l => {
      const habit = scheduled.find(h => h.id === l.habitId);
      if (!habit) return false;
      if (habit.type === 'boolean') return l.value >= 1;
      return l.value >= habit.targetValue;
    }).length;
    
    return { day, date, pct: Math.round((done / scheduled.length) * 100) };
  });
}

export function PerformanceWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const { habits } = useHabitStore();
  const [weekChart, setWeekChart] = useState<{ day: string; pct: number; date: string }[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

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
    return () => {
      mounted = false;
    };
  }, [habits]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const recent = weekChart.slice(4);
  const prev = weekChart.slice(0, 4);
  const recentAvg = recent.length ? recent.reduce((s, d) => s + d.pct, 0) / recent.length : 0;
  const prevAvg = prev.length ? prev.reduce((s, d) => s + d.pct, 0) / prev.length : 0;
  const trendDelta = Math.round(recentAvg - prevAvg);

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

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="h-full relative group widget-container">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <Scroll3DReveal delay={0.2} className="h-full">
        <TiltCard borderGlow className="h-full">
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
                  <path d={areaPath} fill="url(#area-grad-real)" />
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="url(#line-grad-real)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
  );
}
