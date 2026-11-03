import React from 'react';
import { Search, X, CheckSquare, Calendar, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Priority } from '../../../types';

export type TaskViewTab = 'all' | 'today' | 'upcoming' | 'completed';

export interface TaskFilterBarProps {
  currentTab: TaskViewTab;
  onSelectTab: (tab: TaskViewTab) => void;
  selectedPriority: Priority | 'all';
  onSelectPriority: (p: Priority | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: { all: number; today: number; upcoming: number; completed: number };
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TaskFilterBar({
  currentTab,
  onSelectTab,
  selectedPriority,
  onSelectPriority,
  searchQuery,
  onSearchChange,
  counts,
  searchInputRef,
}: TaskFilterBarProps) {
  const tabs: { id: TaskViewTab; label: string; count: number }[] = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'all', label: 'All Tasks', count: counts.all },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.05]">
      {/* View Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              currentTab === t.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            <span>{t.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                currentTab === t.id ? 'bg-white/20 text-white' : 'text-slate-500'
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Priority & Search */}
      <div className="flex items-center gap-2">
        <select
          value={selectedPriority}
          onChange={e => onSelectPriority(e.target.value === 'all' ? 'all' : (parseInt(e.target.value, 10) as Priority))}
          aria-label="Filter by priority"
          className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="all" className="bg-slate-900 text-white">All Priorities</option>
          <option value="0" className="bg-slate-900 text-rose-400">Urgent</option>
          <option value="1" className="bg-slate-900 text-orange-400">High</option>
          <option value="2" className="bg-slate-900 text-blue-400">Normal</option>
          <option value="3" className="bg-slate-900 text-slate-400">Low</option>
        </select>

        <div className="relative flex-1 sm:w-52">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks... (/)"
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskFilterBar;
