import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { format, startOfWeek } from 'date-fns';
import type { Task } from '../../types';
import {
  StatCard,
  ChartCard,
  EmptyChart,
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
} from './shared';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface TaskAnalyticsProps {
  tasks: Task[];
}

// ─── Task Throughput Chart ────────────────────────────────────
function TaskThroughput({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const weeks: Record<string, { created: number; completed: number }> = {};
    const ensureWeek = (wk: string) => {
      if (!weeks[wk]) weeks[wk] = { created: 0, completed: 0 };
    };
    tasks.forEach(t => {
      const createdWk = format(startOfWeek(new Date(t.createdAt)), 'MM/dd');
      ensureWeek(createdWk);
      weeks[createdWk].created++;
      if (t.completed && t.completedAt) {
        const completedWk = format(startOfWeek(new Date(t.completedAt)), 'MM/dd');
        ensureWeek(completedWk);
        weeks[completedWk].completed++;
      }
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, v]) => ({ week, ...v }));
  }, [tasks]);

  return (
    <div style={{ width: '100%', height: 240, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar
            dataKey="created"
            name="Created"
            fill="rgba(129,140,248,0.5)"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Task Analytics Tab ──────────────────────────────────
export function TaskAnalyticsTab({ tasks }: TaskAnalyticsProps) {
  const tasksDone = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const urgentTasks = tasks.filter(t => t.priority === 0 && !t.completed).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="📋"
          label="Total Tasks"
          value={tasks.length}
          colorClass="kpi-card-indigo"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={tasksDone}
          colorClass="kpi-card-emerald"
        />
        <StatCard
          icon="⏳"
          label="Pending"
          value={pendingTasks}
          colorClass="kpi-card-amber"
        />
        <StatCard
          icon="🔴"
          label="Urgent"
          value={urgentTasks}
          colorClass="kpi-card-rose"
        />
      </div>

      <ChartCard
        title="Task Throughput"
        subtitle="Created vs. completed per week (last 8 weeks)"
      >
        <WidgetErrorBoundary title="Task Velocity & Throughput">
          {tasks.length > 0 ? <TaskThroughput tasks={tasks} /> : <EmptyChart message="No task velocity data yet" sub="Create and complete daily tasks to track throughput." />}
        </WidgetErrorBoundary>
      </ChartCard>
    </div>
  );
}
