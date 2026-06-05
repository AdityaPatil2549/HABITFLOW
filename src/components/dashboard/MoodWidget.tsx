import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, GripHorizontal } from 'lucide-react';
import { useMoodStore } from '../../store/moodStore';
import { cn } from '../../lib/utils';
import type { MoodScore } from '../../types';
import { SpotlightCard } from '../ui/SpotlightCard';
import { TiltCard } from '../ui/TiltCard';
import { Scroll3DReveal } from '../ui/Scroll3DReveal';

export function MoodWidget({ dragHandleProps }: { dragHandleProps?: any }) {
  const { todayMood, logMood } = useMoodStore();
  const [savingMood, setSavingMood] = useState(false);

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
      <Scroll3DReveal delay={0.3}>
        <TiltCard borderGlow>
          <SpotlightCard variants={item} className="rounded-[2.5rem] p-6 sm:p-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Smile size={18} className="text-brand-400" />
                <h2 className="text-xs sm:text-sm font-bold text-white">How are you feeling today?</h2>
              </div>
              {todayMood && <span className="text-xs text-slate-500 font-medium">Logged ✔</span>}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { score: 1, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f61e/512.webp', label: 'Rough', color: '#f43f5e' },
                  { score: 2, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f615/512.webp', label: 'Meh', color: '#fb923c' },
                  { score: 3, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/512.webp', label: 'Okay', color: '#facc15' },
                  { score: 4, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.webp', label: 'Good', color: '#4ade80' },
                  { score: 5, emojiUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.webp', label: 'Great', color: '#10b981' },
                ] as { score: MoodScore; emojiUrl: string; label: string; color: string }[]
              ).map(({ score, emojiUrl, label, color }) => {
                const isSelected = todayMood?.score === score;
                return (
                  <button
                    key={score}
                    disabled={savingMood}
                    onClick={async () => {
                      setSavingMood(true);
                      try {
                        await logMood(score);
                      } finally {
                        setSavingMood(false);
                      }
                    }}
                    className="flex flex-col items-center group/mood relative py-2 z-10"
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
                          layoutId="mood-glow"
                          className="absolute inset-0 rounded-full blur-xl"
                          style={{ background: color + '50' }}
                        />
                      )}
                      <img
                        src={emojiUrl}
                        alt={label}
                        className={cn(
                          'relative z-10 w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-300',
                          isSelected
                            ? 'scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                            : 'saturate-0 opacity-40 group-hover/mood:saturate-100 group-hover/mood:opacity-100 group-hover/mood:scale-110 group-hover/mood:drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-active/mood:scale-95'
                        )}
                        style={
                          isSelected
                            ? { filter: `drop-shadow(0 0 16px ${color}80)` }
                            : {}
                        }
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-bold tracking-tight transition-colors relative z-10',
                        isSelected ? 'text-white' : 'text-slate-500 group-hover/mood:text-slate-300'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>
        </TiltCard>
      </Scroll3DReveal>
    </div>
  );
}
