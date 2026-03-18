import { type FC, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Badge } from '@/shared/components/ui/Badge'
import { CreateHabitSchema, type CreateHabit } from '../types'
import { 
  defaultColors, 
  defaultIcons, 
  habitTypeLabels, 
  frequencyTypeLabels,
  validateHabit 
} from '../utils/habitUtils'

interface HabitFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (habit: CreateHabit) => void
  initialHabit?: Partial<CreateHabit>
  title?: string
}

export const HabitForm: FC<HabitFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
  title = 'Create Habit',
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateHabit>({
    resolver: zodResolver(CreateHabitSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'boolean',
      frequency: {
        type: 'daily',
        days: [],
        interval: 1,
      },
      targetValue: 1,
      category: 'General',
      color: defaultColors[0],
      icon: defaultIcons[0],
      archived: false,
      ...initialHabit,
    },
  })

  // Sync form with initialHabit prop when it changes
  useEffect(() => {
    if (initialHabit) {
      Object.entries(initialHabit).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof CreateHabit, value)
        }
      })
    }
  }, [initialHabit, setValue])

  const habitType = watch('type')
  const frequencyType = watch('frequency.type')
  const selectedDays = watch('frequency.days') || []
  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDay = (dayIndex: number) => {
    const currentDays = selectedDays || []
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex]
    setValue('frequency.days', newDays)
  }

  const onFormSubmit = (data: CreateHabit) => {
    const validationErrors = validateHabit(data)
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors)
      return
    }
    onSubmit(data)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Habit Name"
            placeholder="e.g., Morning Meditation"
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <Input
            label="Description (optional)"
            placeholder="Add a short description..."
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Category"
            placeholder="e.g., Health, Productivity"
            error={errors.category?.message}
            {...register('category')}
            required
          />
        </div>

        {/* Habit Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Habit Type</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(habitTypeLabels).map(([type, label]) => (
              <label key={type} className="relative">
                <input
                  type="radio"
                  value={type}
                  className="sr-only peer"
                  {...register('type')}
                />
                <div className="p-3 border rounded-lg cursor-pointer transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 dark:peer-checked:bg-brand-900/20">
                  <div className="text-sm font-medium">{label}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.type?.message && (
            <p className="text-xs text-danger">{errors.type.message}</p>
          )}
        </div>

        {/* Target Value */}
        {(habitType === 'count' || habitType === 'duration') && (
          <Input
            label="Target Value"
            type="number"
            placeholder={habitType === 'duration' ? '30 (minutes)' : '10'}
            error={errors.targetValue?.message}
            {...register('targetValue', { valueAsNumber: true })}
            required
          />
        )}

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(frequencyTypeLabels).map(([type, label]) => (
              <label key={type} className="relative">
                <input
                  type="radio"
                  value={type}
                  className="sr-only peer"
                  {...register('frequency.type')}
                />
                <div className="p-3 border rounded-lg cursor-pointer transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 dark:peer-checked:bg-brand-900/20">
                  <div className="text-sm font-medium">{label}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.frequency?.type?.message && (
            <p className="text-xs text-danger">{errors.frequency.type?.message}</p>
          )}
        </div>

        {/* Weekly Days */}
        {frequencyType === 'weekly' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Days</label>
            <div className="flex space-x-2">
              {weekDays.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`w-10 h-10 rounded-lg border transition-colors ${
                    selectedDays.includes(index)
                      ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'border-border hover:border-brand-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interval */}
        {frequencyType === 'interval' && (
          <Input
            label="Repeat every X days"
            type="number"
            placeholder="e.g., 3"
            error={errors.frequency?.interval?.message}
            {...register('frequency.interval', { valueAsNumber: true })}
            required
          />
        )}

        {/* Color Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex space-x-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-text scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {defaultIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('icon', icon)}
                className={`p-2 rounded-lg border transition-colors ${
                  selectedIcon === icon
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-border hover:border-brand-300'
                }`}
              >
                <div className="text-lg">{icon}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {initialHabit ? 'Update Habit' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
