import { type FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee,
  CheckCircle,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Progress } from '@/shared/components/ui/Progress'
import { cn } from '@/shared/utils/cn'

interface PomodoroTimerProps {
  onComplete?: () => void
  className?: string
}

const WORK_TIME = 25 * 60 // 25 minutes in seconds
const BREAK_TIME = 5 * 60 // 5 minutes in seconds
const LONG_BREAK_TIME = 15 * 60 // 15 minutes

export const PomodoroTimer: FC<PomodoroTimerProps> = ({ onComplete, className }) => {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work')
  const [cycles, setCycles] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(mode === 'work' ? WORK_TIME : mode === 'break' ? BREAK_TIME : LONG_BREAK_TIME)
  }

  const switchMode = (newMode: 'work' | 'break' | 'longBreak') => {
    setMode(newMode)
    setIsActive(false)
    setTimeLeft(newMode === 'work' ? WORK_TIME : newMode === 'break' ? BREAK_TIME : LONG_BREAK_TIME)
  }

  const progress = ((mode === 'work' ? WORK_TIME : mode === 'break' ? BREAK_TIME : LONG_BREAK_TIME) - timeLeft) / 
                   (mode === 'work' ? WORK_TIME : mode === 'break' ? BREAK_TIME : LONG_BREAK_TIME) * 100

  return (
    <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-3 h-3 rounded-full',
            mode === 'work' ? 'bg-brand-500' : 'bg-success'
          )} />
          <span className="font-medium text-text">
            {mode === 'work' ? 'Focus Time' : mode === 'break' ? 'Short Break' : 'Long Break'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            title="Timer settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <motion.div
          className="text-6xl font-bold text-text tabular-nums"
          animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
        >
          {formatTime(timeLeft)}
        </motion.div>
        <p className="text-sm text-muted-foreground mt-2">
          Cycle {cycles + 1} • {mode === 'work' ? 'Stay focused!' : 'Take a break!'}
        </p>
      </div>

      {/* Progress */}
      <Progress value={progress} color={mode === 'work' ? 'primary' : 'success'} className="mb-6" />

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={resetTimer}
          className="w-12 h-12 p-0 rounded-full"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          onClick={toggleTimer}
          className={cn(
            'w-16 h-16 p-0 rounded-full',
            isActive && 'bg-danger hover:bg-danger/90'
          )}
        >
          {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}
          className="w-12 h-12 p-0 rounded-full"
        >
          {mode === 'work' ? <Coffee className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center space-x-2 mt-6">
        <button
          onClick={() => switchMode('work')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'work'
              ? 'bg-brand-500 text-white'
              : 'bg-muted text-muted-foreground hover:text-text'
          )}
        >
          Work (25m)
        </button>
        <button
          onClick={() => switchMode('break')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'break'
              ? 'bg-success text-white'
              : 'bg-muted text-muted-foreground hover:text-text'
          )}
        >
          Break (5m)
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'longBreak'
              ? 'bg-success text-white'
              : 'bg-muted text-muted-foreground hover:text-text'
          )}
        >
          Long Break (15m)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-text">{cycles}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-text">{Math.floor((cycles * WORK_TIME) / 60)}</p>
          <p className="text-xs text-muted-foreground">Focus Minutes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-text">{Math.floor((cycles * (WORK_TIME + BREAK_TIME)) / 60 / 60 * 10) / 10}</p>
          <p className="text-xs text-muted-foreground">Hours</p>
        </div>
      </div>
    </div>
  )
}

export const FocusMode: FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-surface flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <PomodoroTimer />
      </div>
    </div>
  )
}
