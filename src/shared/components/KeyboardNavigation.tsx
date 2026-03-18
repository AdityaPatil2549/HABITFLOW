import { useEffect, useCallback, type FC } from 'react'

interface KeyboardShortcutsProps {
  children: React.ReactNode
}

export const KeyboardShortcuts: FC<KeyboardShortcutsProps> = ({ children }) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? e.metaKey : e.ctrlKey

    // Global shortcuts
    if (modKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault()
          // Open quick actions
          window.dispatchEvent(new CustomEvent('open-quick-actions'))
          break
        case 'h':
          e.preventDefault()
          // Add new habit
          window.location.href = '/habits?action=add'
          break
        case 't':
          e.preventDefault()
          // Add new task
          window.location.href = '/tasks?action=add'
          break
        case 'f':
          e.preventDefault()
          // Focus mode
          window.dispatchEvent(new CustomEvent('toggle-focus-mode'))
          break
        case '/':
          e.preventDefault()
          // Show keyboard shortcuts help
          window.dispatchEvent(new CustomEvent('show-keyboard-help'))
          break
      }
    }

    // Navigation shortcuts (no modifier)
    switch (e.key) {
      case 'Escape':
        // Close modals, drawers, menus
        window.dispatchEvent(new CustomEvent('close-all-modals'))
        break
      case 'g':
        // Go to... (wait for next key)
        // g + d = dashboard, g + h = habits, etc.
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return <>{children}</>
}

// Hook for focus management
export const useFocusManager = () => {
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    firstElement?.focus()
  }, [])

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    lastElement?.focus()
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [])

  return { focusFirst, focusLast, trapFocus }
}

// Skip link component for accessibility
export const SkipLink: FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg"
    >
      Skip to main content
    </a>
  )
}

// Focus ring component
export const FocusRing: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 rounded-lg">
      {children}
    </div>
  )
}
