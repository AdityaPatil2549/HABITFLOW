import { type FC, useState, useEffect } from 'react'
import { Settings, Bell, User, Palette, Globe, Shield, Database, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'

interface SettingsSection {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

const SettingsSection: FC<SettingsSection> = ({ title, icon, children }) => (
  <div className="rounded-lg border border-border bg-surface p-6">
    <div className="flex items-center space-x-3 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-text">{title}</h3>
    </div>
    {children}
  </div>
)

export const SettingsPage: FC = () => {
  // Load settings from localStorage on mount
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('habitflow-notifications')
    return saved ? JSON.parse(saved) : {
      habitReminders: true,
      taskDueSoon: true,
      taskOverdue: true,
      dailySummary: false,
      weeklyReport: true,
      achievementUnlocked: true,
    }
  })

  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('habitflow-appearance')
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    }
  })

  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem('habitflow-privacy')
    return saved ? JSON.parse(saved) : {
      shareProgress: false,
      publicProfile: false,
      dataCollection: 'minimal',
    }
  })

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('habitflow-data')
    return saved ? JSON.parse(saved) : {
      autoBackup: true,
      exportFormat: 'json',
      clearCache: false,
    }
  })

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('habitflow-notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('habitflow-appearance', JSON.stringify(appearance))
  }, [appearance])

  useEffect(() => {
    localStorage.setItem('habitflow-privacy', JSON.stringify(privacy))
  }, [privacy])

  useEffect(() => {
    localStorage.setItem('habitflow-data', JSON.stringify(data))
  }, [data])

  const handleSaveSettings = () => {
    // Save all settings to localStorage or backend
    console.log('Saving settings:', { notifications, appearance, privacy, data })
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setNotifications({
        habitReminders: true,
        taskDueSoon: true,
        taskOverdue: true,
        dailySummary: false,
        weeklyReport: true,
        achievementUnlocked: true,
      })
      setAppearance({
        theme: 'light',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      })
      setPrivacy({
        shareProgress: false,
        publicProfile: false,
        dataCollection: 'minimal',
      })
      setData({
        autoBackup: true,
        exportFormat: 'json',
        clearCache: false,
      })
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      // Clear localStorage, IndexedDB, etc.
      console.log('Clearing all data...')
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your app preferences and account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications */}
        <SettingsSection 
          title="Notifications" 
          icon={<Bell className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Habit Reminders</span>
              <button
                onClick={() => setNotifications({...notifications, habitReminders: !notifications.habitReminders})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.habitReminders ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle habit reminders</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.habitReminders ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Task Due Soon</span>
              <button
                onClick={() => setNotifications({...notifications, taskDueSoon: !notifications.taskDueSoon})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.taskDueSoon ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle task due soon notifications</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.taskDueSoon ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Task Overdue</span>
              <button
                onClick={() => setNotifications({...notifications, taskOverdue: !notifications.taskOverdue})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.taskOverdue ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle task overdue notifications</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.taskOverdue ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Summary</span>
              <button
                onClick={() => setNotifications({...notifications, dailySummary: !notifications.dailySummary})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.dailySummary ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle daily summary</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.dailySummary ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Weekly Report</span>
              <button
                onClick={() => setNotifications({...notifications, weeklyReport: !notifications.weeklyReport})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.weeklyReport ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle weekly report</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.weeklyReport ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Achievement Unlocked</span>
              <button
                onClick={() => setNotifications({...notifications, achievementUnlocked: !notifications.achievementUnlocked})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.achievementUnlocked ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle achievement notifications</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications.achievementUnlocked ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection 
          title="Appearance" 
          icon={<Palette className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Theme</label>
              <select 
                value={appearance.theme}
                onChange={(e) => setAppearance({...appearance, theme: e.target.value as 'light' | 'dark' | 'system'})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Language</label>
              <select 
                value={appearance.language}
                onChange={(e) => setAppearance({...appearance, language: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Date Format</label>
              <select 
                value={appearance.dateFormat}
                onChange={(e) => setAppearance({...appearance, dateFormat: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Time Format</label>
              <select 
                value={appearance.timeFormat}
                onChange={(e) => setAppearance({...appearance, timeFormat: e.target.value as '12h' | '24h'})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection 
          title="Privacy" 
          icon={<Shield className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Share Progress</span>
              <button
                onClick={() => setPrivacy({...privacy, shareProgress: !privacy.shareProgress})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacy.shareProgress ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle progress sharing</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    privacy.shareProgress ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Public Profile</span>
              <button
                onClick={() => setPrivacy({...privacy, publicProfile: !privacy.publicProfile})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacy.publicProfile ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle public profile</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    privacy.publicProfile ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Data Collection</label>
              <select 
                value={privacy.dataCollection}
                onChange={(e) => setPrivacy({...privacy, dataCollection: e.target.value as 'minimal' | 'standard' | 'full'})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection 
          title="Data Management" 
          icon={<Database className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto Backup</span>
              <button
                onClick={() => setData({...data, autoBackup: !data.autoBackup})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  data.autoBackup ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle auto backup</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    data.autoBackup ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Export Format</span>
              <select 
                value={data.exportFormat}
                onChange={(e) => setData({...data, exportFormat: e.target.value as 'json' | 'csv' | 'pdf'})}
                className="w-full p-2 border border-border rounded-lg bg-surface"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Clear Cache</span>
              <button
                onClick={() => setData({...data, clearCache: !data.clearCache})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  data.clearCache ? 'bg-brand-500' : 'bg-muted'
                }`}
              >
                <span className="sr-only">Toggle clear cache</span>
                <span 
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    data.clearCache ? 'translate-x-3' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={handleClearData}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* Account */}
        <SettingsSection 
          title="Account" 
          icon={<User className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4">
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">user@example.com</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Plan</span>
                <Badge variant="primary">Premium</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm text-muted-foreground">March 2024</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Data
              </Button>
              <Button variant="outline" className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t border-border">
        <Button 
          onClick={handleSaveSettings}
          className="flex-1"
        >
          Save Settings
        </Button>
        <Button 
          variant="outline"
          onClick={handleResetSettings}
          className="flex-1"
        >
          Reset to Default
        </Button>
      </div>
    </div>
  )
}
