import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import type { HabitWithStreak, Habit } from '../types';
import { HabitRow } from '../components/habits/workstation/HabitRow';
import { HabitCategoryFilter } from '../components/habits/workstation/HabitCategoryFilter';
import { HabitEditorDrawer } from '../components/habits/workstation/HabitEditorDrawer';
import { HabitInspectorCard } from '../components/habits/workstation/HabitInspectorCard';
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
  const incrementHabit = useHabitStore(s => s.incrementHabit);
  const unlogHabit = useHabitStore(s => s.unlogHabit);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

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

  // Toggle / increment habit completion handler
  const handleToggle = useCallback(
    async (habit: HabitWithStreak) => {
      const target = habit.targetValue || 1;
      const isDone = (habit.todayLog?.value ?? 0) >= target;
      if (isDone) {
        await unlogHabit(habit.id);
      } else if (habit.type === 'boolean' || target <= 1) {
        await logHabit(habit.id, 1);
      } else {
        await incrementHabit(habit.id, 1);
      }
    },
    [incrementHabit, logHabit, unlogHabit]
  );

  const handleIncrement = useCallback(
    async (habit: HabitWithStreak, delta: number) => {
      await incrementHabit(habit.id, delta);
    },
    [incrementHabit]
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

  // Active selected habit for Inspector Card
  const selectedHabit = useMemo(() => {
    if (selectedHabitId) {
      const match = habits.find(h => h.id === selectedHabitId);
      if (match) return match;
    }
    return filteredHabits[0] || habits[0] || null;
  }, [habits, filteredHabits, selectedHabitId]);

  return (
    <div className="min-h-screen bg-transparent text-[var(--tx-primary)] pb-28 pt-2 sm:pt-4 px-2 sm:px-6 max-w-7xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/25 font-bold">Habit Workstation</span>
            <span>•</span>
            <span className="text-[var(--accent-ink)] font-semibold">{habits.filter(h => !h.archived).length} active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--tx-primary)]">
            Habit Library
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--tx-muted)]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)] font-semibold">C</kbd>
            <span>to create</span>
          </span>

          <button
            onClick={() => {
              setEditingHabit(null);
              setIsDrawerOpen(true);
            }}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-bold"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </header>

      {/* ── Main Workstation Dual-Pane Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-start">
        {/* Left Column: Filter Bar & Habits List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
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

          <main className="space-y-2">
            {loading && habits.length === 0 ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-default)] px-4 flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[var(--sf-overlay)] flex-shrink-0" />
                      <div className="h-4 w-36 bg-[var(--sf-overlay)] rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-16 bg-[var(--sf-overlay)] rounded hidden sm:block" />
                      <div className="w-7 h-7 rounded-lg bg-[var(--sf-overlay)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredHabits.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--sf-raised)] my-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--sf-overlay)] flex items-center justify-center mx-auto mb-3 text-2xl">
                  🎯
                </div>
                <h3 className="text-base font-semibold text-[var(--tx-primary)] mb-1">
                  {showArchived ? 'No archived habits' : 'No habits found'}
                </h3>
                <p className="text-xs text-[var(--tx-secondary)] max-w-xs mx-auto mb-4">
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
                    className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
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
                  isSelected={selectedHabit?.id === habit.id}
                  onSelect={h => setSelectedHabitId(h.id)}
                  onToggle={handleToggle}
                  onIncrement={handleIncrement}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  index={idx}
                />
              ))
            )}
          </main>
        </div>

        {/* Right Column: Selected Habit Tactical Inspector (5 cols) */}
        <aside className="hidden lg:block lg:col-span-5">
          <HabitInspectorCard
            habit={selectedHabit}
            onEdit={handleEdit}
            onToggle={handleToggle}
            onIncrement={handleIncrement}
            onArchive={handleArchive}
          />
        </aside>
      </div>

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
