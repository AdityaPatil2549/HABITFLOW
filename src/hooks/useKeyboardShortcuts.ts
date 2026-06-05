import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../components/common/Toast';

export const SHORTCUT_DEFINITIONS = [
  { key: '1', description: 'Go to Dashboard' },
  { key: '2', description: 'Go to Habits' },
  { key: '3', description: 'Go to Tasks' },
  { key: '4', description: 'Go to Analytics' },
  { key: '5', description: 'Go to Focus' },
  { key: '6', description: 'Go to Profile' },
  { key: 'n', description: 'New habit' },
  { key: 't', description: 'New task' },
  { key: 'f', description: 'Toggle Focus timer' },
  { key: 'Cmd+K', description: 'Search' },
  { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  { key: 'Escape', description: 'Close any open modal/dialog' },
];

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
  onShowShortcuts?: () => void;
}) {
  const navigate = useNavigate();

  // Keep latest callbacks in a ref so the effect never needs to re-run
  const cb = useRef(options);
  useEffect(() => {
    cb.current = options;
  });

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement).isContentEditable;

      // Ctrl/Cmd+K → open search (always active, even while typing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        cb.current.onSearch?.();
        return;
      }

      // ESC: always active — read from store to avoid stale closure
      if (e.key === 'Escape') {
        // Also close native dialogs if open
        const openDialog = document.querySelector('dialog[open]') as HTMLDialogElement | null;
        if (openDialog && e.target !== openDialog) {
          // Native dialogs handle esc themselves, but we want to catch if needed
        }

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
      
      // Handle Shift+?
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        cb.current.onShowShortcuts?.();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          cb.current.onNewHabit?.();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          cb.current.onNewTask?.();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          cb.current.onToggleFocus?.();
          break;
        case '1':
          navigate('/dashboard');
          break;
        case '2':
          navigate('/habits');
          break;
        case '3':
          navigate('/tasks');
          break;
        case '4':
          navigate('/analytics');
          break;
        case '5':
          navigate('/focus');
          break;
        case '6':
          navigate('/profile');
          break;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // Stable deps only — callbacks are handled via ref
  }, [navigate]);
}
