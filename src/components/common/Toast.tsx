import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 = persistent
}

interface ConfirmItem {
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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  confirm: null,

  add: (t) => {
    const id = String(_nextId++);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (t.duration !== 0) {
      const dur = t.duration ?? (t.type === 'error' ? 5000 : 3500);
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, dur);
    }
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  showConfirm: (c) => set({ confirm: { ...c, id: String(_nextId++) } }),

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
      options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean; onCancel?: () => void }
    ) => showConfirm({ message, onConfirm, ...options }),
  };
}

// ── Icon + Color config ─────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: React.FC<any>; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  error:   { icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  info:    { icon: Info,          color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)' },
};

// ── Single Toast ────────────────────────────────────────────────
function ToastCard({ toast }: { toast: ToastItem }) {
  const { remove } = useToastStore();
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)]"
      style={{
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px ${cfg.border}`,
      }}
    >
      <Icon size={18} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-semibold text-white flex-1 leading-relaxed break-words">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className="text-slate-500 hover:text-white transition-colors flex-shrink-0 ml-1 mt-0.5"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

// ── Confirm Dialog ──────────────────────────────────────────────
function ConfirmDialog() {
  const { confirm, dismissConfirm } = useToastStore();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirm) btnRef.current?.focus();
  }, [confirm]);

  if (!confirm) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
      style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) { confirm.onCancel?.(); dismissConfirm(); } }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15,23,42,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              confirm.danger ? 'bg-red-500/15' : 'bg-amber-500/15'
            }`}>
              {confirm.danger
                ? <XCircle size={20} className="text-red-400" />
                : <AlertTriangle size={20} className="text-amber-400" />}
            </div>
            <p className="text-white font-semibold text-base leading-relaxed pt-1">{confirm.message}</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { confirm.onCancel?.(); dismissConfirm(); }}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              {confirm.cancelLabel ?? 'Cancel'}
            </button>
            <button
              ref={btnRef}
              onClick={() => { confirm.onConfirm(); dismissConfirm(); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 ${
                confirm.danger
                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30'
              }`}
            >
              {confirm.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Provider (render in App.tsx) ───────────────────────────
export function ToastProvider() {
  const { toasts, confirm } = useToastStore();

  return (
    <>
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-6 z-[10000] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard toast={t} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirm && <ConfirmDialog key="confirm" />}
      </AnimatePresence>
    </>
  );
}
