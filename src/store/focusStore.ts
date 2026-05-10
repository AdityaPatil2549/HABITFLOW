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
  duration: number; // in seconds
  
  startFocus: (target: FocusTarget, durationMinutes?: number) => void;
  toggleTimer: () => void;
  stopFocus: () => void;
  tick: () => void;
  completeSession: () => void;
}

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  isRunning: false,
  timeLeft: DEFAULT_FOCUS_MINUTES * 60,
  mode: 'focus',
  target: null,
  duration: DEFAULT_FOCUS_MINUTES * 60,

  startFocus: (target, durationMinutes = DEFAULT_FOCUS_MINUTES) => {
    const duration = durationMinutes * 60;
    set({
      isActive: true,
      isRunning: true,
      mode: 'focus',
      target,
      duration,
      timeLeft: duration,
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
    });
  },

  completeSession: () => {
    const { mode } = get();
    if (mode === 'focus') {
      // Transition to break
      const duration = DEFAULT_BREAK_MINUTES * 60;
      set({
        mode: 'break',
        timeLeft: duration,
        duration,
        isRunning: false, // Wait for user to start break
      });
    } else {
      // Break is done, end entirely or ready for another focus?
      // Let's just end it.
      get().stopFocus();
    }
  },

  tick: () => {
    const { isRunning, timeLeft } = get();
    if (!isRunning || timeLeft <= 0) return;

    if (timeLeft === 1) {
      get().completeSession();
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },
}));
