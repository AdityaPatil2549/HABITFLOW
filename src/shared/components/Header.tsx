import { Menu, Search, Bell, User } from 'lucide-react'
import { useAppStore } from '@/shared/stores/appStore'
import { Button } from './ui/Button'

export const Header: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search habits, tasks..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
