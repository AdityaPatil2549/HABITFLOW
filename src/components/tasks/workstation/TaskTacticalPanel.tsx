import React from 'react';
import {
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Zap,
  Target,
  ArrowRight,
  Plus,
  Flame,
  Check,
} from 'lucide-react';
import type { Task, Priority } from '../../../types';
import { soundService } from '../../../services/soundService';

interface TaskTacticalPanelProps {
  tasks: Task[];
  selectedPriority: Priority | 'all';
  onSelectPriority: (p: Priority | 'all') => void;
  onOpenNewTask: () => void;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onEditTask: (task: Task) => void;
}

export function TaskTacticalPanel({
  tasks,
  selectedPriority,
  onSelectPriority,
  onOpenNewTask,
  onToggleTask,
  onEditTask,
}: TaskTacticalPanelProps) {
  // Statistics calculations
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const velocity = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Priority distribution counts for pending tasks
  const pCounts: Record<Priority, number> = {
    0: tasks.filter(t => !t.completed && t.priority === 0).length,
    1: tasks.filter(t => !t.completed && t.priority === 1).length,
    2: tasks.filter(t => !t.completed && (t.priority === 2 || t.priority === undefined)).length,
    3: tasks.filter(t => !t.completed && t.priority === 3).length,
  };

  // Find next highest-priority pending task
  const nextTask = tasks
    .filter(t => !t.completed)
    .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2))[0];

  const priorityMeta = [
    { priority: 0 as Priority, label: 'Urgent (P1)', color: '#f43f5e', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
    { priority: 1 as Priority, label: 'High Priority (P2)', color: '#fb923c', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
    { priority: 2 as Priority, label: 'Normal / Daily (P3)', color: '#60a5fa', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
    { priority: 3 as Priority, label: 'Low / Someday (P4)', color: '#94a3b8', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25' },
  ];

  return (
    <div className="card-raised p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] space-y-6 sticky top-20">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)] font-semibold block">
            Tactical Matrix
          </span>
          <h2 className="text-sm font-bold text-[var(--tx-primary)] mt-0.5">
            Action Velocity & Focus
          </h2>
        </div>
        <button
          onClick={onOpenNewTask}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* ── Daily Velocity Gauge ── */}
      <div className="p-4 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--tx-primary)] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-ink)]" />
            Execution Velocity
          </span>
          <span className="font-data text-xs font-bold text-[var(--tx-primary)]">
            {completed}/{total} completed ({velocity}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--sf-base)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 rounded-full"
            style={{ width: `${velocity}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--tx-muted)]">
          {pending === 0 && total > 0
            ? 'All action items cleared. You are completely caught up!'
            : `${pending} remaining tasks requiring execution today.`}
        </p>
      </div>

      {/* ── Priority Distribution Matrix ── */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--tx-muted)] font-semibold block mb-1">
          Priority Matrix (Click to Filter)
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {priorityMeta.map(item => {
            const isSelected = selectedPriority === item.priority;
            const count = pCounts[item.priority];
            return (
              <button
                key={item.priority}
                onClick={() => {
                  soundService.playTick();
                  onSelectPriority(isSelected ? 'all' : item.priority);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-[var(--tx-primary)]">{item.label}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${item.bg}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Focus Spotlight Next Task ── */}
      {nextTask && (
        <div className="p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--accent-ink)] font-bold">
              <Zap className="w-3.5 h-3.5" /> Next Tactical Action
            </span>
            <button
              onClick={() => onEditTask(nextTask)}
              className="text-[10px] font-mono text-[var(--tx-muted)] hover:text-[var(--tx-primary)] underline cursor-pointer"
            >
              Open Edit
            </button>
          </div>

          <p className="text-xs font-bold text-[var(--tx-primary)] leading-snug line-clamp-2">
            {nextTask.title}
          </p>

          <button
            onClick={() => {
              soundService.playTick();
              onToggleTask(nextTask.id, false);
            }}
            className="w-full btn-primary flex items-center justify-center gap-1.5 py-2 text-xs font-bold"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Complete This Action</span>
          </button>
        </div>
      )}
    </div>
  );
}
