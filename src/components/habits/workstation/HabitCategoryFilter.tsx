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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-[var(--border-default)]">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            selectedCategory === 'all'
              ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-semibold'
              : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] border border-[var(--border-default)]'
          )}
        >
          All
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
              selectedCategory === cat
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border border-[var(--accent)]/30 font-semibold'
                : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] hover:bg-[var(--sf-overlay)] border border-[var(--border-default)]'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input & Status Toggle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 sm:w-60">
          <Search className="w-4 h-4 text-[var(--tx-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search habits... (/)"
            className="input pl-9 pr-8 py-2 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx-muted)] hover:text-[var(--tx-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onToggleArchived}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0',
            showArchived
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-[var(--sf-overlay)] text-[var(--tx-secondary)] hover:text-[var(--tx-primary)] border-[var(--border-default)]'
          )}
        >
          {showArchived ? 'Archived' : 'Active'}
        </button>
      </div>
    </div>
  );
}

export default HabitCategoryFilter;
