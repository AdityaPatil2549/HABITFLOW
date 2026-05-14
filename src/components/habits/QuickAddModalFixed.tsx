import { X, Plus, Flame, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import type { HabitType, HabitFrequency, Priority } from '../../types';
import { format } from 'date-fns';
import { IconRenderer, HABIT_ICONS } from '../common/IconRenderer';
import { motion, AnimatePresence } from 'framer-motion';

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

/**
 * Uses native <dialog> + showModal() which renders in the browser's TOP LAYER.
 * Upgraded with premium Tailwind CSS and Framer Motion animations.
 */
export function QuickAddModalFixed({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  // Open the dialog in the top layer when the component mounts
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    dialog.showModal();

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Handle clicking the backdrop
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialogRef.current?.close();
    }
  }

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
    dialogRef.current?.close();
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
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm fixed inset-0 flex items-end md:items-center justify-center open:animate-in open:fade-in duration-300 z-[9999]"
    >
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[512px] md:mx-4 bg-slate-900/90 backdrop-blur-2xl border-t md:border border-white/10 shadow-2xl shadow-black/80 rounded-t-[32px] md:rounded-[32px] overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        {/* Decorative Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-[64px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[64px] pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Create New</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">What's your next move?</p>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Animated Tabs */}
        <div className="relative px-8 mb-6 z-10">
          <div className="flex p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
            {(['habit', 'task'] as const).map(t => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative flex-1 py-3 text-sm font-bold transition-colors z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="quickAddTab"
                      className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-2">
                    {t === 'habit' ? <Flame size={16} className={isActive ? "text-brand-400" : ""} /> : <Check size={16} className={isActive ? "text-emerald-400" : ""} />}
                    {t === 'habit' ? 'Build Habit' : 'Add Task'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Forms Container */}
        <div className="relative px-8 pb-8 z-10 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            {tab === 'habit' ? (
              <motion.form
                key="habit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleHabitSubmit}
                className="space-y-6"
              >
                {/* Icon Picker */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Choose Identity</label>
                  <div className="grid grid-cols-5 gap-2 bg-slate-950/30 rounded-2xl p-3 border border-white/5">
                    {HABIT_ICONS.map(item => {
                      const isActive = habitIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setHabitIcon(item.name)}
                          className={`relative h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                            isActive ? 'text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                          }`}
                        >
                          {isActive && (
                            <motion.div layoutId="iconBg" className="absolute inset-0 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/30" />
                          )}
                          <item.icon size={20} className="relative z-10" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Picker */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => {
                      const isActive = habitCategory === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setHabitCategory(c.name)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                            isActive
                              ? 'bg-brand-500/20 border-brand-500/30 text-brand-300 shadow-inner'
                              : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10 border'
                          }`}
                        >
                          <span className="text-sm">{c.icon}</span>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Habit Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 transition-transform group-focus-within:scale-110">
                        <IconRenderer name={habitIcon} size={20} />
                      </div>
                      <input
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-brand-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
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
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                        value={habitType}
                        onChange={e => setHabitType(e.target.value as HabitType)}
                      >
                        <option value="boolean" className="bg-slate-900">Yes / No</option>
                        <option value="count" className="bg-slate-900">Count (reps, pages…)</option>
                        <option value="duration" className="bg-slate-900">Duration (min)</option>
                        <option value="rating" className="bg-slate-900">Rating (1-5)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Frequency</label>
                      <select
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
                        value={habitFreq}
                        onChange={e => setHabitFreq(e.target.value as HabitFrequency)}
                      >
                        <option value="daily" className="bg-slate-900">Every day</option>
                        <option value="weekly" className="bg-slate-900">Specific days</option>
                      </select>
                    </div>
                  </div>

                  {habitType !== 'boolean' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block mt-1">Daily Target</label>
                      <input
                        type="number"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-brand-300 text-lg font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner"
                        value={habitTarget}
                        min={1}
                        onChange={e => setHabitTarget(Number(e.target.value))}
                      />
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  className="group relative w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold text-base shadow-lg shadow-brand-500/25 active:scale-95 transition-all overflow-hidden border border-white/10"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Flame size={20} className="group-hover:text-amber-300 transition-colors" /> 
                    Ignite Habit
                  </span>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="task"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleTaskSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Task Title</label>
                  <input
                    className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 text-base font-medium outline-none focus:border-emerald-500/50 focus:bg-slate-950/60 transition-all shadow-inner"
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
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-emerald-500/50 transition-all cursor-text"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Priority</label>
                    <select
                      className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                      value={taskPriority}
                      onChange={e => setTaskPriority(Number(e.target.value) as Priority)}
                    >
                      <option value={0} className="bg-slate-900">Urgent 🔴</option>
                      <option value={1} className="bg-slate-900">High 🟠</option>
                      <option value={2} className="bg-slate-900">Normal 🔵</option>
                      <option value={3} className="bg-slate-900">Low ⚪</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group relative w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all overflow-hidden border border-white/10"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
                    Add Task
                  </span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </dialog>
  );
}
