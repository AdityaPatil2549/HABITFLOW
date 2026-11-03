import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, Folder, Clock } from 'lucide-react';
import type { Task, Priority, Project } from '../../../types';
import { format, addDays } from 'date-fns';
import { soundService } from '../../../services/soundService';
import { cn } from '../../../lib/utils';

export interface TaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'order'>, taskId?: string) => Promise<void>;
  initialTask?: Task | null;
  projects: Project[];
}

const PRIORITIES: { id: Priority; label: string; colorClass: string }[] = [
  { id: 0, label: 'Urgent', colorClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { id: 1, label: 'High', colorClass: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { id: 2, label: 'Normal', colorClass: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 3, label: 'Low', colorClass: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
];

export function TaskEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects,
}: TaskEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(2);
  const [dueDate, setDueDate] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority ?? 2);
      setDueDate(initialTask.dueDate || '');
      setProjectId(initialTask.projectId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority(2);
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setProjectId('');
    }
  }, [initialTask, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          projectId: projectId || undefined,
          labels: initialTask?.labels || [],
          recurring: initialTask?.recurring || 'none',
          completed: initialTask?.completed || false,
        },
        initialTask?.id
      );
      soundService.playTick();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#0d1017] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="task-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, links, or notes (optional)..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer',
                    priority === p.id
                      ? p.colorClass
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                aria-label="Select project"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">No Project</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 mr-1">Quick:</span>
            <button
              type="button"
              onClick={() => setDueDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] cursor-pointer"
            >
              +1 Week
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {initialTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default TaskEditorModal;
