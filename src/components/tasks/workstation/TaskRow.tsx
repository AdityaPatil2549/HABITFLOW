import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Folder,
} from 'lucide-react';
import type { Task, Priority } from '../../../types';
import { soundService } from '../../../services/soundService';
import { format, isToday, isPast, parseISO, endOfDay } from 'date-fns';
import { cn } from '../../../lib/utils';

export interface TaskRowProps {
  task: Task;
  projectName?: string;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_MAP: Record<Priority, { label: string; color: string; badge: string }> = {
  0: { label: 'Urgent', color: '#f43f5e', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold' },
  1: { label: 'High', color: '#fb923c', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30 font-semibold' },
  2: { label: 'Normal', color: '#60a5fa', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-medium' },
  3: { label: 'Low', color: '#94a3b8', badge: 'bg-[var(--sf-overlay)] text-[var(--tx-muted)] border-[var(--border-default)] font-medium' },
};

export function TaskRow({
  task,
  projectName,
  onToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const priority = PRIORITY_MAP[task.priority ?? 2];

  // Due date calculation
  const dueDateInfo = React.useMemo(() => {
    if (!task.dueDate) return null;
    try {
      const parsed = parseISO(task.dueDate);
      const isDateOnly = !task.dueDate.includes('T');
      const targetDate = isDateOnly ? endOfDay(parsed) : parsed;
      const isDueToday = isToday(parsed);
      const isOverdue = !task.completed && isPast(targetDate) && !isDueToday;
      const formatted = isDueToday ? 'Today' : format(parsed, 'MMM d');
      return { formatted, isOverdue, isDueToday };
    } catch {
      return { formatted: task.dueDate, isOverdue: false, isDueToday: false };
    }
  }, [task.dueDate, task.completed]);

  const handleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    if (!task.completed) {
      soundService.playTick();
    } else {
      soundService.playUncheck();
    }
    try {
      await onToggle(task.id, task.completed);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        'group relative flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-xl border transition-colors duration-150 cursor-pointer select-none',
        task.completed
          ? 'bg-[var(--accent-subtle)] border-[var(--accent)]/25 text-[var(--tx-secondary)]'
          : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--tx-primary)]'
      )}
    >
      {/* ── Left Side: Checkbox + Title + Project ───────────────── */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-90',
            task.completed
              ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
              : 'border border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--sf-overlay)]'
          )}
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
              <motion.div
                key="check"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Task Title */}
        <span
          className={cn(
            'text-sm font-semibold tracking-tight truncate transition-colors',
            task.completed ? 'text-[var(--tx-muted)] line-through decoration-[var(--accent)]/50' : 'text-[var(--tx-primary)] group-hover:text-[var(--accent-ink)]'
          )}
        >
          {task.title}
        </span>
      </div>

      {/* ── Right Side: Project, Due Date, Priority, Actions ──── */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs">
        {/* Project Tag */}
        {projectName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">
            <Folder className="w-3 h-3 text-[var(--tx-muted)]" />
            <span>{projectName}</span>
          </span>
        )}

        {/* Due Date */}
        {dueDateInfo && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border font-medium',
              dueDateInfo.isOverdue
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : dueDateInfo.isDueToday
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border-[var(--border-default)]'
            )}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueDateInfo.formatted}</span>
          </span>
        )}

        {/* Priority Badge */}
        <span
          className={cn(
            'hidden xs:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
            priority.badge
          )}
        >
          {priority.label}
        </span>

        {/* Actions Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            aria-label="Task options"
            className="p-1.5 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-strong)] shadow-xl z-50 p-1.5 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] rounded-lg transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[var(--tx-muted)]" />
                  <span>Edit</span>
                </button>
                <div className="h-px bg-[var(--border-default)] my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors text-left font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskRow;
