import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Folder,
  AlertCircle,
} from 'lucide-react';
import type { Task, Priority } from '../../../types';
import { soundService } from '../../../services/soundService';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { cn } from '../../../lib/utils';

export interface TaskRowProps {
  task: Task;
  projectName?: string;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_MAP: Record<Priority, { label: string; color: string; badge: string }> = {
  0: { label: 'Urgent', color: '#f43f5e', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  1: { label: 'High', color: '#fb923c', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  2: { label: 'Normal', color: '#60a5fa', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  3: { label: 'Low', color: '#94a3b8', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
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
      const isDueToday = isToday(parsed);
      const isOverdue = !task.completed && isPast(parsed) && !isDueToday;
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
        'group relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 cursor-pointer select-none',
        task.completed
          ? 'bg-emerald-950/[0.10] border-emerald-500/15 text-slate-400'
          : 'bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/[0.12] text-slate-100'
      )}
    >
      {/* ── Left Side: Checkbox + Title + Project ───────────────── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
          className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40',
            task.completed
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'border border-slate-600/70 hover:border-slate-300 bg-white/[0.02]'
          )}
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Task Title */}
        <span
          className={cn(
            'text-sm font-medium tracking-tight truncate transition-colors',
            task.completed ? 'text-slate-500 line-through decoration-emerald-500/40' : 'text-slate-100'
          )}
        >
          {task.title}
        </span>
      </div>

      {/* ── Right Side: Project, Due Date, Priority, Actions ──── */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs">
        {/* Project Tag */}
        {projectName && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.03] text-slate-400 border border-white/[0.05]">
            <Folder className="w-3 h-3 text-slate-500" />
            <span>{projectName}</span>
          </span>
        )}

        {/* Due Date */}
        {dueDateInfo && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border',
              dueDateInfo.isOverdue
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : dueDateInfo.isDueToday
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.05]'
            )}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueDateInfo.formatted}</span>
          </span>
        )}

        {/* Priority Badge */}
        <span
          className={cn(
            'hidden xs:inline-flex px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border',
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
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 py-1 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-medium"
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
