import React, { useState } from 'react';
import { format, getISOWeek } from 'date-fns';
import { Sparkles, Check, Flame, Smile, Zap, CloudRain, Shield } from 'lucide-react';
import { soundService } from '../../../services/soundService';
import { useToast } from '../../common/toastStore';
import { cn } from '../../../lib/utils';

const MOOD_OPTIONS = [
  { id: 'fire', label: 'On Fire', desc: 'Peak flow & output', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', icon: Flame },
  { id: 'steady', label: 'Good Flow', desc: 'Consistent progress', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: Smile },
  { id: 'breakthrough', label: 'Breakthrough', desc: 'New habits formed', color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', icon: Zap },
  { id: 'struggling', label: 'Friction', desc: 'Faced obstacles', color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10', icon: CloudRain },
  { id: 'rest', label: 'Recovery', desc: 'Intentional reset', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10', icon: Shield },
];

export function WeeklyReflectionCard() {
  const toast = useToast();
  const year = format(new Date(), 'yyyy');
  const week = getISOWeek(new Date());
  const STORAGE_KEY = `habitflow-reflection-${year}-W${week}`;

  const [selectedMood, setSelectedMood] = useState<string>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return data.mood || '';
    } catch { return ''; }
  });

  const [reflection, setReflection] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        win: data.win || '',
        friction: data.friction || '',
        intention: data.intention || '',
      };
    } catch {
      return { win: '', friction: '', intention: '' };
    }
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mood: selectedMood,
        win: reflection.win,
        friction: reflection.friction,
        intention: reflection.intention,
        savedAt: new Date().toISOString(),
      }));
      setIsSaved(true);
      soundService.playBadge();
      toast.success('Weekly retrospective preserved locally.');
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      toast.error('Failed to save reflection.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mood Selector Grid */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--tx-muted)] mb-3">
          1. Psychological Energy &amp; Rhythm
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {MOOD_OPTIONS.map(m => {
            const IconComponent = m.icon;
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMood(m.id);
                  soundService.playTick();
                }}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-colors duration-150 flex flex-col justify-between h-24 relative overflow-hidden cursor-pointer',
                  isSelected
                    ? `${m.bg} ${m.border}`
                    : 'bg-[var(--sf-raised)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--sf-overlay)]'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <IconComponent size={18} className={m.color} />
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--tx-primary)] leading-tight">
                    {m.label}
                  </div>
                  <div className="text-[10px] text-[var(--tx-muted)] font-mono">
                    {m.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Structured Tri-Field Reflection Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Field 1: The Win */}
        <div className="p-4 rounded-xl card-raised flex flex-col">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5 flex items-center gap-1.5">
            2. Biggest Breakthrough / Win
          </label>
          <textarea
            rows={3}
            value={reflection.win}
            onChange={e => setReflection(prev => ({ ...prev, win: e.target.value }))}
            placeholder="What habit felt effortless or gave you immense energy?"
            className="w-full flex-1 bg-transparent text-xs text-[var(--tx-primary)] placeholder:text-[var(--tx-muted)] resize-none outline-none leading-relaxed border-t border-[var(--border-default)] pt-2"
          />
        </div>

        {/* Field 2: The Friction */}
        <div className="p-4 rounded-xl card-raised flex flex-col">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5 flex items-center gap-1.5">
            3. Friction / Roadblock
          </label>
          <textarea
            rows={3}
            value={reflection.friction}
            onChange={e => setReflection(prev => ({ ...prev, friction: e.target.value }))}
            placeholder="Where did discipline lapse or fatigue disrupt the ritual?"
            className="w-full flex-1 bg-transparent text-xs text-[var(--tx-primary)] placeholder:text-[var(--tx-muted)] resize-none outline-none leading-relaxed border-t border-[var(--border-default)] pt-2"
          />
        </div>

        {/* Field 3: Next Week's Intention */}
        <div className="p-4 rounded-xl card-raised flex flex-col">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--tx-secondary)] mb-1.5 flex items-center gap-1.5">
            4. Core Intention For Next Week
          </label>
          <textarea
            rows={3}
            value={reflection.intention}
            onChange={e => setReflection(prev => ({ ...prev, intention: e.target.value }))}
            placeholder="Single non-negotiable standard (e.g. 20m reading at 8 AM)"
            className="w-full flex-1 bg-transparent text-xs text-[var(--tx-primary)] placeholder:text-[var(--tx-muted)] resize-none outline-none leading-relaxed border-t border-[var(--border-default)] pt-2"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            'px-5 py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-colors duration-150 active:scale-[0.98] cursor-pointer',
            isSaved
              ? 'bg-[var(--ok-subtle)] text-[var(--ok)] border border-[var(--ok)]/30'
              : 'btn-secondary'
          )}
        >
          {isSaved ? (
            <>
              <Check size={14} className="text-[var(--ok)]" />
              Retrospective Preserved
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-[var(--accent)]" />
              Preserve Weekly Reflection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
