import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../components/common/Toast';

/**
 * Global keyboard shortcuts for HabitFlow.
 * Must be mounted once inside BrowserRouter (App.tsx).
 */
export function useKeyboardShortcuts(options: {
  onNewHabit?: () => void;
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleFocus?: () => void;
}) {
  const navigate = useNavigate();
  const { confirm: activeConfirm, dismissConfirm } = useToastStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement).isContentEditable;

      // ESC: close confirm dialogs / modals (always active)
      if (e.key === 'Escape') {
        if (activeConfirm) { activeConfirm.onCancel?.(); dismissConfirm(); }
        return;
      }

      // Don't fire shortcuts while typing
      if (isTyping) return;

      // No modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          options.onNewHabit?.();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          options.onNewTask?.();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          options.onToggleFocus?.();
          break;
        case '?':
          e.preventDefault();
          // TODO: open shortcuts modal
          break;
        // g + letter navigation (sequential)
        case 'h':
        case 'H':
          navigate('/habits');
          break;
        case 'd':
        case 'D':
          navigate('/dashboard');
          break;
        case 'a':
        case 'A':
          navigate('/analytics');
          break;
        case 'p':
        case 'P':
          navigate('/profile');
          break;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, activeConfirm, dismissConfirm, options]);
}
