import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Plus, CheckSquare, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { Task, Priority, Project } from '../types';
import { TaskRow } from '../components/tasks/workstation/TaskRow';
import { TaskFilterBar, type TaskViewTab } from '../components/tasks/workstation/TaskFilterBar';
import { TaskEditorModal } from '../components/tasks/workstation/TaskEditorModal';
import { isToday, isPast, parseISO, isFuture } from 'date-fns';
import { soundService } from '../services/soundService';

export function TasksPage() {
  const tasks = useTaskStore(s => s.tasks);
  const projects = useTaskStore(s => s.projects);
  const loading = useTaskStore(s => s.loading);
  const loadTasks = useTaskStore(s => s.loadTasks);
  const addTask = useTaskStore(s => s.addTask);
  const updateTask = useTaskStore(s => s.updateTask);
  const completeTask = useTaskStore(s => s.completeTask);
  const uncompleteTask = useTaskStore(s => s.uncompleteTask);
  const deleteTask = useTaskStore(s => s.deleteTask);

  const [currentTab, setCurrentTab] = useState<TaskViewTab>('today');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Tasks — HabitFlow';
    loadTasks();
  }, [loadTasks]);

  // Map of project IDs to names
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let today = 0;
    let upcoming = 0;
    let all = 0;
    let completed = 0;

    tasks.forEach(t => {
      if (t.completed) {
        completed++;
      } else {
        all++;
        if (t.dueDate) {
          try {
            const parsed = parseISO(t.dueDate);
            if (isToday(parsed) || isPast(parsed)) today++;
            if (isFuture(parsed) && !isToday(parsed)) upcoming++;
          } catch {
            // ignore parse error
          }
        }
      }
    });

    return { all, today, upcoming, completed };
  }, [tasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Tab filter
      if (currentTab === 'completed') {
        if (!t.completed) return false;
      } else {
        if (t.completed) return false;

        if (currentTab === 'today') {
          if (!t.dueDate) return true; // Undated tasks show in Today by default
          try {
            const parsed = parseISO(t.dueDate);
            if (!isToday(parsed) && !isPast(parsed)) return false;
          } catch {
            return false;
          }
        } else if (currentTab === 'upcoming') {
          if (!t.dueDate) return false;
          try {
            const parsed = parseISO(t.dueDate);
            if (!isFuture(parsed) || isToday(parsed)) return false;
          } catch {
            return false;
          }
        }
      }

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, currentTab, selectedPriority, searchQuery]);

  // Task check toggle handler
  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      if (completed) {
        await uncompleteTask(id);
      } else {
        await completeTask(id);
      }
    },
    [completeTask, uncompleteTask]
  );

  // Edit handler
  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  // Save task handler
  const handleSave = useCallback(
    async (data: Omit<Task, 'id' | 'createdAt' | 'order'>, taskId?: string) => {
      if (taskId) {
        await updateTask(taskId, data);
      } else {
        await addTask(data);
      }
    },
    [addTask, updateTask]
  );

  // Delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTask(id);
      soundService.playTick();
    },
    [deleteTask]
  );

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      if (e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTask(null);
        setIsModalOpen(true);
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
            <span>Action Workstation</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{tabCounts.all} pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Tasks & Action Items
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex text-[11px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">C</kbd> to add
          </span>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="my-6">
        <TaskFilterBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={tabCounts}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* ── Task List ───────────────────────────────────────────── */}
      <main className="space-y-2">
        {loading && tasks.length === 0 ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] my-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-2xl">
              ✅
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {currentTab === 'completed' ? 'No completed tasks yet' : 'No tasks in this view'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              {searchQuery
                ? `No tasks match "${searchQuery}".`
                : 'All caught up! Create a new action item to stay ahead.'}
            </p>
            {currentTab !== 'completed' && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              projectName={task.projectId ? projectMap.get(task.projectId) : undefined}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </main>

      {/* ── Task Editor Modal ───────────────────────────────────── */}
      <TaskEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        initialTask={editingTask}
        projects={projects}
      />
    </div>
  );
}

export default TasksPage;
