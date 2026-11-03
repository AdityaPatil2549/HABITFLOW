import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface HabitCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HabitCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  showArchived,
  onToggleArchived,
  searchInputRef,
}: HabitCategoryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.05]">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            selectedCategory === 'all'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          )}
        >
          All
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              selectedCategory === cat
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input & Status Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search habits... (/)"
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={onToggleArchived}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0',
            showArchived
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 border-white/[0.06]'
          )}
        >
          {showArchived ? 'Archived' : 'Active'}
        </button>
      </div>
    </div>
  );
}

export default HabitCategoryFilter;
