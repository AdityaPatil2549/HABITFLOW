import { type FC } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'
import { habitTemplates, getAllCategories } from './habitTemplates'
import { HabitService } from '@/features/habits/services/habitService'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: () => void
}

export const TemplateSelector: FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const categories = getAllCategories()

  const handleSelectTemplate = async (templateId: string) => {
    const template = habitTemplates.find(t => t.id === templateId)
    if (!template) return

    try {
      await HabitService.createHabit({
        ...template.defaultHabit,
        name: template.defaultHabit.name || template.name,
        description: template.defaultHabit.description || template.description,
        category: template.category,
        color: template.color,
      } as any)
      onSelect()
      onClose()
    } catch (error) {
      console.error('Failed to create habit from template:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose a Habit Template" size="lg">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Select from our curated templates to quickly start tracking popular habits.
        </p>

        {categories.map(category => {
          const categoryTemplates = habitTemplates.filter(t => t.category === category)
          
          return (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-text flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <span>{category}</span>
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryTemplates.map(template => {
                  const Icon = template.icon
                  
                  return (
                    <motion.button
                      key={template.id}
                      className={cn(
                        'flex items-start space-x-3 p-4 rounded-lg border text-left transition-all',
                        'border-border bg-surface hover:border-brand-500 hover:shadow-md'
                      )}
                      onClick={() => handleSelectTemplate(template.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: template.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate">
                          {template.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      
                      <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => { onSelect(); onClose(); }}>
            Create Custom Habit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
