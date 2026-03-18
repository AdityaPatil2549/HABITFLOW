import { Settings } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your app preferences and achievements
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Settings</h2>
        <p className="text-muted-foreground">
          Settings page is working - gamification temporarily disabled
        </p>
      </div>
    </div>
  )
}
