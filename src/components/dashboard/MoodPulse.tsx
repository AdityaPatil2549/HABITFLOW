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
        <span className="font-label-caps">Mood Pulse</span>
        <span className="text-xs font-mono text-[var(--tx-secondary)]">
          {todayMood ? MOOD_LEVELS.find(m => m.score === todayMood.score)?.label : 'Tap to log'}
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
                'h-10 rounded-xl border text-lg flex items-center justify-center transition-transform duration-100 active:scale-95 cursor-pointer',
                active
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] scale-105'
                  : 'bg-[var(--sf-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
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
