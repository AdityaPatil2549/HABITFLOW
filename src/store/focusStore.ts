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

  showPicker: boolean;
  pickerTarget: FocusTarget | null;
  openPicker: (target?: FocusTarget) => void;
  closePicker: () => void;
  
  startFocus: (target: FocusTarget, durationMinutes?: number) => void;
  toggleTimer: () => void;
  stopFocus: () => void;
  tick: () => void;
  completeSession: () => void;
  getTimeBasedXP: () => number;
}

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const STORAGE_KEY = 'hf_focus_session';

// XP formula: 1 XP per minute, minimum 5 XP for any focus session
function calcXP(focusSeconds: number): number {
  const minutes = focusSeconds / 60;
  return Math.max(5, Math.round(minutes));
}

// Persist critical focus state to sessionStorage so it survives page refresh
function persistFocus(state: Partial<FocusState>) {
  try {
    const data = {
      isActive: state.isActive,
      timeLeft: state.timeLeft,
      mode: state.mode,
      target: state.target,
      duration: state.duration,
      totalFocusSeconds: state.totalFocusSeconds,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded or private browsing */ }
}

function clearPersistedFocus() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

function loadPersistedFocus(): Partial<FocusState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.isActive) return null;
    // Adjust timeLeft for elapsed time since save
    const elapsedSinceSave = Math.floor((Date.now() - data.savedAt) / 1000);
    const adjustedTimeLeft = Math.max(0, data.timeLeft - elapsedSinceSave);
    const additionalFocus = data.mode === 'focus' ? Math.min(elapsedSinceSave, data.timeLeft) : 0;
    return {
      isActive: true,
      isRunning: false, // paused on reload — user must manually resume
      timeLeft: adjustedTimeLeft,
      mode: data.mode,
      target: data.target,
      duration: data.duration,
      totalFocusSeconds: data.totalFocusSeconds + additionalFocus,
    };
  } catch { return null; }
}

const restored = loadPersistedFocus();

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: restored?.isActive ?? false,
  isRunning: restored?.isRunning ?? false,
  timeLeft: restored?.timeLeft ?? DEFAULT_FOCUS_MINUTES * 60,
  mode: restored?.mode ?? 'focus',
  target: restored?.target ?? null,
  duration: restored?.duration ?? DEFAULT_FOCUS_MINUTES * 60,
  totalFocusSeconds: restored?.totalFocusSeconds ?? 0,
  xpEarned: 0,
  
  showPicker: false,
  pickerTarget: null,
  
  openPicker: (target) => set({ 
    showPicker: true, 
    pickerTarget: target || { id: 'quick', title: 'Focus Session', type: 'habit' } 
  }),
  
  closePicker: () => set({ showPicker: false, pickerTarget: null }),

  startFocus: (target, durationMinutes = DEFAULT_FOCUS_MINUTES) => {
    const duration = durationMinutes * 60;
    const newState = {
      isActive: true,
      isRunning: true,
      mode: 'focus' as FocusMode,
      target,
      duration,
      timeLeft: duration,
      totalFocusSeconds: 0,
      xpEarned: 0,
    };
    set(newState);
    persistFocus(newState);
  },

  toggleTimer: () => {
    set((state) => {
      const next = { ...state, isRunning: !state.isRunning };
      persistFocus(next);
      return { isRunning: next.isRunning };
    });
  },

  stopFocus: () => {
    clearPersistedFocus();
    set({
      isActive: false,
      isRunning: false,
      target: null,
      totalFocusSeconds: 0,
      xpEarned: 0,
    });
  },

  completeSession: () => {
    const { mode, totalFocusSeconds } = get();
    if (mode === 'focus') {
      // XP is calculated externally in FocusOverlay before calling this
      const breakDuration = DEFAULT_BREAK_MINUTES * 60;
      const newState = {
        mode: 'break' as FocusMode,
        timeLeft: breakDuration,
        duration: breakDuration,
        isRunning: false,
        xpEarned: calcXP(totalFocusSeconds),
      };
      set(newState);
      persistFocus({ ...get(), ...newState });
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
      // Persist every 10 seconds to avoid excessive writes
      if (timeLeft % 10 === 0) {
        persistFocus(get());
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
