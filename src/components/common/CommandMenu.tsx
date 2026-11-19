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
  Check,
  Flame,
  X,
  Volume2,
} from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useModalStore } from '../../store/modalStore';
import { IconRenderer } from './IconRenderer';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';
import type { HabitWithStreak } from '../../types';

export function CommandMenu() {
  const navigate = useNavigate();
  const { commandMenuOpen, setCommandMenuOpen, setQuickAddOpen } = useModalStore();
  const { habits, logHabit, unlogHabit } = useHabitStore();

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
        className="fixed inset-0 z-[9999] bg-black/65 flex items-start justify-center pt-[10vh] sm:pt-[14vh] p-4 animate-in fade-in duration-150"
        onClick={() => setCommandMenuOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[var(--sf-raised)] border border-[var(--border-strong)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          <Command
            label="Universal Command HUD"
            className="flex flex-col w-full h-full text-[var(--tx-primary)]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] bg-[var(--sf-base)]">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <Command.Input
                placeholder="Type a command, habit, task, or page…"
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg placeholder:text-[var(--tx-muted)] font-medium text-[var(--tx-primary)]"
                autoFocus
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-[var(--tx-muted)] bg-[var(--sf-overlay)] border border-[var(--border-default)]">
                  ESC
                </kbd>
                <button
                  onClick={() => setCommandMenuOpen(false)}
                  className="p-1 rounded-lg text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Command List */}
            <Command.List className="max-h-[380px] sm:max-h-[460px] overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <Command.Empty className="py-12 text-center text-sm text-[var(--tx-muted)]">
                <span className="block text-2xl mb-2">🔭</span>
                No matching rituals, tasks, or commands found.
              </Command.Empty>

              {/* 1. Daily Rituals & Quick Log */}
              {habits.length > 0 && (
                <Command.Group
                  heading={
                    <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--tx-muted)] font-semibold flex items-center justify-between">
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
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--sf-overlay)] aria-selected:bg-[var(--accent-subtle)] aria-selected:border aria-selected:border-[var(--accent)]/30 transition-all mb-1 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                            <IconRenderer
                              name={habit.icon}
                              color={habit.color || 'var(--accent)'}
                              size={16}
                            />
                          </span>
                          <div className="min-w-0">
                            <span
                              className={cn(
                                'text-sm font-semibold truncate block transition-colors',
                                isDone
                                  ? 'text-[var(--tx-muted)] line-through decoration-[var(--accent)]/50'
                                  : 'text-[var(--tx-primary)] group-hover:text-[var(--accent-ink)]'
                              )}
                            >
                              {habit.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--tx-muted)] font-mono">
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
                                ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border-[var(--accent)]/40'
                                : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border-[var(--border-default)]'
                            )}
                          >
                            {isDone ? 'Completed' : 'Tap to Log'}
                          </span>
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                              isDone ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold' : 'bg-[var(--sf-overlay)] text-[var(--tx-muted)]'
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
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--tx-muted)] font-semibold">
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
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--sf-overlay)] aria-selected:bg-[var(--sf-overlay)] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-ink)] flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--tx-primary)] block">Create New Habit</span>
                      <span className="text-xs text-[var(--tx-muted)]">Add an atomic ritual with custom frequency</span>
                    </div>
                  </div>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">
                    N
                  </kbd>
                </Command.Item>

                <Command.Item
                  onSelect={() => runAction(() => navigate('/hub/tasks'))}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--sf-overlay)] aria-selected:bg-[var(--sf-overlay)] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-ink)] flex items-center justify-center">
                      <CheckSquare size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--tx-primary)] block">Create New Task</span>
                      <span className="text-xs text-[var(--tx-muted)]">Add a time-blocked task with priority</span>
                    </div>
                  </div>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">
                    T
                  </kbd>
                </Command.Item>

                <Command.Item
                  onSelect={() =>
                    runAction(() => {
                      soundService.playTick();
                    })
                  }
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--sf-overlay)] aria-selected:bg-[var(--sf-overlay)] transition-colors mb-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--tx-primary)] block">Test Audio Engine</span>
                      <span className="text-xs text-[var(--tx-muted)]">Synthesize haptic sound cue</span>
                    </div>
                  </div>
                </Command.Item>
              </Command.Group>

              {/* 3. Global Navigation */}
              <Command.Group
                heading={
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--tx-muted)] font-semibold">
                    Navigation
                  </div>
                }
              >
                {[
                  { label: 'Today', path: '/', icon: LayoutDashboard, color: 'text-[var(--accent-ink)]', keyHint: '1' },
                  { label: 'Plan & Chains', path: '/habits', icon: Target, color: 'text-[var(--tx-secondary)]', keyHint: '2' },
                  { label: 'Insights & Review', path: '/insights', icon: BarChart2, color: 'text-[var(--tx-secondary)]', keyHint: '3' },
                  { label: 'Tasks Command Center', path: '/hub/tasks', icon: CheckSquare, color: 'text-[var(--tx-secondary)]', keyHint: '4' },
                  { label: 'Squad & Leaderboards', path: '/hub/squad', icon: Users, color: 'text-[var(--tx-secondary)]' },
                  { label: 'Weekly Review', path: '/insights?tab=review', icon: RotateCcw, color: 'text-[var(--tx-secondary)]' },
                  { label: 'Armory & Inks', path: '/hub/shop', icon: ShoppingBag, color: 'text-[var(--tx-secondary)]' },
                  { label: 'Settings', path: '/hub/settings', icon: Settings, color: 'text-[var(--tx-muted)]' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.path}
                      onSelect={() => runAction(() => navigate(item.path))}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--sf-overlay)] aria-selected:bg-[var(--sf-overlay)] transition-colors mb-1 group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={cn(item.color, 'transition-transform group-hover:scale-105')} />
                        <span className="text-sm font-medium text-[var(--tx-secondary)] group-hover:text-[var(--tx-primary)]">
                          {item.label}
                        </span>
                      </div>
                      {item.keyHint && (
                        <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--sf-overlay)] text-[var(--tx-muted)] border border-[var(--border-default)]">
                          {item.keyHint}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>

            {/* Bottom Keyboard Telemetry Footer */}
            <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--sf-base)] flex items-center justify-between text-[11px] font-mono text-[var(--tx-muted)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">↵</kbd> Select / Toggle
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">ESC</kbd> Close
                </span>
              </div>
              <span className="text-[var(--accent-ink)] font-semibold hidden sm:inline">
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
