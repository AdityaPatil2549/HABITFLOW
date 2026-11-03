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
  0: { label: 'Urgent', color: '#f43f5e', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.25)] font-semibold' },
  1: { label: 'High', color: '#fb923c', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30 shadow-[0_0_10px_rgba(251,146,60,0.2)] font-semibold' },
  2: { label: 'Normal', color: '#60a5fa', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-medium' },
  3: { label: 'Low', color: '#94a3b8', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30 font-medium' },
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
        'group relative flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none',
        task.completed
          ? 'bg-emerald-950/[0.14] border-emerald-500/25 text-slate-300 backdrop-blur-xl'
          : 'glass-panel-interactive text-slate-100 hover:border-emerald-500/30'
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
            'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40 active:scale-90',
            task.completed
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'border border-white/20 hover:border-emerald-400/50 bg-white/[0.04] hover:bg-white/[0.08]'
          )}
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 20 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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
            task.completed ? 'text-slate-400 line-through decoration-emerald-500/50' : 'text-slate-100 group-hover:text-emerald-300'
          )}
        >
          {task.title}
        </span>
      </div>

      {/* ── Right Side: Project, Due Date, Priority, Actions ──── */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs">
        {/* Project Tag */}
        {projectName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] text-slate-300 border border-white/[0.08]">
            <Folder className="w-3 h-3 text-slate-400" />
            <span>{projectName}</span>
          </span>
        )}

        {/* Due Date */}
        {dueDateInfo && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border font-medium',
              dueDateInfo.isOverdue
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : dueDateInfo.isDueToday
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
            )}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueDateInfo.formatted}</span>
          </span>
        )}

        {/* Priority Badge */}
        <span
          className={cn(
            'hidden xs:inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border',
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl bg-[#0c0e17]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl z-50 p-1.5 text-xs">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </button>
                <div className="h-px bg-white/[0.08] my-1" />
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    await onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl transition-colors text-left font-semibold"
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
