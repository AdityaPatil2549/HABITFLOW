import { create } from 'zustand';

// ── Types ───────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = persistent
}

export interface ConfirmItem {
  id: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

// ── Zustand Store ───────────────────────────────────────────────
interface ToastState {
  toasts: ToastItem[];
  confirm: ConfirmItem | null;
  add: (t: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
  showConfirm: (c: Omit<ConfirmItem, 'id'>) => void;
  dismissConfirm: () => void;
}

let _nextId = 1;

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  confirm: null,

  add: t => {
    const id = String(_nextId++);
    set(s => ({ toasts: [...s.toasts, { ...t, id }] }));
  },

  remove: id => set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })),

  showConfirm: c => set({ confirm: { ...c, id: String(_nextId++) } }),

  dismissConfirm: () => set({ confirm: null }),
}));

// ── Public API hook ─────────────────────────────────────────────
export function useToast() {
  const { add, showConfirm } = useToastStore();

  return {
    success: (message: string, duration?: number) => add({ type: 'success', message, duration }),
    error: (message: string, duration?: number) => add({ type: 'error', message, duration }),
    warning: (message: string, duration?: number) => add({ type: 'warning', message, duration }),
    info: (message: string, duration?: number) => add({ type: 'info', message, duration }),
    confirm: (
      message: string,
      onConfirm: () => void,
      options?: {
        confirmLabel?: string;
        cancelLabel?: string;
        danger?: boolean;
        onCancel?: () => void;
      }
    ) => showConfirm({ message, onConfirm, ...options }),
  };
}

