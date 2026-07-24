import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smile, GripHorizontal, Plus, Check } from 'lucide-react';
import { useMoodStore } from '../../store/moodStore';
import { cn } from '../../lib/utils';
import type { MoodScore } from '../../types';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent } from '../ui/morphing-popover';
import { DynamicIcon } from '../ui/DynamicIcon';

export function MoodWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const { todayMood, logMood } = useMoodStore();
  const [savingMood, setSavingMood] = useState(false);
  const [note, setNote] = useState(todayMood?.note || '');

  useEffect(() => {
    setNote(todayMood?.note || '');
  }, [todayMood]);

  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="w-full relative group widget-container">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 z-50 p-2 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg backdrop-blur-md"
        >
          <GripHorizontal size={20} />
        </div>
      )}
      <TiltCard borderGlow style={{ transformStyle: 'preserve-3d' } as any}>
        <SpotlightCard className="rounded-[2.5rem] p-6 sm:p-10" style={{ transformStyle: 'preserve-3d' } as any}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Smile size={18} className="text-brand-400" />
              <h2 className="text-xs sm:text-sm font-bold text-white">
                How are you feeling today?
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {todayMood && (
                <MorphingPopover>
                  <MorphingPopoverTrigger className="text-[10px] sm:text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-brand-400/10 transition-colors">
                    <Plus size={12} /> {todayMood.note ? 'Edit Note' : 'Add Note'}
                  </MorphingPopoverTrigger>
                  <MorphingPopoverContent className="w-64 p-3 flex flex-col gap-2 relative z-50">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mood Note</label>
                    <textarea
                      className="input w-full min-h-20 resize-none text-sm bg-slate-800/50"
                      placeholder="Why do you feel this way?"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                         logMood(todayMood.score, note);
                         document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                      }}
                      className="btn-primary py-1.5 text-xs w-full mt-1"
                    >
                      <Check size={14} /> Save
                    </button>
                  </MorphingPopoverContent>
                </MorphingPopover>
              )}
              {todayMood && <span className="text-xs text-slate-500 font-medium">Logged ✔</span>}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1" style={{ transformStyle: 'preserve-3d' } as any}>
            {(
              [
                {
                  score: 1,
                  emoji: '😫',
                  label: 'Rough',
                  color: '#f43f5e',
                },
                {
                  score: 2,
                  emoji: '😕',
                  label: 'Meh',
                  color: '#fb923c',
                },
                {
                  score: 3,
                  emoji: '😐',
                  label: 'Okay',
                  color: '#facc15',
                },
                {
                  score: 4,
                  emoji: '🙂',
                  label: 'Good',
                  color: '#4ade80',
                },
                {
                  score: 5,
                  emoji: '😄',
                  label: 'Great',
                  color: '#10b981',
                },
              ] as { score: MoodScore; emoji: string; label: string; color: string }[]
            ).map(({ score, emoji, label, color }) => {
              const isSelected = todayMood?.score === score;
              return (
                <div
                  key={score}
                  role="button"
                  tabIndex={0}
                  onMouseDown={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (savingMood) return;
                    setSavingMood(true);
                    try {
                      await logMood(score);
                    } finally {
                      setSavingMood(false);
                    }
                  }}
                  className="flex flex-col items-center group/mood relative py-2 z-20 cursor-pointer touch-manipulation"
                >
                  <div
                    className={cn(
                      'mood-ring mb-2 sm:mb-3 relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform duration-500',
                      isSelected && 'active animate-mood-bounce'
                    )}
                    style={{ '--ring-color': color + '40' } as any}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                        style={{ background: color + '50' }}
                        transition={{ type: 'spring', bounce: 0.2 }}
                      />
                    )}
                    <DynamicIcon
                      tiltIntensity={isSelected ? 40 : 25}
                      glowColor={color}
                      interactive={true}
                    >
                      <span
                        className={cn(
                          'relative z-10 text-3xl sm:text-4xl transition-all duration-300',
                          isSelected
                            ? 'scale-125 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]'
                            : 'saturate-0 opacity-50 group-hover/mood:saturate-100 group-hover/mood:opacity-100 group-hover/mood:scale-125 group-hover/mood:drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] group-active/mood:scale-95'
                        )}
                        style={isSelected ? { filter: `drop-shadow(0 0 20px ${color})` } : {}}
                      >
                        {emoji}
                      </span>
                    </DynamicIcon>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-bold tracking-tight transition-colors relative z-10',
                      isSelected ? 'text-white' : 'text-slate-500 group-hover/mood:text-slate-300'
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      </TiltCard>
    </div>
  );
}
