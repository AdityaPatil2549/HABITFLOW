import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/shared/stores/appStore'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
