import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusStore, calcFocusXP } from '../../store/focusStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { soundService } from '../../services/soundService';
import { Play, Pause, XCircle, CheckCircle2, Coffee, Zap, Timer } from 'lucide-react';

const DURATION_PRESETS = [15, 25, 30, 45, 60, 90];

// ── Duration Picker (shown before focus starts) ──────────────────
function DurationPicker({
  onStart,
  onCancel,
  targetTitle,
}: {
  onStart: (minutes: number) => void;
  onCancel: () => void;
  targetTitle?: string;
}) {
  const [selected, setSelected] = useState(25);
  const [custom, setCustom] = useState('');

  const minutes = custom ? parseInt(custom, 10) || selected : selected;
  const xpPreview = Math.max(5, minutes);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Glow orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-brand-400 pointer-events-none" />

      <div className="relative z-10 px-6 w-full max-w-sm" style={{ display: 'block', width: '100%', maxWidth: '384px', flexShrink: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Timer size={28} className="text-brand-400" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-2">Focus Mode</p>
          <h2 className="text-2xl font-black text-white mb-2">Set your duration</h2>
          {targetTitle && (
            <p className="text-sm text-slate-500 truncate px-4">for: <span className="text-slate-300 font-semibold">{targetTitle}</span></p>
          )}
        </div>

        {/* Preset pills */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {DURATION_PRESETS.map(min => (
            <button
              key={min}
              onClick={() => { setSelected(min); setCustom(''); }}
              className={`py-3 rounded-2xl text-sm font-bold transition-all border ${
                selected === min && !custom
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-lg shadow-brand-500/10'
                  : 'bg-white/[0.03] border-white/8 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {min}<span className="text-[10px] font-normal ml-0.5 opacity-60">m</span>
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="relative mb-6">
          <input
            type="number"
            min={1}
            max={480}
            placeholder="Custom (mins)"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(0); }}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-medium outline-none placeholder-slate-600 focus:border-brand-500/40 transition-all text-center"
          />
          {custom && parseInt(custom) > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-400 font-bold">✓</span>
          )}
        </div>

        {/* XP preview */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 rounded-2xl bg-amber-500/8 border border-amber-500/15">
          <Zap size={14} className="text-amber-400" />
          <p className="text-sm text-slate-300">
            Complete session → earn <span className="text-amber-400 font-black">{xpPreview > 0 ? `~${xpPreview} XP` : '—'}</span>
          </p>
        </div>
        <p className="text-center text-xs text-slate-600 mb-6">1 XP per minute · minimum 5 XP</p>

        {/* Actions */}
        <button
          onClick={() => onStart(minutes)}
          disabled={minutes < 1 || minutes > 480}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-500 to-violet-600 shadow-xl shadow-brand-500/25 active:scale-95 transition-all text-base mb-3 disabled:opacity-40"
        >
          Start {minutes}min Focus ⏱
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl text-slate-500 text-sm font-semibold hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── Active Focus Overlay ─────────────────────────────────────────
export function FocusOverlay() {
  const {
    isActive, isRunning, timeLeft, mode, target, duration,
    totalFocusSeconds, xpEarned,
    toggleTimer, stopFocus, tick, completeSession,
  } = useFocusStore();
  const { addXP } = useGamificationStore();
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const startFocusStore = useFocusStore(s => s.startFocus);

  const [pendingTarget, setPendingTarget] = useState<any>(null);

  // Expose a global "open picker" function for the sidebar/mobile buttons
  useEffect(() => {
    (window as any).__openFocusPicker = (target?: any) => {
      setPendingTarget(target || { id: 'quick', title: 'Focus Session', type: 'habit' });
      setShowPicker(true);
    };
    return () => { delete (window as any).__openFocusPicker; };
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => { tick(); }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Award XP when focus phase ends naturally or early
  useEffect(() => {
    if (isActive && mode === 'break' && !xpAwarded && xpEarned > 0) {
      setXpAwarded(true);
      addXP(xpEarned);
      soundService.playLevelUp();
    }
    if (!isActive) setXpAwarded(false);
  }, [mode, isActive, xpEarned, addXP, xpAwarded]);

  // Handle "mark done early" — award time-based XP
  function handleCompleteEarly() {
    if (mode === 'focus' && !xpAwarded) {
      const earned = calcFocusXP(totalFocusSeconds);
      setXpAwarded(true);
      addXP(earned);
      soundService.playLevelUp();
    }
    completeSession();
  }

  const isFocus = mode === 'focus';
  const progress = ((duration - timeLeft) / duration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const liveXP = calcFocusXP(totalFocusSeconds);

  // Show picker if requested and no session running
  if (showPicker && !isActive) {
    return (
      <DurationPicker
        targetTitle={pendingTarget?.title || target?.title}
        onStart={mins => {
          setShowPicker(false);
          startFocusStore(pendingTarget || target || { id: 'quick', title: 'Focus Session', type: 'habit' }, mins);
        }}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
      >
        {/* Background atmosphere */}
        <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${isFocus ? 'bg-indigo-950/30' : 'bg-emerald-950/20'}`} />
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.07] pointer-events-none ${isFocus ? 'bg-brand-400' : 'bg-emerald-400'} ${isRunning ? 'animate-pulse' : ''}`} />

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
          <div
            className={`h-full transition-all duration-1000 ${isFocus ? 'bg-gradient-to-r from-brand-500 to-violet-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-8 w-full">

          {/* Mode label */}
          {isFocus ? (
            <p className="text-brand-400 font-black tracking-[0.25em] uppercase text-[11px] mb-3">
              🎯 Deep Focus
            </p>
          ) : (
            <p className="text-emerald-400 font-black tracking-[0.25em] uppercase text-[11px] mb-3 flex items-center gap-2">
              <Coffee size={13} /> Rest & Recharge
            </p>
          )}

          {/* Target title */}
          {target && isFocus && (
            <h2 className="text-lg font-bold text-white/60 mb-8 truncate w-full">{target.title}</h2>
          )}
          {!isFocus && (
            <h2 className="text-lg font-bold text-white/60 mb-8">
              You earned <span className="text-amber-400 font-black">+{xpEarned} XP</span>! Take a breather.
            </h2>
          )}

          {/* Circular timer */}
          <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="88" fill="none"
                stroke={isFocus ? '#818cf8' : '#34d399'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
                style={{ filter: `drop-shadow(0 0 12px ${isFocus ? '#818cf8' : '#34d399'})` }}
              />
            </svg>
            <div className="text-center">
              <span className="text-6xl font-black tabular-nums tracking-tight text-white">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              <p className="text-slate-500 text-sm mt-1 font-medium">{isFocus ? 'remaining' : 'break time'}</p>
            </div>
          </div>

          {/* Live XP counter — only during focus */}
          {isFocus && totalFocusSeconds > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-6 py-2 px-4 rounded-full bg-amber-500/10 border border-amber-500/20"
            >
              <Zap size={13} className="text-amber-400" />
              <span className="text-sm font-bold text-amber-400">
                {liveXP} XP earned so far
              </span>
            </motion.div>
          )}
          {(!isFocus || totalFocusSeconds === 0) && <div className="mb-6" />}

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            {/* Stop / Give Up */}
            <button
              onClick={stopFocus}
              title="End session"
              className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition-all"
            >
              <XCircle size={22} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 text-white ${isFocus ? 'bg-gradient-to-r from-brand-500 to-violet-600 shadow-brand-500/30' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30'}`}
            >
              {isRunning
                ? <Pause size={30} fill="currentColor" />
                : <Play size={30} fill="currentColor" className="ml-1" />}
            </button>

            {/* Mark done early */}
            <button
              onClick={handleCompleteEarly}
              title={isFocus ? 'Mark done & take break' : 'End break'}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-500/30 text-slate-500 hover:text-emerald-400 transition-all"
            >
              <CheckCircle2 size={22} />
            </button>
          </div>

          <p className="text-slate-600 text-xs mt-8 leading-relaxed">
            {isFocus
              ? `Stay focused — you earn 1 XP per minute.`
              : "The next session starts when you're ready."}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
