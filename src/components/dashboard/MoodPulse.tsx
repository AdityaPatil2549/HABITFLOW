import { useEffect } from 'react';
import { useMoodStore } from '@/store/moodStore';
import type { MoodScore } from '@/types';
import { cn } from '@/lib/utils';
import { soundService } from '@/services/soundService';

const MOOD_LEVELS: { score: MoodScore; emoji: string; label: string }[] = [
  { score: 1, emoji: '😤', label: 'Strained' },
  { score: 2, emoji: '😕', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Neutral' },
  { score: 4, emoji: '🙂', label: 'Steady' },
  { score: 5, emoji: '😊', label: 'Sharp' },
];

export function MoodPulse() {
  const { todayMood, loadMoods, logMood } = useMoodStore();

  useEffect(() => {
    loadMoods();
  }, [loadMoods]);

  return (
    <section aria-label="Mood Pulse" className="card-raised p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="font-label-caps">Mood Pulse</span>
        </div>
        <span className="text-xs font-mono font-medium text-[var(--accent-ink)]">
          {todayMood ? `${MOOD_LEVELS.find(m => m.score === todayMood.score)?.label} (${todayMood.score}/5)` : 'Tap to log'}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Daily mood rating">
        {MOOD_LEVELS.map(level => {
          const active = todayMood?.score === level.score;
          return (
            <button
              key={level.score}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`Log mood ${level.label} (${level.score}/5)`}
              onClick={() => {
                soundService.playTick();
                logMood(level.score);
              }}
              className={cn(
                'h-11 rounded-xl border text-xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer',
                active
                  ? level.score === 1
                    ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.35)] scale-110'
                    : level.score === 2
                      ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.35)] scale-110'
                      : level.score === 3
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.35)] scale-110'
                        : level.score === 4
                          ? 'bg-sky-500/15 border-sky-500 shadow-[0_0_14px_rgba(56,189,248,0.35)] scale-110'
                          : 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.35)] scale-110'
                  : 'bg-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:scale-105'
              )}
            >
              <span aria-hidden="true">{level.emoji}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

