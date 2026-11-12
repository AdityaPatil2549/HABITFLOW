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
          <CheckSquare size={15} className="text-[var(--accent-ink)]" />
          <span className="font-label-caps">Today's Tasks</span>
        </div>
        <Link
          to="/hub/tasks"
          className="text-xs font-medium text-[var(--accent-ink)] hover:underline inline-flex items-center gap-1"
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
          className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center shrink-0"
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
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[var(--sf-overlay)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-left transition-colors cursor-pointer"
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    task.completed
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]'
                      : 'border-[var(--border-strong)]'
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
