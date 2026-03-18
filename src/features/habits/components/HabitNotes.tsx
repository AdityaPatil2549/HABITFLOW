import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Save, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/utils/cn'

interface HabitNotesProps {
  habitId: string
  date: string
  note?: string
  onSave: (note: string) => void
  className?: string
}

export const HabitNotes: FC<HabitNotesProps> = ({
  habitId,
  date,
  note,
  onSave,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState(note || '')

  const handleSave = () => {
    onSave(content)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center space-x-1 text-sm transition-colors',
          note ? 'text-brand-500' : 'text-muted-foreground hover:text-text',
          className
        )}
      >
        <BookOpen className="h-4 w-4" />
        <span>{note ? 'View Note' : 'Add Note'}</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Habit Journal Entry" size="md">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Date: {new Date(date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How did it go? Write your thoughts, reflections, or progress notes here..."
            className="w-full h-48 p-4 rounded-lg border border-border bg-surface text-text resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface HabitJournalProps {
  entries: Array<{
    date: string
    note: string
    completed: boolean
  }>
  className?: string
}

export const HabitJournal: FC<HabitJournalProps> = ({ entries, className }) => {
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-semibold text-text">Journal Entries</h3>
      
      {sortedEntries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No journal entries yet. Start adding notes to track your journey!
        </p>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map((entry) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-border bg-surface"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('en', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                {entry.completed && (
                  <span className="text-xs text-success font-medium">Completed</span>
                )}
              </div>
              <p className="text-text whitespace-pre-wrap">{entry.note}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
