import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Target,
  CheckSquare,
  BarChart2,
  Users,
  ShoppingBag,
  RotateCcw,
  Settings,
  Plus,
  Zap,
  Check,
  Flame,
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useTaskStore } from '../../store/taskStore';
import { useModalStore } from '../../store/modalStore';
import { GlassEmojiCapsule } from './GlassEmojiCapsule';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';
import type { HabitWithStreak } from '../../types';

export function CommandMenu() {
  const navigate = useNavigate();
  const { commandMenuOpen, setCommandMenuOpen, setQuickAddOpen } = useModalStore();
  const { habits, logHabit, unlogHabit } = useHabitStore();
  const { tasks } = useTaskStore();

  // Listen to Cmd+K, Ctrl+K, or Slash key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (!isTyping && e.key === '/')) {
        e.preventDefault();
        setCommandMenuOpen(!commandMenuOpen);
      } else if (e.key === 'Escape' && commandMenuOpen) {
        setCommandMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandMenuOpen, setCommandMenuOpen]);

  const runAction = (callback: () => void) => {
    callback();
    setCommandMenuOpen(false);
  };

  const handleToggleHabit = async (habit: HabitWithStreak) => {
    const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
    if (!isDone) {
      soundService.playTick();
      await logHabit(habit.id, habit.targetValue || 1);
    } else {
      soundService.playUncheck();
      await unlogHabit(habit.id);
    }
  };

  if (!commandMenuOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xl flex items-start justify-center pt-[10vh] sm:pt-[14vh] p-4 animate-in fade-in duration-200"
        onClick={() => setCommandMenuOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0a0d14]/95 border border-white/[0.12] rounded-3xl overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.95)] backdrop-blur-3xl flex flex-col"
        >
          {/* Specular top rim */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />

          <Command
            label="Universal Command HUD"
            className="flex flex-col w-full h-full text-slate-100"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <Command.Input
                placeholder="Type a command, habit, task, or page…"
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg placeholder:text-slate-500 font-medium text-white"
                autoFocus
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-400 bg-white/[0.06] border border-white/[0.08]">
                  ESC
                </kbd>
                <button
                  onClick={() => setCommandMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Command List */}
            <Command.List className="max-h-[380px] sm:max-h-[460px] overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <Command.Empty className="py-12 text-center text-sm text-slate-500">
                <span className="block text-2xl mb-2">🔭</span>
                No matching rituals, tasks, or commands found.
              </Command.Empty>

              {/* 1. Daily Rituals & Quick Log */}
              {habits.length > 0 && (
                <Command.Group
                  heading={
                    <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center justify-between">
                      <span>Daily Rituals (Press Enter to Toggle)</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Instant Action</span>
                    </div>
                  }
                >
                  {habits.slice(0, 5).map(habit => {
                    const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
                    return (
                      <Command.Item
                        key={habit.id}
                        onSelect={() => handleToggleHabit(habit as HabitWithStreak)}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] aria-selected:bg-emerald-500/15 aria-selected:border aria-selected:border-emerald-500/30 transition-all mb-1 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GlassEmojiCapsule
                            icon={habit.icon}
                            category={habit.category}
                            size="sm"
                            isDone={isDone}
                            interactive={false}
                            showHalo={false}
                          />
                          <div className="min-w-0">
                            <span
                              className={cn(
                                'text-sm font-semibold truncate block transition-colors',
                                isDone
                                  ? 'text-slate-400 line-through decoration-emerald-400/50'
                                  : 'text-white group-hover:text-emerald-300'
                              )}
                            >
                              {habit.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              {habit.category && <span>{habit.category}</span>}
                              <span>•</span>
                              <span className="text-amber-400 font-semibold inline-flex items-center gap-0.5">
                                <Flame size={10} className="fill-amber-400" />
                                {habit.streak?.current || 0}d streak
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-mono border transition-colors',
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                            )}
                          >
                            {isDone ? 'Completed' : 'Tap to Log'}
                          </span>
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                              isDone ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/[0.05] text-slate-400'
                            )}
                          >
                            <Check size={14} className={isDone ? 'stroke-[3]' : 'opacity-40'} />
                          </div>
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* 2. Quick Actions */}
              <Command.Group
                heading={
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Quick Pro Actions
                  </div>
                }
              >
                <Command.Item
                  onSelect={() =>
                    runAction(() => {
                      navigate('/habits');
                      setQuickAddOpen(true);
                    })
                  }
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] aria-selected:bg-white/[0.08] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Create New Habit</span>
                      <span className="text-xs text-slate-500">Add an atomic ritual with custom frequency</span>
                    </div>
                  </div>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                    N
                  </kbd>
                </Command.Item>

                <Command.Item
                  onSelect={() => runAction(() => navigate('/tasks'))}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] aria-selected:bg-white/[0.08] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                      <CheckSquare size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Create New Task</span>
                      <span className="text-xs text-slate-500">Add a time-blocked task with priority</span>
                    </div>
                  </div>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                    T
                  </kbd>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    runAction(() => {
                      soundService.playTick();
                    })
                  }
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] aria-selected:bg-white/[0.08] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">Test Audio Engine</span>
                      <span className="text-xs text-slate-500">Synthesize haptic sound cue</span>
                    </div>
                  </div>
                </Command.Item>
              </Command.Group>

              {/* 3. Global Navigation */}
              <Command.Group
                heading={
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Navigation
                  </div>
                }
              >
                {[
                  { label: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'text-emerald-400', keyHint: '1' },
                  { label: 'Habits Workstation', path: '/habits', icon: Target, color: 'text-teal-400', keyHint: '2' },
                  { label: 'Tasks Command Center', path: '/tasks', icon: CheckSquare, color: 'text-indigo-400', keyHint: '3' },
                  { label: 'Analytics & Heatmap', path: '/analytics', icon: BarChart2, color: 'text-cyan-400', keyHint: '4' },
                  { label: 'Squad & Leaderboards', path: '/squad', icon: Users, color: 'text-blue-400' },
                  { label: 'Weekly Review', path: '/review', icon: RotateCcw, color: 'text-purple-400' },
                  { label: 'Rewards Shop', path: '/shop', icon: ShoppingBag, color: 'text-rose-400' },
                  { label: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-400' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.path}
                      onSelect={() => runAction(() => navigate(item.path))}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] aria-selected:bg-white/[0.08] transition-colors mb-1 group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={cn(item.color, 'transition-transform group-hover:scale-110')} />
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                          {item.label}
                        </span>
                      </div>
                      {item.keyHint && (
                        <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-slate-500 border border-white/[0.06]">
                          {item.keyHint}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>

            {/* Bottom Keyboard Telemetry Footer */}
            <div className="px-5 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">↵</kbd> Select / Toggle
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">ESC</kbd> Close
                </span>
              </div>
              <span className="text-emerald-400 font-semibold hidden sm:inline">
                HabitFlow HUD
              </span>
            </div>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CommandMenu;
