import { useEffect, useState } from 'react';
import { useFocusStore } from '../../store/focusStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { soundService } from '../../services/soundService';
import { Play, Pause, XCircle, CheckCircle2, Coffee } from 'lucide-react';

export function FocusOverlay() {
  const { isActive, isRunning, timeLeft, mode, target, duration, toggleTimer, stopFocus, tick, completeSession } = useFocusStore();
  const { addXP } = useGamificationStore();
  const [xpAwarded, setXpAwarded] = useState(false);

  // Timer interval — runs every second when active
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => { tick(); }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Watch for focus session completion (timer reaches 0 in focus mode)
  const prevTimeLeft = useFocusStore.getState().timeLeft;
  useEffect(() => {
    if (isActive && timeLeft === 0 && mode === 'focus' && !xpAwarded) {
      setXpAwarded(true);
      addXP(50);
      soundService.playLevelUp();
    }
    if (timeLeft > 0) setXpAwarded(false);
  }, [timeLeft, isActive, mode, addXP, xpAwarded]);

  if (!isActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  const isFocus = mode === 'focus';
  const colorClass = isFocus ? 'brand' : 'emerald';
  const gradientBg = isFocus
    ? 'from-brand-500 to-brand-600'
    : 'from-emerald-500 to-emerald-600';
  const shadowColor = isFocus ? 'brand-500/20' : 'emerald-500/20';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden">
      {/* Animated background glow */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${isFocus ? 'bg-brand-950/50' : 'bg-emerald-950/30'}`} />
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none ${isFocus ? 'bg-brand-400' : 'bg-emerald-400'} ${isRunning ? 'animate-pulse' : ''}`}
      />

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
        <div
          className={`h-full transition-all duration-1000 bg-gradient-to-r ${gradientBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-8 w-full">

        {/* Mode label */}
        {isFocus ? (
          <p className="text-brand-400 font-bold tracking-[0.2em] uppercase text-xs mb-3">
            🎯 Deep Focus Session
          </p>
        ) : (
          <p className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-xs mb-3 flex items-center gap-2">
            <Coffee size={14} /> Rest & Recharge
          </p>
        )}

        {/* Target name */}
        {target && isFocus && (
          <h2 className="text-xl font-semibold text-white/70 mb-10 truncate w-full">{target.title}</h2>
        )}
        {!isFocus && (
          <h2 className="text-xl font-semibold text-white/70 mb-10">You earned <span className="text-amber-400 font-bold">+50 XP</span>! Take a breather.</h2>
        )}

        {/* Circular timer */}
        <div className="relative w-60 h-60 mx-auto mb-12 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Track */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Progress arc */}
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke={isFocus ? '#818cf8' : '#34d399'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-center">
            <span className="text-6xl font-black tabular-nums tracking-tight">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
            <p className="text-slate-500 text-sm mt-1 font-medium">{isFocus ? 'remaining' : 'break'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          {/* Give Up */}
          <button
            onClick={stopFocus}
            title="Give Up"
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all"
          >
            <XCircle size={22} />
          </button>

          {/* Play / Pause */}
          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 text-white bg-gradient-to-r ${gradientBg} shadow-${shadowColor}`}
          >
            {isRunning
              ? <Pause size={30} fill="currentColor" />
              : <Play size={30} fill="currentColor" className="ml-1" />}
          </button>

          {/* Complete early */}
          <button
            onClick={() => {
              if (isFocus) {
                addXP(50);
                soundService.playLevelUp();
              }
              completeSession();
            }}
            title={isFocus ? 'Mark done & take break' : 'End break'}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
          >
            <CheckCircle2 size={22} />
          </button>
        </div>

        {/* Hint */}
        <p className="text-slate-600 text-xs mt-8">
          {isFocus ? 'Stay focused. Your progress is being tracked.' : 'The next session starts when you\'re ready.'}
        </p>
      </div>
    </div>
  );
}
