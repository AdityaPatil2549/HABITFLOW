import { type FC } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Target, 
  CheckSquare,
  Download,
  Mail,
  Share2
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Badge } from '@/shared/components/ui/Badge'
import { Progress } from '@/shared/components/ui/Progress'
import { useState } from 'react'
import { cn } from '@/shared/utils/cn'

interface ReportData {
  period: 'weekly' | 'monthly'
  startDate: string
  endDate: string
  habitsCompleted: number
  totalHabits: number
  tasksCompleted: number
  totalTasks: number
  completionRate: number
  bestStreak: number
  totalPoints: number
  topHabits: Array<{ name: string; count: number }>
  completionByDay: Array<{ day: string; completed: number; total: number }>
}

interface ReportGeneratorProps {
  className?: string
}

export const ReportGenerator: FC<ReportGeneratorProps> = ({ className }) => {
  const [showModal, setShowModal] = useState(false)
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data - in real app this would come from analytics
  const mockReport: ReportData = {
    period: reportType,
    startDate: '2026-03-11',
    endDate: '2026-03-18',
    habitsCompleted: 42,
    totalHabits: 56,
    tasksCompleted: 18,
    totalTasks: 25,
    completionRate: 75,
    bestStreak: 12,
    totalPoints: 340,
    topHabits: [
      { name: 'Drink Water', count: 7 },
      { name: 'Morning Exercise', count: 6 },
      { name: 'Read Books', count: 5 },
    ],
    completionByDay: [
      { day: 'Mon', completed: 8, total: 10 },
      { day: 'Tue', completed: 9, total: 10 },
      { day: 'Wed', completed: 7, total: 10 },
      { day: 'Thu', completed: 8, total: 10 },
      { day: 'Fri', completed: 6, total: 10 },
      { day: 'Sat', completed: 4, total: 8 },
      { day: 'Sun', completed: 5, total: 8 },
    ],
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsGenerating(false)
  }

  const handleDownload = () => {
    // Create a simple text report
    const report = `
HABITFLOW ${reportType.toUpperCase()} REPORT
========================================
Period: ${mockReport.startDate} to ${mockReport.endDate}

SUMMARY
-------
Habits Completed: ${mockReport.habitsCompleted}/${mockReport.totalHabits}
Tasks Completed: ${mockReport.tasksCompleted}/${mockReport.totalTasks}
Completion Rate: ${mockReport.completionRate}%
Best Streak: ${mockReport.bestStreak} days
Total Points: ${mockReport.totalPoints}

TOP HABITS
----------
${mockReport.topHabits.map((h, i) => `${i + 1}. ${h.name}: ${h.count} days`).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitflow-${reportType}-report-${mockReport.endDate}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `My HabitFlow ${reportType} Report`,
        text: `I completed ${mockReport.habitsCompleted} habits with a ${mockReport.completionRate}% completion rate this ${reportType}!`,
      })
    }
  }

  return (
    <>
      <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Progress Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate and download your progress reports
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-brand-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted">
            <Calendar className="h-5 w-5 text-brand-500 mb-2" />
            <p className="text-sm font-medium text-text">Weekly Report</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <Calendar className="h-5 w-5 text-success mb-2" />
            <p className="text-sm font-medium text-text">Monthly Report</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </div>

        <Button onClick={() => setShowModal(true)} className="w-full">
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Generate Progress Report" 
        size="lg"
      >
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="text-sm font-medium text-text mb-2 block">Report Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setReportType('weekly')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg border text-center transition-all',
                  reportType === 'weekly'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border bg-surface text-muted-foreground hover:text-text'
                )}
              >
                <Calendar className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Weekly</span>
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg border text-center transition-all',
                  reportType === 'monthly'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border bg-surface text-muted-foreground hover:text-text'
                )}
              >
                <Calendar className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Monthly</span>
              </button>
            </div>
          </div>

          {/* Report Preview */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-text">Report Preview</h4>
              <Badge variant="secondary">{mockReport.startDate} - {mockReport.endDate}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="h-4 w-4 text-brand-500" />
                  <span className="text-sm text-muted-foreground">Habits</span>
                </div>
                <p className="text-xl font-bold text-text">{mockReport.habitsCompleted}/{mockReport.totalHabits}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckSquare className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Tasks</span>
                </div>
                <p className="text-xl font-bold text-text">{mockReport.tasksCompleted}/{mockReport.totalTasks}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium text-text">{mockReport.completionRate}%</span>
              </div>
              <Progress value={mockReport.completionRate} color="primary" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-text">{mockReport.bestStreak}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-text">{mockReport.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                </motion.div>
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Email Report'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
