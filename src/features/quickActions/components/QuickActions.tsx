import { type FC, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Target, 
  CheckSquare, 
  Zap, 
  Command,
  Search,
  X
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/utils/cn'

interface QuickAction {
  id: string
  label: string
  shortcut: string
  icon: React.ReactNode
  action: () => void
}

interface QuickActionsMenuProps {
  onAddHabit: () => void
  onAddTask: () => void
  onFocusMode: () => void
  onSearch: () => void
  className?: string
}

export const QuickActionsMenu: FC<QuickActionsMenuProps> = ({
  onAddHabit,
  onAddTask,
  onFocusMode,
  onSearch,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const actions: QuickAction[] = [
    {
      id: 'add-habit',
      label: 'Add Habit',
      shortcut: '⌘H',
      icon: <Target className="h-4 w-4" />,
      action: () => { onAddHabit(); setIsOpen(false); },
    },
    {
      id: 'add-task',
      label: 'Add Task',
      shortcut: '⌘T',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => { onAddTask(); setIsOpen(false); },
    },
    {
      id: 'focus-mode',
      label: 'Focus Mode',
      shortcut: '⌘F',
      icon: <Zap className="h-4 w-4" />,
      action: () => { onFocusMode(); setIsOpen(false); },
    },
    {
      id: 'search',
      label: 'Search',
      shortcut: '⌘K',
      icon: <Search className="h-4 w-4" />,
      action: () => { onSearch(); setIsOpen(false); },
    },
  ]

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Cmd/Ctrl + H for habit
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault()
        onAddHabit()
      }

      // Cmd/Ctrl + T for task
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault()
        onAddTask()
      }

      // Cmd/Ctrl + F for focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        onFocusMode()
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onAddHabit, onAddTask, onFocusMode])

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg',
          'flex items-center justify-center hover:bg-brand-600 transition-colors z-40',
          className
        )}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Command className="h-6 w-6" />
      </motion.button>

      {/* Quick Actions Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg bg-surface rounded-xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="flex items-center space-x-3 p-4 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent border-none outline-none text-text placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-accent"
                  title="Close"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Actions List */}
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {filteredActions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No commands found
                  </p>
                ) : (
                  filteredActions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
                      onClick={action.action}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          {action.icon}
                        </div>
                        <span className="text-text">{action.label}</span>
                      </div>
                      <kbd className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground font-mono">
                        {action.shortcut}
                      </kbd>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">↵</kbd>
                    <span>Select</span>
                  </span>
                </div>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const KeyboardShortcutsHelp: FC = () => {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setShowHelp(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const shortcuts = [
    { key: '⌘K', action: 'Open Quick Actions' },
    { key: '⌘H', action: 'Add New Habit' },
    { key: '⌘T', action: 'Add New Task' },
    { key: '⌘F', action: 'Focus Mode' },
    { key: '⌘/', action: 'Show Shortcuts' },
    { key: 'Esc', action: 'Close Modal/Menu' },
  ]

  return (
    <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Keyboard Shortcuts" size="md">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Speed up your workflow with these keyboard shortcuts.
        </p>

        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2">
              <span className="text-text">{shortcut.action}</span>
              <kbd className="px-3 py-1 rounded-lg bg-muted text-sm font-mono text-muted-foreground">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setShowHelp(false)}>Got it</Button>
        </div>
      </div>
    </Modal>
  )
}
