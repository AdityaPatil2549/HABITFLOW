import { type FC, useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Check, Sun, Moon, Monitor, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/utils/cn'

type ThemeMode = 'light' | 'dark' | 'system'

interface ColorScheme {
  name: string
  primary: string
  secondary: string
  accent: string
}

const colorSchemes: ColorScheme[] = [
  { name: 'Ocean', primary: '#0EA5E9', secondary: '#6366F1', accent: '#06B6D4' },
  { name: 'Forest', primary: '#10B981', secondary: '#059669', accent: '#84CC16' },
  { name: 'Sunset', primary: '#F97316', secondary: '#EF4444', accent: '#F59E0B' },
  { name: 'Berry', primary: '#EC4899', secondary: '#8B5CF6', accent: '#F43F5E' },
  { name: 'Slate', primary: '#475569', secondary: '#64748B', accent: '#94A3B8' },
]

interface CustomThemeSelectorProps {
  className?: string
}

export const CustomThemeSelector: FC<CustomThemeSelectorProps> = ({ className }) => {
  const [mode, setMode] = useState<ThemeMode>('system')
  const [selectedScheme, setSelectedScheme] = useState(colorSchemes[0])
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Save theme preferences
    localStorage.setItem('habitflow-theme-mode', mode)
    localStorage.setItem('habitflow-color-scheme', JSON.stringify(selectedScheme))
    
    // Apply theme
    applyTheme(mode, selectedScheme)
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const applyTheme = (themeMode: ThemeMode, scheme: ColorScheme) => {
    const root = document.documentElement
    
    // Apply color scheme
    root.style.setProperty('--color-brand', scheme.primary)
    root.style.setProperty('--color-brand-light', scheme.secondary)
    root.style.setProperty('--color-accent', scheme.accent)
    
    // Apply dark/light mode
    if (themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return (
    <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text flex items-center space-x-2">
            <Palette className="h-5 w-5 text-brand-500" />
            <span>Custom Themes</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Personalize your app appearance
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-medium text-text">Theme Mode</label>
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('light')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all',
              mode === 'light'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-border bg-surface text-muted-foreground hover:text-text'
            )}
          >
            <Sun className="h-4 w-4" />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            onClick={() => setMode('dark')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all',
              mode === 'dark'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-border bg-surface text-muted-foreground hover:text-text'
            )}
          >
            <Moon className="h-4 w-4" />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            onClick={() => setMode('system')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-all',
              mode === 'system'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-border bg-surface text-muted-foreground hover:text-text'
            )}
          >
            <Monitor className="h-4 w-4" />
            <span className="text-sm font-medium">System</span>
          </button>
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-medium text-text">Color Scheme</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {colorSchemes.map((scheme) => (
            <motion.button
              key={scheme.name}
              onClick={() => setSelectedScheme(scheme)}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                selectedScheme.name === scheme.name
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-border hover:border-brand-300'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: scheme.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: scheme.secondary }}
                />
              </div>
              <span className="text-sm font-medium text-text">{scheme.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border p-4 mb-6">
        <label className="text-sm font-medium text-text mb-3 block">Preview</label>
        <div className="flex items-center space-x-3">
          <div
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: selectedScheme.primary }}
          >
            Primary
          </div>
          <div
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: selectedScheme.secondary }}
          >
            Secondary
          </div>
          <div
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: selectedScheme.accent }}
          >
            Accent
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          onClick={handleSave}
          className="flex-1"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Theme'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setMode('system')
            setSelectedScheme(colorSchemes[0])
            applyTheme('system', colorSchemes[0])
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
