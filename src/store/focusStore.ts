import { create } from 'zustand';

export type FocusMode = 'focus' | 'break';

interface FocusTarget {
  id: string;
  title: string;
  type: 'habit' | 'task';
}

interface FocusState {
  isActive: boolean;
  isRunning: boolean;
  timeLeft: number;
  mode: FocusMode;
  target: FocusTarget | null;
  duration: number;        // seconds for current phase
  totalFocusSeconds: number; // seconds of actual focus time elapsed
  xpEarned: number;        // XP for the current/last session
  
  startFocus: (target: FocusTarget, durationMinutes?: number) => void;
  toggleTimer: () => void;
  stopFocus: () => void;
  tick: () => void;
  completeSession: () => void;
}

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

// XP formula: 1 XP per minute, minimum 5 XP for any focus session
function calcXP(focusSeconds: number): number {
  const minutes = focusSeconds / 60;
  return Math.max(5, Math.round(minutes));
}

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  isRunning: false,
  timeLeft: DEFAULT_FOCUS_MINUTES * 60,
  mode: 'focus',
  target: null,
  duration: DEFAULT_FOCUS_MINUTES * 60,
  totalFocusSeconds: 0,
  xpEarned: 0,

  startFocus: (target, durationMinutes = DEFAULT_FOCUS_MINUTES) => {
    const duration = durationMinutes * 60;
    set({
      isActive: true,
      isRunning: true,
      mode: 'focus',
      target,
      duration,
      timeLeft: duration,
      totalFocusSeconds: 0,
      xpEarned: 0,
    });
  },

  toggleTimer: () => {
    set((state) => ({ isRunning: !state.isRunning }));
  },

  stopFocus: () => {
    set({
      isActive: false,
      isRunning: false,
      target: null,
      totalFocusSeconds: 0,
      xpEarned: 0,
    });
  },

  completeSession: () => {
    const { mode, duration, totalFocusSeconds } = get();
    if (mode === 'focus') {
      // XP is calculated externally in FocusOverlay before calling this
      const breakDuration = DEFAULT_BREAK_MINUTES * 60;
      set({
        mode: 'break',
        timeLeft: breakDuration,
        duration: breakDuration,
        isRunning: false,
        xpEarned: calcXP(totalFocusSeconds),
      });
    } else {
      get().stopFocus();
    }
  },

  tick: () => {
    const { isRunning, timeLeft, mode } = get();
    if (!isRunning || timeLeft <= 0) return;

    if (timeLeft === 1) {
      // Accumulate last second only if in focus mode
      if (mode === 'focus') {
        set(s => ({ totalFocusSeconds: s.totalFocusSeconds + 1 }));
      }
      get().completeSession();
    } else {
      if (mode === 'focus') {
        set(s => ({ timeLeft: s.timeLeft - 1, totalFocusSeconds: s.totalFocusSeconds + 1 }));
      } else {
        set(s => ({ timeLeft: s.timeLeft - 1 }));
      }
    }
  },

  // Helper for external callers to get the current XP for time spent
  getTimeBasedXP: () => calcXP(get().totalFocusSeconds),
}));

// Export the formula so FocusOverlay can display live XP preview
export function calcFocusXP(focusSeconds: number): number {
  return Math.max(5, Math.round(focusSeconds / 60));
}
