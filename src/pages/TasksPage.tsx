import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Trash2, ChevronDown, ChevronRight, Edit2, Calendar, RotateCcw, Tag, Zap, Clock, Target, Timer } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useFocusStore } from '../store/focusStore';
import type { Task, Priority } from '../types';
import { format, isToday, isPast } from 'date-fns';
import { taskSchema } from '../lib/validations';
import { cn } from '../lib/utils';

const PRIORITY_CONFIG = [
  { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔴' },
  { label: 'High',   color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '🟠' },
  { label: 'Normal', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)', icon: '🔵' },
  { label: 'Low',    color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', icon: '⚪' },
];
const VIEWS = ['Today', 'Upcoming', 'All', 'Completed'] as const;
type ViewType = (typeof VIEWS)[number];

function TaskForm({ onClose, initialTask }: { onClose: () => void; initialTask?: Task }) {
  const { addTask, updateTask } = useTaskStore();
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [desc, setDesc] = useState(initialTask?.description ?? '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<Priority>(initialTask?.priority ?? 2);
  const [recurring, setRecurring] = useState<Task['recurring']>(initialTask?.recurring ?? 'none');
  const [label, setLabel] = useState(initialTask?.labels?.[0] ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const parsed = taskSchema.safeParse({ title: title.trim(), description: desc, priority, dueDate: dueDate || undefined, labels: label ? [label] : [], recurring, completed: initialTask?.completed ?? false, parentId: initialTask?.parentId, projectId: initialTask?.projectId });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (initialTask) await updateTask(initialTask.id, parsed.data);
    else await addTask(parsed.data);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
      
      {/* Title */}
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-base font-medium outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
        placeholder="What needs to be done?"
        value={title} onChange={e => setTitle(e.target.value)}
        autoFocus required
      />

      {/* Description */}
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-500/50 transition-all resize-none"
        placeholder="Add details (optional)…" rows={2}
        value={desc} onChange={e => setDesc(e.target.value)}
      />

      {/* Priority pills */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Priority</p>
        <div className="flex gap-2">
          {PRIORITY_CONFIG.map((p, i) => (
            <button key={i} type="button" onClick={() => setPriority(i as Priority)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${priority === i ? 'scale-105' : 'opacity-50'}`}
              style={priority === i ? { background: p.bg, borderColor: p.border, color: p.color } : { borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}
            >{p.icon} {p.label}</button>
          ))}
        </div>
      </div>

      {/* Date + Recurring */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Due Date</p>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Repeat</p>
          <select value={recurring} onChange={e => setRecurring(e.target.value as Task['recurring'])}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all">
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Label */}
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-500/50 transition-all"
        placeholder="Label (e.g. Work, Study, Health)…"
        value={label} onChange={e => setLabel(e.target.value)}
      />

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 20px rgba(var(--brand-500-rgb),0.3)' }}>
          {initialTask ? '✓ Save Changes' : '+ Add Task'}
        </button>
      </div>
    </form>
  );
}

// ── Skeleton shimmer ───────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-white/8 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-white/8 rounded-full w-2/3" />
          <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
        </div>
        <div className="w-14 h-6 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

function TaskItem({ task, depth = 0 }: { task: Task; depth?: number }) {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const { startFocus } = useFocusStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const subtasks = tasks.filter(t => t.parentId === task.id);
  const pc = PRIORITY_CONFIG[task.priority];
  const isOverdue = !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  if (editing) return (
    <motion.div layout className={cn('rounded-2xl p-4 glass-card')} style={{ marginLeft: depth > 0 ? `${depth * 1.5}rem` : 0, borderLeft: `3px solid ${pc.color}` }}>
      <TaskForm initialTask={task} onClose={() => setEditing(false)} />
    </motion.div>
  );

  return (
    <div className={cn('relative')} style={{ marginLeft: depth > 0 ? `${depth * 1.5}rem` : 0 }}>
      {/* Subtask connector line */}
      {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 flex items-center" style={{ width: '1px' }}>
          <div className="w-px h-full bg-white/10" />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-px bg-white/10" />
        </div>
      )}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
        className={cn(
          "group relative rounded-2xl transition-all border-l-4 overflow-hidden",
          task.completed ? "glass-card opacity-60 grayscale-[0.5]" : "glass-card shadow-lg"
        )}
        style={{ borderLeftColor: task.completed ? 'transparent' : pc.color }}
        whileHover={!task.completed ? { y: -2, boxShadow: `0 12px 24px ${pc.color}15` } : {}}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Check */}
          <motion.button
            onClick={() => updateTask(task.id, { completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined })}
            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              task.completed ? "bg-emerald-500 border-emerald-500 text-white animate-check-pop" : "border-slate-600 hover:border-white/40"
            )}
            style={!task.completed ? { color: pc.color, borderColor: `${pc.color}60` } : {}}
          >
            {task.completed && <CheckCircle2 size={14} />}
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-bold tracking-tight', task.completed ? 'line-through text-slate-500' : 'text-white')}>
              {task.title}
            </p>
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              {task.dueDate && (
                <span className={cn('flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider', isOverdue ? 'text-red-400' : 'text-slate-500')}>
                  <Calendar size={10} /> {task.dueDate}
                </span>
              )}
              {task.labels.map(l => (
                <span key={l} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {l}
                </span>
              ))}
              {task.recurring !== 'none' && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <RotateCcw size={8} /> {task.recurring}
                </span>
              )}
            </div>
          </div>

          {/* Priority badge */}
          <span className="hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl flex-shrink-0 border transition-all"
            style={{ background: `${pc.color}10`, color: pc.color, borderColor: `${pc.color}20` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.color }} />
            {pc.label}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!task.completed && (
              <button 
                onClick={() => (window as any).__openFocusPicker?.({ id: task.id, title: task.title, type: 'task' })} 
                className="w-8 h-8 rounded-full hover:bg-brand-500/20 text-slate-500 hover:text-brand-400 transition-colors flex items-center justify-center"
                title="Start Focus"
              >
                <Timer size={14} />
              </button>
            )}
            {subtasks.length > 0 && (
              <button onClick={() => setExpanded(v => !v)} className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-500 flex items-center justify-center">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors flex items-center justify-center">
              <Edit2 size={14} />
            </button>
            <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

      <AnimatePresence>
        {expanded && subtasks.map(st => <TaskItem key={st.id} task={st} depth={depth + 1} />)}
      </AnimatePresence>
    </motion.div>
    </div>
  );
}

export function TasksPage() {
  const { tasks, loading, loadTasks } = useTaskStore();
  const [view, setView] = useState<ViewType>('Today');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const filtered = tasks
    .filter(t => {
      if (t.parentId) return false;
      if (view === 'Today') return !t.completed && t.dueDate && t.dueDate <= today;
      if (view === 'Upcoming') return !t.completed && (!t.dueDate || t.dueDate > today);
      if (view === 'Completed') return t.completed;
      return !t.completed;
    })
    .sort((a, b) => a.priority - b.priority || (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  const doneToday = tasks.filter(t => t.completed && t.completedAt?.startsWith(today)).length;
  const totalToday = tasks.filter(t => t.dueDate === today).length;
  const urgent = tasks.filter(t => !t.completed && t.priority === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">Task Manager</p>
          <h1 className="text-3xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">
            {doneToday > 0 ? `${doneToday} completed today — great work! 🎉` : 'Stay focused and crush your goals.'}
          </p>
        </div>
        <motion.button
          onClick={() => setShowAdd(v => !v)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.35)' }}
        >
          <Plus size={16} /> New Task
        </motion.button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Due Today', value: totalToday, icon: '📅', class: 'kpi-card-indigo' },
          { label: 'Completed', value: doneToday, icon: '✅', class: 'kpi-card-emerald' },
          { label: 'Urgent', value: urgent, icon: '🔥', class: 'kpi-card-rose' },
        ].map(k => (
          <motion.div 
            key={k.label} 
            whileHover={{ y: -4, scale: 1.02 }}
            className={cn("glass-card rounded-2xl p-6 text-center relative overflow-hidden group", k.class)}
          >
            <span className="absolute right-2 bottom-2 text-5xl opacity-10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500">
              {k.icon}
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{k.label}</p>
            <p className="text-4xl font-black text-white tracking-tight mb-1">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Target size={16} className="text-brand-400" />
              </div>
              <h2 className="text-base font-bold text-white">New Task</h2>
            </div>
            <TaskForm onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl w-fit border border-white/5">
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === v ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white'}`}>
            {v}
            {v === 'Today' && totalToday > 0 && (
              <span className="ml-1.5 text-[10px] bg-brand-500/30 text-brand-300 px-1.5 py-0.5 rounded-full">{totalToday}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <TaskSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center justify-center text-center px-8">
          <span className="text-5xl mb-4">{view === 'Completed' ? '🎉' : '📋'}</span>
          <h3 className="text-lg font-semibold text-white mb-2">
            {view === 'Today' ? 'Nothing due today!' : view === 'Completed' ? 'No completed tasks yet' : 'All clear!'}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed" style={{ maxWidth: '280px' }}>
            {view === 'Today' ? 'Enjoy your free time, or add a new task to stay productive.' : 'Tasks you complete will appear here.'}
          </p>
          {view !== 'Completed' && (
            <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' }}>
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(t => <TaskItem key={t.id} task={t} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
