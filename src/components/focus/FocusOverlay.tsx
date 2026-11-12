import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusStore, calcFocusXP } from '../../store/focusStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { soundService } from '../../services/soundService';
import {
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  Coffee,
  Zap,
  Timer,
  ShieldAlert,
  Music,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';

const DURATION_PRESETS = [15, 25, 30, 45, 60, 90];

// ── Duration Picker (shown before focus starts) ──────────────────
function DurationPicker({
  onStart,
  onCancel,
  targetTitle,
}: {
  onStart: (minutes: number, isStrict: boolean) => void;
  onCancel: () => void;
  targetTitle?: string;
}) {
  const [selected, setSelected] = useState(25);
  const [custom, setCustom] = useState('');
  const [isStrict, setIsStrict] = useState(false);

  const minutes = custom ? parseInt(custom, 10) || selected : selected;
  const xpPreview = Math.max(5, minutes);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-[var(--sf-base)]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="relative z-10 px-6 w-full max-w-sm"
        style={{ display: 'block', width: '100%', maxWidth: '384px', flexShrink: 0 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent)]/25 flex items-center justify-center">
            <Timer size={28} className="text-[var(--accent-ink)]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-ink)] mb-2">
            Focus Mode
          </p>
          <h2 className="text-2xl font-black text-[var(--tx-primary)] mb-2">Set your duration</h2>
          {targetTitle && (
            <p className="text-sm text-[var(--tx-muted)] truncate px-4">
              for: <span className="text-[var(--tx-secondary)] font-semibold">{targetTitle}</span>
            </p>
          )}
        </div>

        {/* Preset pills */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {DURATION_PRESETS.map(min => (
            <button
              key={min}
              onClick={() => {
                setSelected(min);
                setCustom('');
              }}
              className={`py-3 rounded-xl text-sm font-bold font-mono transition-all border cursor-pointer ${
                selected === min && !custom
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--sf-raised)] border-[var(--border-default)] text-[var(--tx-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--tx-primary)]'
              }`}
            >
              {min}
              <span className="text-[10px] font-normal ml-0.5 opacity-60">m</span>
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
            onChange={e => {
              setCustom(e.target.value);
              setSelected(0);
            }}
            className="input rounded-xl px-5 py-3.5 text-sm font-medium text-center"
          />
          {custom && parseInt(custom) > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--accent-ink)] font-bold">
              ✓
            </span>
          )}
        </div>

        {/* Strict Mode Toggle */}
        <div
          onClick={() => setIsStrict(!isStrict)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl mb-6 cursor-pointer border transition-all ${
            isStrict ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--sf-raised)] border-[var(--border-default)]'
          }`}
        >
          <div>
            <h4
              className={`text-sm font-bold flex items-center gap-2 ${isStrict ? 'text-rose-400' : 'text-[var(--tx-secondary)]'}`}
            >
              <ShieldAlert size={14} /> Strict Mode
            </h4>
            <p className="text-[10px] text-[var(--tx-muted)] mt-0.5 leading-tight">
              Timer fails if you leave the app for &gt;5 seconds.
            </p>
          </div>
          <div
            className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-1 ${isStrict ? 'bg-rose-500' : 'bg-[var(--sf-dim)] border border-[var(--border-default)]'}`}
          >
            <motion.div
              layout
              className="w-3 h-3 bg-white rounded-full shadow-sm"
              animate={{ x: isStrict ? 20 : 0 }}
              transition={{ duration: 0.12 }}
            />
          </div>
        </div>

        {/* XP preview */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Zap size={14} className="text-amber-400" />
          <p className="text-sm text-[var(--tx-secondary)]">
            Complete session → earn{' '}
            <span className="text-amber-400 font-black font-mono">
              {xpPreview > 0 ? `~${xpPreview} XP` : '—'}
            </span>
          </p>
        </div>
        <p className="text-center text-xs text-[var(--tx-muted)] mb-6">1 XP per minute · minimum 5 XP</p>

        {/* Actions */}
        <button
          onClick={() => onStart(minutes, isStrict)}
          disabled={minutes < 1 || minutes > 480}
          className="btn-primary w-full py-4 font-bold text-base mb-3 disabled:opacity-40"
        >
          Start {minutes}min Focus ⏱
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl text-[var(--tx-muted)] text-sm font-semibold hover:text-[var(--tx-primary)] transition-colors cursor-pointer"
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
    isActive,
    isRunning,
    timeLeft,
    mode,
    target,
    duration,
    totalFocusSeconds,
    xpEarned,
    toggleTimer,
    stopFocus,
    tick,
    completeSession,
    showPicker,
    pickerTarget,
    closePicker,
    startFocus: startFocusStore,
    isStrict,
  } = useFocusStore();
  const { addXP } = useGamificationStore();
  const [xpAwarded, setXpAwarded] = useState(false);

  // Strict Mode Logic
  const [strictWarning, setStrictWarning] = useState(false);
  const strictTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !isRunning || !isStrict || mode !== 'focus') return;

    function handleVisibilityChange() {
      if (document.hidden) {
        // User left the tab - start 5 second countdown
        strictTimerRef.current = window.setTimeout(() => {
          soundService.playUncheck();
          stopFocus();
          alert(
            '💥 Strict Mode Violation: You left the focus screen for >5 seconds. Session failed.'
          );
        }, 5000);
      } else {
        // User returned
        if (strictTimerRef.current) {
          clearTimeout(strictTimerRef.current);
          strictTimerRef.current = null;
          setStrictWarning(true);
          setTimeout(() => setStrictWarning(false), 3000);
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (strictTimerRef.current) clearTimeout(strictTimerRef.current);
    };
  }, [isActive, isRunning, isStrict, mode, stopFocus]);

  // Ambient Audio Logic
  const [ambientSound, setAmbientSound] = useState<'off' | 'brown' | 'white'>('off');

  useEffect(() => {
    if (ambientSound === 'off') {
      soundService.stopAmbient();
    } else {
      soundService.startAmbient(ambientSound);
    }
    return () => soundService.stopAmbient();
  }, [ambientSound]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Award XP when focus phase ends naturally or early
  useEffect(() => {
    if (isActive && mode === 'break' && !xpAwarded && xpEarned > 0) {
      const timer = setTimeout(() => {
        setXpAwarded(true);
        addXP(xpEarned);
        soundService.playLevelUp();
      }, 0);
      return () => clearTimeout(timer);
    }
    if (!isActive && xpAwarded) {
      const timer = setTimeout(() => {
        setXpAwarded(false);
      }, 0);
      return () => clearTimeout(timer);
    }
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
        targetTitle={pickerTarget?.title || target?.title}
        onStart={mins => {
          closePicker();
          startFocusStore(
            pickerTarget || target || { id: 'quick', title: 'Focus Session', type: 'habit' },
            mins
          );
        }}
        onCancel={() => closePicker()}
      />
    );
  }

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.14 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--sf-base)] text-[var(--tx-primary)] overflow-hidden"
      >

        {/* Ambient Sound Controls */}
        <div className="absolute top-6 right-6 z-50">
          <div className="flex bg-[var(--sf-raised)] rounded-full border border-[var(--border-default)] p-1 shadow-lg">
            <button
              type="button"
              aria-label="Turn ambient sound off"
              onClick={() => setAmbientSound('off')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${ambientSound === 'off' ? 'bg-[var(--sf-overlay)] text-[var(--tx-primary)]' : 'text-[var(--tx-muted)] hover:text-[var(--tx-secondary)]'}`}
              title="Sound Off"
            >
              <VolumeX size={16} />
            </button>
            <button
              type="button"
              aria-label="Enable brown noise ambient audio"
              onClick={() => setAmbientSound('brown')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${ambientSound === 'brown' ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)]' : 'text-[var(--tx-muted)] hover:text-[var(--tx-secondary)]'}`}
              title="Brown Noise"
            >
              <Music size={16} />
            </button>
          </div>
        </div>

        {/* Strict Warning Overlay */}
        <AnimatePresence>
          {strictWarning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="absolute top-20 z-50 bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-xl border border-rose-400/30"
            >
              <AlertTriangle size={20} />
              Careful! Stay on this screen to keep your XP.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-[var(--sf-overlay)]">
          <div
            className="h-full transition-all duration-1000 bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="relative z-10 flex flex-col items-center text-center px-8 w-full shrink-0"
          style={{ maxWidth: '384px' }}
        >
          {/* Mode label */}
          {isFocus ? (
            <p className="text-[var(--accent-ink)] font-black tracking-[0.25em] uppercase text-[11px] mb-3">
              🎯 Deep Focus
            </p>
          ) : (
            <p className="text-emerald-400 font-black tracking-[0.25em] uppercase text-[11px] mb-3 flex items-center gap-2">
              <Coffee size={13} /> Rest & Recharge
            </p>
          )}

          {/* Target title */}
          {target && isFocus && (
            <h2 className="text-lg font-bold text-[var(--tx-secondary)] mb-8 truncate w-full">{target.title}</h2>
          )}
          {!isFocus && (
            <h2 className="text-lg font-bold text-[var(--tx-secondary)] mb-8">
              You earned <span className="text-amber-400 font-black font-mono">+{xpEarned} XP</span>! Take a
              breather.
            </h2>
          )}

          {/* Circular progress timer */}
          <div className="relative w-72 h-72 mx-auto mb-6 flex items-center justify-center">
            {/* Progress ring SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 z-10" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="6"
              />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={isFocus ? 'var(--accent)' : '#34d399'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>

            {/* Timer text on top */}
            <div className="text-center z-20 relative">
              <span className="text-6xl font-black font-mono tabular-nums tracking-tight text-[var(--tx-primary)]">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
              <p className="text-[var(--tx-muted)] text-sm mt-1 font-medium">
                {isFocus ? 'remaining' : 'break time'}
              </p>
            </div>
          </div>

          {/* Live XP counter — only during focus */}
          {isFocus && totalFocusSeconds > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14 }}
              className="flex items-center justify-center gap-2 mb-6 py-2 px-5 rounded-full bg-amber-500/10 border border-amber-500/20 whitespace-nowrap"
            >
              <Zap size={14} className="text-amber-400" />
              <span className="text-sm font-black font-mono text-amber-400">{liveXP} XP earned so far</span>
            </motion.div>
          )}
          {(!isFocus || totalFocusSeconds === 0) && <div className="mb-6" />}

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            {/* Stop / Give Up */}
            <button
              type="button"
              onClick={stopFocus}
              aria-label="End focus session"
              title="End session"
              className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--sf-raised)] border border-[var(--border-default)] hover:bg-red-500/15 hover:border-red-500/30 text-[var(--tx-muted)] hover:text-red-400 transition-all cursor-pointer"
            >
              <XCircle size={22} />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={toggleTimer}
              aria-label={isRunning ? 'Pause focus timer' : 'Resume focus timer'}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-150 active:scale-95 cursor-pointer ${isFocus ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--ok)] text-[var(--accent-fg)]'}`}
            >
              {isRunning ? (
                <Pause size={30} fill="currentColor" />
              ) : (
                <Play size={30} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Mark done early */}
            <button
              type="button"
              onClick={handleCompleteEarly}
              aria-label={isFocus ? 'Complete focus session early' : 'End break early'}
              title={isFocus ? 'Mark done & take break' : 'End break'}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--sf-raised)] border border-[var(--border-default)] hover:bg-emerald-500/15 hover:border-emerald-500/30 text-[var(--tx-muted)] hover:text-emerald-400 transition-all cursor-pointer"
            >
              <CheckCircle2 size={22} />
            </button>
          </div>

          <p className="text-[var(--tx-muted)] text-xs mt-8 leading-relaxed whitespace-nowrap">
            {isFocus
              ? `Stay focused — you earn 1 XP per minute.`
              : "The next session starts when you're ready."}
          </p>
        </div>

        {/* Global animations handle the 3D loader and text effects */}
      </motion.div>
    </AnimatePresence>
  );
}
