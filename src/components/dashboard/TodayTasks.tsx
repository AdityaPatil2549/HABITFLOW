import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckSquare, Plus, ArrowRight } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { soundService } from '@/services/soundService';

export function TodayTasks() {
  const { tasks, addTask, completeTask, uncompleteTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayTasks = tasks
    .filter(t => !t.completed || t.dueDate === todayStr)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order)
    .slice(0, 5);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addTask({
        title: trimmed,
        completed: false,
        priority: 1,
        dueDate: todayStr,
        labels: [],
        recurring: 'none',
      });
      setTitle('');
      soundService.playTick();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="Today's Tasks" className="card-raised p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-ink)]">
            <CheckSquare size={13} />
          </div>
          <span className="font-label-caps">Today's Tasks</span>
        </div>
        <Link
          to="/hub/tasks"
          className="text-xs font-semibold text-[var(--accent-ink)] hover:underline inline-flex items-center gap-1"
        >
          <span>All</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Quick Inline Task Add */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add tactical task…"
          aria-label="New task title"
          className="input flex-1 py-1.5 px-3 text-xs"
        />
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          aria-label="Add task"
          className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Task Checklist */}
      {todayTasks.length === 0 ? (
        <p className="text-xs text-[var(--tx-muted)] py-2">
          No active tasks in today's queue.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {todayTasks.map(task => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => {
                  if (task.completed) {
                    soundService.playUncheck();
                    uncompleteTask(task.id);
                  } else {
                    soundService.playTick();
                    completeTask(task.id);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-left transition-all duration-150 cursor-pointer hover:shadow-sm hover:translate-x-0.5',
                  task.completed && 'opacity-65'
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors duration-150',
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                      : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                  )}
                >
                  {task.completed && <Check size={11} strokeWidth={3} />}
                </span>

                <span
                  className={cn(
                    'text-xs font-medium truncate flex-1',
                    task.completed
                      ? 'line-through text-[var(--tx-muted)]'
                      : 'text-[var(--tx-primary)]'
                  )}
                >
                  {task.title}
                </span>

                {task.priority && task.priority > 0 && !task.completed && (
                  <span
                    className={cn(
                      'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                      task.priority === 1 && 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
                      task.priority === 2 && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                      task.priority === 3 && 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    )}
                  >
                    P{task.priority}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
