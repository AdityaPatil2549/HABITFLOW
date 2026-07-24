"use client";

import React, { createContext, useContext } from 'react';

type SelectionMode = 'single' | 'multiple';

interface TagGroupContextValue {
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  selectionMode: SelectionMode;
}

const TagGroupContext = createContext<TagGroupContextValue>({
  selectedKeys: new Set(),
  onSelectionChange: () => {},
  selectionMode: 'single',
});

interface JollyTagGroupProps {
  label?: string;
  selectionMode?: SelectionMode;
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  children: React.ReactNode;
  className?: string;
}

export function JollyTagGroup({
  label,
  selectionMode = 'single',
  selectedKeys,
  onSelectionChange,
  children,
  className = '',
}: JollyTagGroupProps) {
  return (
    <TagGroupContext.Provider value={{ selectedKeys, onSelectionChange, selectionMode }}>
      <div className={className}>
        {label && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            {label}
          </p>
        )}
        {children}
      </div>
    </TagGroupContext.Provider>
  );
}

export function TagList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}

interface TagProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Tag({ id, children, className = '', style }: TagProps) {
  const { selectedKeys, onSelectionChange, selectionMode } = useContext(TagGroupContext);
  const isSelected = selectedKeys.has(id);

  function handleClick() {
    if (selectionMode === 'single') {
      onSelectionChange(new Set([id]));
    } else {
      const next = new Set(selectedKeys);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
        isSelected
          ? 'text-white border-brand-500/60 bg-brand-500/20'
          : 'text-slate-400 border-white/10 bg-white/5 hover:bg-white/10 hover:text-slate-200'
      } ${className}`}
      style={style}
      aria-pressed={isSelected}
    >
      {children}
    </button>
  );
}
