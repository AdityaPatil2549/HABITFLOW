import { useEffect, useState, useRef, ChangeEvent, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, Reorder, useDragControls } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Calendar,
  RotateCcw,
  Target,
  Timer,
  Image as ImageIcon,
  X,
  Search,
  LayoutList,
  LayoutGrid,
  GripVertical,
  ArrowLeft,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useFocusStore } from '../store/focusStore';
import type { Task, Priority } from '../types';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { taskSchema } from '../lib/validations';
import { cn, compressImage } from '../lib/utils';
import { useToast } from '../components/common/Toast';
import { useCompletionEffects } from '../components/ui/CompletionEffects';
import { MagneticButton } from '../components/ui/MagneticButton';
import { exportTaskToCalendar } from '../lib/calendarSync';
import { NeonCheckbox } from '../components/ui/animated-check-box';
import { DatePicker } from '../components/ui/date-picker';
import { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent } from '../components/ui/morphing-popover';
import { JollyTagGroup, TagList, Tag } from '../components/ui/tag-group';

// Lazy load the heavy Three.js background
const TasksBackground = lazy(() =>
  import('../components/tasks/TasksBackground').then(m => ({ default: m.TasksBackground }))
);

// ── Priority Config ────────────────────────────────────────────
const PRIORITY_CONFIG = [
  { label: 'Urgent', color: '#ef4444', glow: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', icon: '🔴' },
  { label: 'High',   color: '#f97316', glow: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)', icon: '🟠' },
  { label: 'Normal', color: '#818cf8', glow: 'rgba(129,140,248,0.25)',bg: 'rgba(129,140,248,0.10)',border: 'rgba(129,140,248,0.30)', icon: '🔵' },
  { label: 'Low',    color: '#64748b', glow: 'rgba(100,116,139,0.15)',bg: 'rgba(100,116,139,0.10)',border: 'rgba(100,116,139,0.20)', icon: '⚪' },
];

const VIEWS = ['Today', 'Upcoming', 'All', 'Completed'] as const;
type ViewType = (typeof VIEWS)[number];
type DisplayMode = 'list' | 'board';

// ── Particle burst data ────────────────────────────────────────
interface Particle { id: number; tx: number; ty: number; size: number; color: string }

function makeParticles(pc: typeof PRIORITY_CONFIG[0]): Particle[] {
  const colors = [pc.color, '#ffffff', pc.glow];
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 2 * Math.PI;
    const d = 40 + (i * 13 % 28);
    return { id: i, tx: Math.cos(angle) * d, ty: Math.sin(angle) * d, size: 3 + (i % 3), color: colors[i % 3] };
  });
}

// ── Circular Progress Ring ─────────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <div className="absolute inset-3 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--brand-500) 0%, transparent 70%)' }} />
        <svg className="w-full h-full -rotate-90" viewBox="0 0 116 116">
          <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="58" cy="58" r={R}
            fill="none"
            stroke="url(#rg)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--brand-400)" />
              <stop offset="100%" stopColor="var(--brand-600)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span key={pct} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black text-white tracking-tight">{pct}%</motion.span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">done</span>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Done</p>
          <p className="text-2xl font-black text-emerald-400">{done}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Left</p>
          <p className="text-2xl font-black text-white">{Math.max(0, total - done)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Task Form ──────────────────────────────────────────────────
function TaskForm({ onClose, initialTask }: { onClose: () => void; initialTask?: Task }) {
  const { addTask, updateTask } = useTaskStore();
  const [title, setTitle]     = useState(initialTask?.title ?? '');
  const [desc, setDesc]       = useState(initialTask?.description ?? '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<Priority>(initialTask?.priority ?? 2);
  const [recurring, setRecurring] = useState<Task['recurring']>(initialTask?.recurring ?? 'none');
  const [labels, setLabels]   = useState<string[]>(initialTask?.labels ?? []);
  const [imageAttachment, setImageAttachment] = useState(initialTask?.imageAttachment ?? '');
  const [error, setError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setImageAttachment(await compressImage(file, 800, 0.6)); }
    catch { setError('Failed to compress image'); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const parsed = taskSchema.safeParse({
      title: title.trim(), description: desc, priority,
      dueDate: dueDate || undefined, labels,
      recurring, completed: initialTask?.completed ?? false,
      parentId: initialTask?.parentId, projectId: initialTask?.projectId,
      imageAttachment: imageAttachment || undefined,
    });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (initialTask) await updateTask(initialTask.id, parsed.data);
    else await addTask(parsed.data);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-base font-medium outline-none focus:border-brand-500/50 transition-all"
        placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
      <div>
        <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-brand-500/50 transition-all resize-none"
          placeholder="Add details (optional)…" rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
        {imageAttachment && (
          <div className="relative inline-block mt-2">
            <img src={imageAttachment} alt="preview" className="h-20 w-auto rounded-lg border border-white/10 object-cover" />
            <button type="button" onClick={() => setImageAttachment('')}
              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg border border-white/10">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex mt-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ImageIcon size={14} /> Add Photo
          </button>
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImage} />
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Priority</p>
        <div className="flex gap-2">
          {PRIORITY_CONFIG.map((p, i) => (
            <button key={i} type="button" onClick={() => setPriority(i as Priority)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${priority === i ? 'scale-105' : 'opacity-50'}`}
              style={priority === i ? { background: p.bg, borderColor: p.border, color: p.color } : { borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Due Date</p>
          <DatePicker 
            date={dueDate ? parseISO(dueDate) : undefined}
            onDateChange={(d) => setDueDate(d ? format(d, 'yyyy-MM-dd') : '')}
            className="w-full py-2.5" 
          />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Repeat</p>
          <select value={recurring} onChange={e => setRecurring(e.target.value as Task['recurring'])}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all">
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <JollyTagGroup
        label="Labels"
        selectionMode="multiple"
        selectedKeys={new Set(labels)}
        onSelectionChange={(keys) => setLabels(Array.from(keys) as string[])}
      >
        <TagList>
          {['Work', 'Study', 'Health', 'Personal', 'Finance', 'Errands'].map(t => (
            <Tag id={t} key={t}>{t}</Tag>
          ))}
        </TagList>
      </JollyTagGroup>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors">
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

// ── Skeleton ───────────────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white/8 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-white/8 rounded-full w-2/3" />
          <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
        </div>
        <div className="w-16 h-6 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

// ── 3D Task Card (with flip, tilt, particles) ──────────────────
function TaskCard({ task, index = 0 }: { task: Task; index?: number }) {
  const { tasks, deleteTask, completeTask, uncompleteTask } = useTaskStore();
  const { openPicker } = useFocusStore();
  const toast = useToast();
  const { fireConfetti } = useCompletionEffects();

  const [flipped, setFlipped]       = useState(false);
  const [completing, setCompleting] = useState(false);
  const [particles, setParticles]   = useState<Particle[]>([]);
  const [expanded, setExpanded]     = useState(false);
  const [descNote, setDescNote]     = useState(task.description || '');

  const subtasks = tasks.filter(t => t.parentId === task.id);
  const pc = PRIORITY_CONFIG[task.priority];
  const isOverdue = !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  // 3D Tilt via springs
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 300, damping: 30 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 300, damping: 30 });
  const cardRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (task.completed || flipped) return;
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  function handleComplete() {
    if (task.completed) { uncompleteTask(task.id); return; }
    setParticles(makeParticles(pc));
    setTimeout(() => setParticles([]), 800);
    setCompleting(true);
    setTimeout(() => { completeTask(task.id); fireConfetti(); setCompleting(false); }, 380);
  }

  const isUrgent = !task.completed && task.priority === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={completing ? { opacity: 0, scale: 1.06, y: -14 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.92 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.04 }}
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: 1000, rotateX: rotX, rotateY: rotY }}
      className={cn('group relative', isUrgent && 'neon-urgent-glow')}
    >
      {/* Particle burst */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{ width: p.size, height: p.size, background: p.color, left: '50%', top: '50%' }}
              initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 1 }}
              animate={{ x: `calc(-50% + ${p.tx}px)`, y: `calc(-50% + ${p.ty}px)`, opacity: 0, scale: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Priority glow halo */}
      {!task.completed && (
        <motion.div
          className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `0 0 22px ${pc.glow}, 0 0 60px ${pc.glow}50` }}
        />
      )}

      {/* ─── Flip Container ─────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        {!flipped ? (
          /* ── FRONT (card view) ── */
          <motion.div
            key="front"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={cn(
              'rounded-2xl border overflow-hidden transition-all duration-300',
              task.completed
                ? 'opacity-55 grayscale-[0.6] dark:bg-white/3 bg-slate-900/5 dark:border-white/5 border-slate-900/10'
                : 'dark:bg-slate-900/65 bg-white/60 backdrop-blur-xl dark:border-white/10 border-slate-900/10 hover:dark:border-white/20 hover:border-slate-900/20 shadow-xl'
            )}
            style={!task.completed ? {
              borderLeft: `3px solid ${pc.color}`,
              boxShadow: `0 4px 24px -8px ${pc.glow}`,
            } : {}}
          >
            {/* Inner shimmer */}
            {!task.completed && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${pc.bg} 0%, transparent 55%)` }} />
            )}

            <div className="relative flex items-center gap-4 px-5 py-4">
              {/* Check button */}
              <div className="flex-shrink-0 flex items-center justify-center relative z-10 w-7 h-7">
                <NeonCheckbox 
                  checked={task.completed} 
                  onChange={handleComplete}
                  neonColor={pc.color}
                  checkboxSize="28px"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold tracking-tight', task.completed ? 'line-through text-slate-500' : 'dark:text-white text-slate-900')}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={cn('text-xs mt-0.5 leading-relaxed truncate', task.completed ? 'text-slate-600' : 'text-slate-400')}>
                    {task.description}
                  </p>
                )}
                {task.imageAttachment && (
                  <div className="mt-2">
                    <img src={task.imageAttachment} alt="Attachment"
                      className={cn('max-h-28 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity', task.completed ? 'border-slate-800 opacity-40 grayscale' : 'border-white/10')}
                      onClick={e => {
                        e.stopPropagation();
                        fetch(task.imageAttachment!).then(r => r.blob()).then(blob => {
                          const url = URL.createObjectURL(blob);
                          const w = window.open(url, '_blank');
                          if (w) w.onunload = () => URL.revokeObjectURL(url);
                        }).catch(() => window.open(task.imageAttachment, '_blank'));
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {task.dueDate && (
                    <span className={cn('flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider', isOverdue ? 'text-red-400' : 'text-slate-500')}>
                      <Calendar size={9} />{isOverdue ? '⚠ ' : ''}{task.dueDate}
                    </span>
                  )}
                  {task.labels.map(l => (
                    <span key={l} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">{l}</span>
                  ))}
                  {task.recurring !== 'none' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <RotateCcw size={8} /> {task.recurring}
                    </span>
                  )}
                  {subtasks.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-500">{subtasks.filter(s => s.completed).length}/{subtasks.length} subtasks</span>
                  )}
                </div>
              </div>

              {/* Priority badge */}
              <span className="hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl flex-shrink-0 border"
                style={{ background: pc.bg, color: pc.color, borderColor: pc.border }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.color }} />{pc.label}
              </span>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!task.completed && (
                  <>
                    <MorphingPopover>
                      <MorphingPopoverTrigger className="w-8 h-8 rounded-full hover:bg-brand-500/20 text-slate-500 hover:text-brand-400 transition-colors flex items-center justify-center" title="Note">
                        <Plus size={14} />
                      </MorphingPopoverTrigger>
                      <MorphingPopoverContent className="w-64 p-3 flex flex-col gap-2 relative z-50">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Task Note</label>
                        <textarea
                          className="input w-full min-h-20 resize-none text-sm bg-slate-800/50"
                          placeholder="Add details or notes..."
                          value={descNote}
                          onChange={e => setDescNote(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const { updateTask } = useTaskStore.getState();
                            updateTask(task.id, { description: descNote });
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                          }}
                          className="btn-primary py-1.5 text-xs w-full mt-1"
                        >
                          Save
                        </button>
                      </MorphingPopoverContent>
                    </MorphingPopover>
                    <button onClick={() => openPicker({ id: task.id, title: task.title, type: 'task' })}
                      className="w-8 h-8 rounded-full hover:bg-brand-500/20 text-slate-500 hover:text-brand-400 transition-colors flex items-center justify-center" title="Focus">
                      <Timer size={14} />
                    </button>
                    <button onClick={() => exportTaskToCalendar(task)}
                      className="w-8 h-8 rounded-full hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 transition-colors flex items-center justify-center" title="Calendar">
                      <Calendar size={14} />
                    </button>
                  </>
                )}
                {subtasks.length > 0 && (
                  <button onClick={() => setExpanded(v => !v)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-500 flex items-center justify-center">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {/* 3D Flip to Edit */}
                <button onClick={() => setFlipped(true)}
                  className="w-8 h-8 rounded-full hover:bg-brand-500/20 text-slate-500 hover:text-brand-400 transition-colors flex items-center justify-center" title="Edit (3D Flip)">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => toast.confirm(`Delete "${task.title}"${subtasks.length > 0 ? ' and its subtasks' : ''}?`, () => deleteTask(task.id), { confirmLabel: 'Delete', danger: true })}
                  className="w-8 h-8 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Subtasks */}
            <AnimatePresence>
              {expanded && subtasks.map((st, si) => (
                <div key={st.id} className="pl-4 pr-4 pb-2">
                  <TaskCard task={st} index={si} />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── BACK (edit form) ── */
          <motion.div
            key="back"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(24px)', border: `1px solid ${pc.color}40` }}
          >
            {/* Flip-back header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8"
              style={{ background: `linear-gradient(135deg, ${pc.bg}, transparent)` }}>
              <button onClick={() => setFlipped(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <span className="text-sm font-black text-white ml-1">Edit Task</span>
              <div className="flex-1" />
              <span className="text-lg">{pc.icon}</span>
            </div>
            <div className="p-5">
              <TaskForm initialTask={task} onClose={() => setFlipped(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Draggable wrapper for list reorder ─────────────────────────
function DraggableCard({ task, index }: { task: Task; index: number }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={task}
      dragListener={false}
      dragControls={dragControls}
      className="relative flex items-stretch gap-1.5"
      whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 999 }}
    >
      {/* Drag handle */}
      <motion.div
        onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
        className="flex items-center justify-center w-7 cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400 transition-colors flex-shrink-0 touch-none"
        whileHover={{ color: '#818cf8' }}
      >
        <GripVertical size={15} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <TaskCard task={task} index={index} />
      </div>
    </Reorder.Item>
  );
}

// ── Kanban Board ───────────────────────────────────────────────
const KANBAN_COLS = [
  { id: 'urgent',   label: '🔴 Urgent',   color: '#ef4444', filter: (t: Task, _d: string) => !t.parentId && !t.completed && t.priority === 0 },
  { id: 'today',    label: '📅 Today',    color: '#818cf8', filter: (t: Task, d: string)  => !t.parentId && !t.completed && t.priority !== 0 && !!t.dueDate && t.dueDate <= d },
  { id: 'upcoming', label: '🚀 Upcoming', color: '#34d399', filter: (t: Task, d: string)  => !t.parentId && !t.completed && (!t.dueDate || t.dueDate > d) && t.priority !== 0 },
  { id: 'done',     label: '✅ Done',     color: '#64748b', filter: (t: Task) => !t.parentId && t.completed },
];

function KanbanBoard({ tasks, search }: { tasks: Task[]; search: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    // Perspective wrapper for 3D depth
    <div style={{ perspective: '2400px', perspectiveOrigin: '50% 10%' }}>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 pb-8"
        style={{ transformStyle: 'preserve-3d' }}
        initial={{ rotateX: 8, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {KANBAN_COLS.map((col, ci) => {
          const colTasks = tasks
            .filter(t => col.filter(t, today))
            .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1, duration: 0.45, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border backdrop-blur-sm"
                style={{ background: `${col.color}12`, borderColor: `${col.color}28` }}>
                <span className="text-sm font-black dark:text-white text-slate-900 tracking-tight">{col.label}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${col.color}22`, color: col.color }}>{colTasks.length}</span>
              </div>
              {/* Column cards */}
              <div className="flex flex-col gap-3 min-h-[120px]">
                <AnimatePresence mode="popLayout">
                  {colTasks.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-xl border border-dashed border-white/8 py-8 flex items-center justify-center text-slate-600 text-xs font-medium">
                      Nothing here
                    </motion.div>
                  ) : colTasks.map((t, ti) => <TaskCard key={t.id} task={t} index={ti} />)}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
function EmptyState({ view, onAdd }: { view: ViewType; onAdd: () => void }) {
  const cfg = {
    Today:     { emoji: '☀️', title: 'All clear today!',          sub: 'Enjoy your free time, or add a new task.' },
    Upcoming:  { emoji: '🗓️', title: 'Nothing upcoming',          sub: 'Your schedule is wide open.' },
    All:       { emoji: '✨', title: 'No active tasks',            sub: 'Ready to be productive?' },
    Completed: { emoji: '🎉', title: 'No completed tasks yet',     sub: 'Finished tasks will appear here.' },
  }[view];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden py-20 flex flex-col items-center justify-center text-center px-8"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
      <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl mb-5 relative z-10">{cfg.emoji}</motion.span>
      <h3 className="text-xl font-black dark:text-white text-slate-900 mb-2 relative z-10">{cfg.title}</h3>
      <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed max-w-[240px] relative z-10">{cfg.sub}</p>
      {view !== 'Completed' && (
        <MagneticButton onClick={onAdd} intensity={0.4}
          className="mt-6 px-6 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 relative z-10"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 20px rgba(var(--brand-500-rgb),0.35)' }}>
          <Plus size={15} /> Add Task
        </MagneticButton>
      )}
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export function TasksPage() {
  const { tasks, loading, loadTasks } = useTaskStore();
  const [view, setView]               = useState<ViewType>('Today');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [showAdd, setShowAdd]         = useState(false);
  const [search, setSearch]           = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { document.title = 'Tasks — HabitFlow'; }, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  const filtered = useMemo(() =>
    tasks
      .filter(t => {
        if (t.parentId) return false;
        if (view === 'Today')     return !t.completed && t.dueDate && t.dueDate <= today;
        if (view === 'Upcoming')  return !t.completed && (!t.dueDate || t.dueDate > today);
        if (view === 'Completed') return t.completed;
        return !t.completed;
      })
      .filter(t => priorityFilter === null || t.priority === priorityFilter)
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (view === 'Completed') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
        return a.priority - b.priority || (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
      }),
  [tasks, view, search, priorityFilter, today]);

  // Reorder local state for drag-to-reorder in list mode
  const [orderedFiltered, setOrderedFiltered] = useState(filtered);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrderedFiltered(filtered), [filtered]);

  const doneToday   = tasks.filter(t => !t.parentId && t.completed && t.completedAt?.startsWith(today)).length;
  const totalToday  = tasks.filter(t => !t.parentId && !t.completed && t.dueDate && t.dueDate <= today).length;
  const urgentCount = tasks.filter(t => !t.parentId && !t.completed && t.priority === 0).length;

  return (
    <div className="space-y-6 pb-32 relative">

      {/* Three.js Aurora Background */}
      <Suspense fallback={null}>
        <TasksBackground />
      </Suspense>

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--brand-500-rgb),0.13) 0%, rgba(15,23,42,0.55) 100%)',
          border: '1px solid rgba(var(--brand-500-rgb),0.22)',
          backdropFilter: 'blur(24px)',
        }}>
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] opacity-20 pointer-events-none -z-10" style={{ background: 'var(--brand-500)' }} />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full blur-[80px] opacity-10 pointer-events-none -z-10" style={{ background: 'var(--brand-400)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <ProgressRing done={doneToday} total={doneToday + totalToday} />

          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.25em] mb-1" style={{ color: 'var(--brand-400)' }}>
              Task Command Center
            </p>
            <h1 className="text-4xl font-black dark:text-white text-slate-900 tracking-tight mb-2">My Tasks</h1>
            <p className="dark:text-slate-400 text-slate-600 text-sm mb-5">
              {doneToday > 0 ? `${doneToday} smashed today — let's keep going! 🔥` : 'Stay focused. Build momentum.'}
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: 'Due Today', value: totalToday,   color: '#818cf8' },
                { label: 'Urgent',    value: urgentCount,  color: '#ef4444' },
                { label: 'Active',    value: tasks.filter(t => !t.parentId && !t.completed).length, color: '#34d399' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ background: `${s.color}12`, borderColor: `${s.color}25` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.value} {s.label}</span>
                </div>
              ))}
            </div>

            <MagneticButton onClick={() => setShowAdd(v => !v)} intensity={0.4}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', boxShadow: '0 8px 24px rgba(var(--brand-500-rgb),0.4)' }}>
              <Plus size={16} /> New Task
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* ── Add Form Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(var(--brand-500-rgb),0.28)' }}>
              <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'linear-gradient(135deg, rgba(var(--brand-500-rgb),0.18), rgba(var(--brand-500-rgb),0.06))' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--brand-500-rgb),0.22)' }}>
                  <Target size={16} style={{ color: 'var(--brand-400)' }} />
                </div>
                <h2 className="text-base font-black text-white">New Task</h2>
                <button onClick={() => setShowAdd(false)} className="ml-auto w-8 h-8 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(24px)' }}>
                <TaskForm onClose={() => setShowAdd(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-500 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(10px)' }} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        {/* View mode toggle */}
        <div className="flex bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl p-1 gap-1">
          {(['list', 'board'] as DisplayMode[]).map(mode => {
          const Icon = mode === 'list' ? LayoutList : LayoutGrid;
          return (
            <button key={mode} onClick={() => setDisplayMode(mode)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold transition-colors ${displayMode === mode ? 'dark:text-white text-slate-900' : 'text-slate-500 dark:hover:text-slate-300 hover:text-slate-700'}`}>
              {displayMode === mode && (
                <motion.div layoutId="view-pill" className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(var(--brand-500-rgb),0.3)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
              )}
              <Icon size={15} className="relative z-10" />
            </button>
          );
        })}
        </div>
      </div>

      {/* ── View Tabs + Priority Filters ────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 rounded-xl border border-slate-900/5 dark:border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === v ? 'dark:text-white text-slate-900' : 'text-slate-500 dark:hover:text-white hover:text-slate-900'}`}>
              {view === v && (
                <motion.div layoutId="view-tab" className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(var(--brand-500-rgb),0.25)', border: '1px solid rgba(var(--brand-500-rgb),0.3)' }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }} />
              )}
              <span className="relative z-10">
                {v}
                {v === 'Today' && totalToday > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(var(--brand-500-rgb),0.3)', color: 'var(--brand-600)' }}>{totalToday}</span>
                )}
                {v === 'Upcoming' && urgentCount > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500">{urgentCount} 🔴</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setPriorityFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${priorityFilter === null ? 'dark:bg-white/15 bg-slate-900/10 dark:border-white/30 border-slate-900/20 dark:text-white text-slate-900' : 'bg-transparent dark:border-white/10 border-slate-900/10 text-slate-500 dark:hover:text-white hover:text-slate-900'}`}>
            All
          </button>
          {PRIORITY_CONFIG.map((p, i) => (
            <button key={i} onClick={() => setPriorityFilter(priorityFilter === i ? null : i)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
              style={priorityFilter === i
                ? { background: p.bg, borderColor: p.border, color: p.color }
                : { background: 'transparent', borderColor: 'rgba(100,116,139,0.2)', color: '#64748b' }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <TaskSkeleton key={i} />)}</div>
      ) : displayMode === 'board' ? (
        <KanbanBoard tasks={tasks} search={search} />
      ) : filtered.length === 0 ? (
        <EmptyState view={view} onAdd={() => setShowAdd(true)} />
      ) : (
        <Reorder.Group
          as="div"
          axis="y"
          values={orderedFiltered}
          onReorder={setOrderedFiltered}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {orderedFiltered.map((t, i) => (
              <DraggableCard key={t.id} task={t} index={i} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
}
