import { Settings } from 'lucide-react'
import { GamificationDashboard } from '../gamification/index'

export const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your app preferences and achievements
        </p>
      </div>

      <GamificationDashboard />
    </div>
  )
}
