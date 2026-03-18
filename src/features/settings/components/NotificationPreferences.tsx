import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Volume2, VolumeX, Mail, Smartphone, Clock } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'

interface NotificationSettings {
  habitReminders: boolean
  taskDueSoon: boolean
  taskOverdue: boolean
  dailySummary: boolean
  weeklyReport: boolean
  achievementUnlocked: boolean
  friendActivity: boolean
  challengeUpdates: boolean
  soundEffects: boolean
  doNotDisturb: boolean
  doNotDisturbStart: string
  doNotDisturbEnd: string
}

const defaultSettings: NotificationSettings = {
  habitReminders: true,
  taskDueSoon: true,
  taskOverdue: true,
  dailySummary: false,
  weeklyReport: true,
  achievementUnlocked: true,
  friendActivity: false,
  challengeUpdates: true,
  soundEffects: true,
  doNotDisturb: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '07:00',
}

interface NotificationPreferencesProps {
  className?: string
}

export const NotificationPreferences: FC<NotificationPreferencesProps> = ({ className }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Save to localStorage or backend
    localStorage.setItem('habitflow-notification-settings', JSON.stringify(settings))
    setHasChanges(false)
  }

  const SettingRow: FC<{
    icon: React.ReactNode
    title: string
    description: string
    setting: keyof NotificationSettings
    type?: 'toggle' | 'time'
  }> = ({ icon, title, description, setting, type = 'toggle' }) => {
    const value = settings[setting]

    return (
      <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <div>
            <h4 className="font-medium text-text">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {type === 'toggle' ? (
          <button
            onClick={() => updateSetting(setting, !value as any)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              value ? 'bg-brand-500' : 'bg-muted'
            )}
            aria-label={title}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5"
              animate={{ left: value ? '26px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        ) : (
          <input
            type="time"
            value={value as string}
            onChange={(e) => updateSetting(setting, e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-text"
            aria-label={title}
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize when and how you receive notifications
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
          <Bell className="h-6 w-6 text-brand-600" />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Habit & Task Notifications
        </h4>
        
        <SettingRow
          icon={<Clock className="h-5 w-5" />}
          title="Habit Reminders"
          description="Get reminded about habits at scheduled times"
          setting="habitReminders"
        />
        
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          title="Task Due Soon"
          description="Notify when tasks are due within 24 hours"
          setting="taskDueSoon"
        />
        
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          title="Overdue Tasks"
          description="Alert when tasks become overdue"
          setting="taskOverdue"
        />
      </div>

      <div className="space-y-1 mt-6">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Summary & Reports
        </h4>
        
        <SettingRow
          icon={<Mail className="h-5 w-5" />}
          title="Daily Summary"
          description="Receive a daily summary of your progress"
          setting="dailySummary"
        />
        
        <SettingRow
          icon={<Mail className="h-5 w-5" />}
          title="Weekly Report"
          description="Get your weekly progress report via email"
          setting="weeklyReport"
        />
      </div>

      <div className="space-y-1 mt-6">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Gamification & Social
        </h4>
        
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          title="Achievement Unlocked"
          description="Celebrate when you earn achievements"
          setting="achievementUnlocked"
        />
        
        <SettingRow
          icon={<Smartphone className="h-5 w-5" />}
          title="Friend Activity"
          description="Get updates about friends' progress"
          setting="friendActivity"
        />
        
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          title="Challenge Updates"
          description="Notifications about daily challenges"
          setting="challengeUpdates"
        />
      </div>

      <div className="space-y-1 mt-6">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Sound & Do Not Disturb
        </h4>
        
        <SettingRow
          icon={settings.soundEffects ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          title="Sound Effects"
          description="Play sounds for completions and achievements"
          setting="soundEffects"
        />
        
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          title="Do Not Disturb"
          description="Silence notifications during specific hours"
          setting="doNotDisturb"
        />
        
        {settings.doNotDisturb && (
          <div className="flex items-center space-x-4 py-4 pl-14">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Start</label>
              <input
                type="time"
                value={settings.doNotDisturbStart}
                onChange={(e) => updateSetting('doNotDisturbStart', e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-text"
                aria-label="Do not disturb start time"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">End</label>
              <input
                type="time"
                value={settings.doNotDisturbEnd}
                onChange={(e) => updateSetting('doNotDisturbEnd', e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-text"
                aria-label="Do not disturb end time"
              />
            </div>
          </div>
        )}
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex justify-end"
        >
          <Button onClick={handleSave}>Save Changes</Button>
        </motion.div>
      )}
    </div>
  )
}
