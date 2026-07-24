import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame, Play, Square, Star } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { IconRenderer } from '../common/IconRenderer';
import { useCompletionEffects } from '../ui/CompletionEffects';
import { AnimatedCheckmark } from '../ui/AnimatedCheckmark';
import { useToast } from '../common/Toast';
import { format, isBefore, startOfToday, parseISO } from 'date-fns';
import { useGamificationStore } from '../../store/gamificationStore';
import type { HabitWithStreak } from '../../types';

interface HabitItemCardProps {
  habit: HabitWithStreak;
}

export function HabitItemCard({ habit: h }: HabitItemCardProps) {
  const { logHabit, unlogHabit, applyFreeze, selectedDate } = useHabitStore();
  const { fireConfetti } = useCompletionEffects();
  const toast = useToast();
  const logDebounceRef = useRef<boolean>(false);

  // Determine if it's considered "done"
  // For count: done if value >= targetValue
  // For duration: done if value >= targetValue
  // For rating: done if value > 0
  const currentValue = h.todayLog ? h.todayLog.value : 0;
  const isDone = h.type === 'boolean' 
    ? currentValue >= 1 
    : h.type === 'rating'
      ? currentValue > 0
      : currentValue >= h.targetValue;

  // Local state for duration timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(currentValue * 60); // value is in minutes

  useEffect(() => {
    // Sync external value changes
    if (!timerRunning && h.type === 'duration') {
      setElapsedSeconds(currentValue * 60);
    }
  }, [currentValue, h.type, timerRunning]);

  useEffect(() => {
    let interval: number;
    if (timerRunning) {
      interval = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next / 60 >= h.targetValue) {
            setTimerRunning(false);
            handleLog(h.targetValue); // hit target
            return h.targetValue * 60;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, h.targetValue]);

  const handleLog = async (newValue: number) => {
    if (logDebounceRef.current) return;
    logDebounceRef.current = true;
    
    const wasDone = isDone;
    let action: Promise<void>;
    
    if (wasDone && newValue === 0) {
      action = unlogHabit(h.id);
    } else {
      action = logHabit(h.id, newValue);
      if (!wasDone && (
        (h.type === 'boolean' && newValue >= 1) ||
        (h.type === 'rating' && newValue > 0) ||
        (h.type === 'count' && newValue >= h.targetValue) ||
        (h.type === 'duration' && newValue >= h.targetValue)
      )) {
        fireConfetti();
      }
    }
    
    Promise.resolve(action).finally(() => {
      logDebounceRef.current = false;
    });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // If it's a boolean habit, clicking anywhere toggles it
    if (h.type === 'boolean') {
      handleLog(isDone ? 0 : 1);
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`p-3 rounded-2xl border transition-all ${h.type === 'boolean' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group/habit flex items-center gap-3 ${
        isDone
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 hover:bg-brand-500/5'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${h.type === 'boolean' ? 'group-active/habit:scale-90' : ''} ${isDone ? 'bg-emerald-500/20' : 'bg-white/5'}`}
      >
        <IconRenderer
          name={h.icon}
          size={18}
          color={isDone ? '#10b981' : 'var(--brand-400)'}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${isDone ? 'text-emerald-400' : 'text-white'}`}>
          {h.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5 relative">
          {h.streak.current >= 7 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-1 -top-1 w-4 h-4 bg-orange-500/20 rounded-full blur-sm"
            />
          )}
          <Flame
            size={10}
            className={
              h.streak.current >= 7
                ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                : h.streak.current > 0
                  ? 'text-orange-500/80'
                  : 'text-slate-600'
            }
          />
          <span className={`text-[10px] font-bold ${h.streak.current >= 7 ? 'text-orange-400' : 'text-slate-500'}`}>
            {h.streak.current}d streak
          </span>
        </div>
      </div>

      {/* Controls based on habit type */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {!isDone && h.todayLog?.isFrozen && (
          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs" title="Streak Frozen">
            🧊
          </div>
        )}
        {!isDone && !h.todayLog?.isFrozen && isBefore(parseISO(selectedDate), startOfToday()) && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const xp = await import('../../db').then(m => m.getOrCreateUserXP());
              if ((xp.streakFreezes || 0) <= 0) {
                toast.error('No Streak Freezes left! Buy them in the Shop.');
                return;
              }
              await applyFreeze(h.id);
              toast.success('🧊 Streak Freeze applied!');
            }}
            className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center font-bold text-xs transition-colors border border-blue-500/20"
            title="Use Streak Freeze"
          >
            🧊
          </button>
        )}
        
        {h.type === 'boolean' && (
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}
          >
            {isDone && <AnimatedCheckmark size={18} strokeWidth={2.5} />}
          </div>
        )}

        {h.type === 'count' && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] font-medium text-slate-400">
              {currentValue} / {h.targetValue} {h.unit}
            </span>
            {!isDone && (
              <button 
                onClick={() => handleLog(currentValue + 1)}
                className="w-6 h-6 rounded-md bg-brand-500/20 text-brand-400 hover:bg-brand-500/40 flex items-center justify-center font-bold pb-0.5 transition-colors"
              >
                +
              </button>
            )}
            {isDone && (
              <button 
                onClick={() => handleLog(0)}
                className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 flex items-center justify-center font-bold transition-colors"
              >
                <AnimatedCheckmark size={14} />
              </button>
            )}
          </div>
        )}

        {h.type === 'duration' && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} / {h.targetValue}m
            </span>
            {!isDone && (
              <button 
                onClick={() => {
                  if (timerRunning) {
                    setTimerRunning(false);
                    // Log current elapsed time in minutes
                    handleLog(Math.floor(elapsedSeconds / 60));
                  } else {
                    setTimerRunning(true);
                  }
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${timerRunning ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/40' : 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/40'}`}
              >
                {timerRunning ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
              </button>
            )}
            {isDone && (
              <button 
                onClick={() => {
                  setElapsedSeconds(0);
                  handleLog(0);
                }}
                className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 flex items-center justify-center font-bold transition-colors"
              >
                <AnimatedCheckmark size={14} />
              </button>
            )}
          </div>
        )}

        {h.type === 'rating' && (
          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleLog(currentValue === star ? 0 : star)}
                className={`p-0.5 transition-colors ${star <= currentValue ? 'text-yellow-400' : 'text-white/10 hover:text-white/30'}`}
              >
                <Star size={14} fill={star <= currentValue ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
