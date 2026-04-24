import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Flame } from 'lucide-react';
import { useState } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import type { HabitType, HabitFrequency, Priority } from '../../types';
import { format } from 'date-fns';
import { scaleIn } from '../../lib/motionVariants';
import { IconRenderer, HABIT_ICONS } from '../common/IconRenderer';

const CATEGORIES = [
  { name: 'Health', icon: '🍎' },
  { name: 'Learning', icon: '📚' },
  { name: 'Work', icon: '💼' },
  { name: 'Personal', icon: '✨' },
  { name: 'Finance', icon: '💰' },
  { name: 'Other', icon: '🌈' },
];

interface Props {
  onClose: () => void;
}

export function QuickAddModal({ onClose }: Props) {
  const [tab, setTab] = useState<'habit' | 'task'>('habit');

  // Habit form
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('Target');
  const [habitCategory, setHabitCategory] = useState('Health');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitTarget, setHabitTarget] = useState(1);

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taskPriority, setTaskPriority] = useState<Priority>(2);

  const addHabit = useHabitStore(s => s.addHabit);
  const addTask = useTaskStore(s => s.addTask);

  async function handleHabitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;
    await addHabit({
      name: habitName.trim(),
      icon: habitIcon,
      color: '#6366f1',
      category: habitCategory,
      type: habitType,
      frequency: habitFreq,
      targetValue: habitTarget,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      graceDayEnabled: false,
      archived: false,
    });
    onClose();
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      dueDate: taskDueDate,
      labels: [],
      recurring: 'none',
      completed: false,
    });
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="mx-4 overflow-hidden relative rounded-3xl glass-card shadow-2xl border border-white/10"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Decorative Glow */}
          <div
            className="absolute -right-24 -top-24 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'rgba(79,70,229,0.15)', filter: 'blur(48px)' }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-white">Create New</h2>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-2 mb-6">
            {(['habit', 'task'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                  tab === t
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {t === 'habit' ? '🔥 Build Habit' : '✅ Add Task'}
              </button>
            ))}
          </div>

          {/* Habit Form */}
          {tab === 'habit' && (
            <form onSubmit={handleHabitSubmit} className="px-6 pb-8 space-y-6">
              {/* Icon Picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Choose Identity</label>
                <div className="grid grid-cols-5 gap-2 bg-white/5 rounded-2xl p-3 border border-white/5">
                  {HABIT_ICONS.map(item => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setHabitIcon(item.name)}
                      className={`h-12 rounded-xl flex items-center justify-center transition-all ${
                        habitIcon === item.name 
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                        : 'text-slate-400 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setHabitCategory(c.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        habitCategory === c.name
                          ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span>{c.icon}</span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Habit Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400">
                      <IconRenderer name={habitIcon} size={20} />
                    </div>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-brand-500/50 transition-all"
                      placeholder="e.g. Read 20 pages"
                      value={habitName}
                      onChange={e => setHabitName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Type</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all appearance-none"
                      value={habitType}
                      onChange={e => setHabitType(e.target.value as HabitType)}
                    >
                      <option value="boolean">Yes / No</option>
                      <option value="count">Count (reps, pages…)</option>
                      <option value="duration">Duration (minutes)</option>
                      <option value="rating">Rating (1-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Frequency</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all appearance-none"
                      value={habitFreq}
                      onChange={e => setHabitFreq(e.target.value as HabitFrequency)}
                    >
                      <option value="daily">Every day</option>
                      <option value="weekly">Specific days</option>
                    </select>
                  </div>
                </div>

                {habitType !== 'boolean' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Daily Target</label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base font-medium outline-none focus:border-brand-500/50 transition-all"
                      value={habitTarget}
                      min={1}
                      onChange={e => setHabitTarget(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white font-bold text-base shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Flame size={20} /> Create Habit
              </button>
            </form>
          )}

          {/* Task Form */}
          {tab === 'task' && (
            <form onSubmit={handleTaskSubmit} className="px-6 pb-8 space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Task Title</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-brand-500/50 transition-all"
                  placeholder="e.g. Project presentation"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Priority</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-brand-500/50 transition-all appearance-none"
                    value={taskPriority}
                    onChange={e => setTaskPriority(Number(e.target.value) as Priority)}
                  >
                    <option value={0}>Urgent</option>
                    <option value={1}>High</option>
                    <option value={2}>Normal</option>
                    <option value={3}>Low</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white font-bold text-base shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add Task
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
