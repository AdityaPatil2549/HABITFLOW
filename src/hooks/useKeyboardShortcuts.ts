import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../components/common/Toast';

/**
 * Global keyboard shortcuts for HabitFlow.
 * Must be mounted once inside BrowserRouter (Layout).
 * Uses refs so callbacks never cause effect re-runs.
 */
export function useKeyboardShortcuts(options: {
  onNewHabit?: () => void;
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleFocus?: () => void;
  onEscape?: () => void;
}) {
  const navigate = useNavigate();

  // Keep latest callbacks in a ref so the effect never needs to re-run
  const cb = useRef(options);
  useEffect(() => { cb.current = options; });

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement).isContentEditable;

      // Ctrl/Cmd+K → open search (always active, even while typing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        cb.current.onSearch?.();
        return;
      }

      // ESC: always active — read from store to avoid stale closure
      if (e.key === 'Escape') {
        const store = useToastStore.getState();
        if (store.confirm) {
          store.confirm.onCancel?.();
          store.dismissConfirm();
        }
        cb.current.onEscape?.();
        return;
      }

      // Single-key shortcuts — don't fire when typing or with modifiers
      if (isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'n': case 'N':
          e.preventDefault(); cb.current.onNewHabit?.(); break;
        case 't': case 'T':
          e.preventDefault(); cb.current.onNewTask?.(); break;
        case 'f': case 'F':
          e.preventDefault(); cb.current.onToggleFocus?.(); break;
        case 'h': case 'H':
          navigate('/habits'); break;
        case 'd': case 'D':
          navigate('/dashboard'); break;
        case 'a': case 'A':
          navigate('/analytics'); break;
        case 'p': case 'P':
          navigate('/profile'); break;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // Stable deps only — callbacks are handled via ref
  }, [navigate]);
}
