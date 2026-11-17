import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
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
  { id: 3, label: 'Low', colorClass: 'text-[var(--tx-muted)] border-[var(--border-strong)] bg-[var(--sf-overlay)]' },
];

export function TaskEditorModal(props: TaskEditorModalProps) {
  if (!props.isOpen) return null;
  return <TaskEditorModalInner key={props.initialTask?.id ?? 'new'} {...props} />;
}

function TaskEditorModalInner({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects,
}: TaskEditorModalProps) {
  const [title, setTitle] = useState(() => initialTask?.title ?? '');
  const [description, setDescription] = useState(() => initialTask?.description || '');
  const [priority, setPriority] = useState<Priority>(() => initialTask?.priority ?? 2);
  const [dueDate, setDueDate] = useState<string>(() =>
    initialTask ? initialTask.dueDate || '' : format(new Date(), 'yyyy-MM-dd')
  );
  const [projectId, setProjectId] = useState<string>(() => initialTask?.projectId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

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
        transition={{ duration: 0.14 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-[var(--sf-raised)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-4 sm:p-6 mx-3 sm:mx-0 max-h-[88vh] overflow-y-auto z-10"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
          <h2 className="text-sm font-semibold text-[var(--tx-primary)]">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task editor"
            className="p-1 rounded-lg text-[var(--tx-muted)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
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
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, links, or notes (optional)..."
              rows={3}
              className="input py-2 text-xs resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
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
                      : 'bg-[var(--sf-overlay)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input px-3 py-2 text-xs"
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--tx-secondary)] mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                aria-label="Select project"
                className="input px-3 py-2 text-xs cursor-pointer"
              >
                <option value="">No Project</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-[var(--tx-muted)] mr-1">Quick:</span>
            <button
              type="button"
              onClick={() => setDueDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-2.5 py-1 rounded text-xs font-mono bg-[var(--sf-overlay)] hover:bg-[var(--sf-dim)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border border-[var(--border-default)] cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="px-2.5 py-1 rounded text-xs font-mono bg-[var(--sf-overlay)] hover:bg-[var(--sf-dim)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border border-[var(--border-default)] cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
              className="px-2.5 py-1 rounded text-xs font-mono bg-[var(--sf-overlay)] hover:bg-[var(--sf-dim)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border border-[var(--border-default)] cursor-pointer"
            >
              +1 Week
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isSubmitting || !title.trim()}
            className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {initialTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default TaskEditorModal;
