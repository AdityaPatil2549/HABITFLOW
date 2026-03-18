import { type FC, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  CheckSquare, 
  BarChart3, 
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HabitFlow',
    description: 'Your journey to building better habits starts here. Track habits, manage tasks, and achieve your goals with our powerful tools.',
    icon: <Sparkles className="h-12 w-12 text-brand-500" />,
  },
  {
    id: 'habits',
    title: 'Build Better Habits',
    description: 'Create habits with customizable types (boolean, count, duration, rating). Set reminders, track streaks, and watch your progress grow.',
    icon: <Target className="h-12 w-12 text-success" />,
  },
  {
    id: 'tasks',
    title: 'Stay Organized',
    description: 'Manage your tasks with priorities, due dates, and dependencies. Never miss a deadline with our smart task management system.',
    icon: <CheckSquare className="h-12 w-12 text-info" />,
  },
  {
    id: 'analytics',
    title: 'Track Your Progress',
    description: 'Visualize your achievements with beautiful charts. See completion trends, habit correlations, and productivity insights.',
    icon: <BarChart3 className="h-12 w-12 text-warning" />,
  },
  {
    id: 'gamification',
    title: 'Earn Rewards',
    description: 'Earn points, unlock achievements, and climb the leaderboard. Every completed habit and task brings you closer to your goals.',
    icon: <Trophy className="h-12 w-12 text-purple-500" />,
  },
]

interface OnboardingTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const OnboardingTutorial: FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setIsCompleted(false)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsCompleted(true)
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const step = onboardingSteps[currentStep]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
        >
          <motion.div
            className="relative w-full max-w-lg bg-surface rounded-xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-text">HabitFlow</span>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                title="Skip tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20">
                      {step.icon}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-text">
                    {step.title}
                  </h2>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress */}
              <div className="flex items-center justify-center space-x-2 mt-6">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index === currentStep
                        ? 'w-6 bg-brand-500'
                        : index < currentStep
                        ? 'bg-brand-300'
                        : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={cn(currentStep === 0 && 'invisible')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="text-sm text-muted-foreground">
                {currentStep + 1} of {onboardingSteps.length}
              </div>

              <Button onClick={handleNext}>
                {currentStep === onboardingSteps.length - 1 ? (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('habitflow-onboarding-completed')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem('habitflow-onboarding-completed', 'true')
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('habitflow-onboarding-completed')
    setShowOnboarding(true)
  }

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
