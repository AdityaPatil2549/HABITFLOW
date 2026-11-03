import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Target, Flame, CheckCircle2, Layers } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import type { HabitWithStreak, Habit } from '../types';
import { HabitRow } from '../components/habits/workstation/HabitRow';
import { HabitCategoryFilter } from '../components/habits/workstation/HabitCategoryFilter';
import { HabitEditorDrawer } from '../components/habits/workstation/HabitEditorDrawer';
import { soundService } from '../services/soundService';

export function HabitsPage() {
  const habits = useHabitStore(s => s.habits);
  const loading = useHabitStore(s => s.loading);
  const loadHabits = useHabitStore(s => s.loadHabits);
  const addHabit = useHabitStore(s => s.addHabit);
  const updateHabit = useHabitStore(s => s.updateHabit);
  const archiveHabit = useHabitStore(s => s.archiveHabit);
  const deleteHabit = useHabitStore(s => s.deleteHabit);
  const logHabit = useHabitStore(s => s.logHabit);
  const unlogHabit = useHabitStore(s => s.unlogHabit);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Habits — HabitFlow';
    loadHabits();
  }, [loadHabits]);

  // Extract all distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    habits.forEach(h => {
      if (h.category) set.add(h.category);
    });
    return Array.from(set);
  }, [habits]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      // Archive filter
      if (showArchived) {
        if (!h.archived) return false;
      } else {
        if (h.archived) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && h.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesCat = h.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }

      return true;
    });
  }, [habits, showArchived, selectedCategory, searchQuery]);

  // Toggle habit completion handler
  const handleToggle = useCallback(
    async (habit: HabitWithStreak) => {
      const isDone = (habit.todayLog?.value ?? 0) >= (habit.targetValue || 1);
      if (isDone) {
        await unlogHabit(habit.id);
      } else {
        await logHabit(habit.id, 1);
      }
    },
    [logHabit, unlogHabit]
  );

  // Edit habit handler
  const handleEdit = useCallback((habit: HabitWithStreak) => {
    setEditingHabit(habit);
    setIsDrawerOpen(true);
  }, []);

  // Save habit handler
  const handleSave = useCallback(
    async (data: Omit<Habit, 'id' | 'createdAt' | 'order'>, habitId?: string) => {
      if (habitId) {
        await updateHabit(habitId, data);
      } else {
        await addHabit(data);
      }
    },
    [addHabit, updateHabit]
  );

  // Archive habit handler
  const handleArchive = useCallback(
    async (id: string) => {
      await archiveHabit(id);
    },
    [archiveHabit]
  );

  // Delete habit handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('Are you sure you want to delete this habit permanently?')) {
        await deleteHabit(id);
        soundService.playTick();
      }
    },
    [deleteHabit]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingHabit(null);
        setIsDrawerOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 pb-28 pt-6 sm:pt-8 px-4 sm:px-8 max-w-5xl mx-auto selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            <span>Habit Workstation</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{habits.filter(h => !h.archived).length} active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Habit Library
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex text-[11px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">C</kbd> to create
          </span>

          <button
            onClick={() => {
              setEditingHabit(null);
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="my-6">
        <HabitCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(prev => !prev)}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* ── Habits Workstation List ─────────────────────────────── */}
      <main className="space-y-2">
        {loading && habits.length === 0 ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] my-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-2xl">
              🎯
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {showArchived ? 'No archived habits' : 'No habits found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              {searchQuery
                ? `No habits match "${searchQuery}". Try clearing filters.`
                : 'Get started by creating your first atomic habit.'}
            </p>
            {!showArchived && (
              <button
                onClick={() => {
                  setEditingHabit(null);
                  setIsDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Habit</span>
              </button>
            )}
          </div>
        ) : (
          filteredHabits.map((habit, idx) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
              index={idx}
            />
          ))
        )}
      </main>

      {/* ── Habit Editor Slide-Over Drawer ──────────────────────── */}
      <HabitEditorDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSave}
        initialHabit={editingHabit}
      />
    </div>
  );
}

export default HabitsPage;
