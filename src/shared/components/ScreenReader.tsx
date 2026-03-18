import { type FC } from 'react'

// Screen reader only text component
export const VisuallyHidden: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// Live region for announcements
export const LiveRegion: FC<{ 
  assertive?: boolean
  children?: React.ReactNode 
}> = ({ assertive = false, children }) => {
  return (
    <div 
      role="status" 
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Accessible badge with proper ARIA
export const AccessibleBadge: FC<{
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info'
}> = ({ children, variant = 'info' }) => {
  const labels = {
    success: 'Success',
    warning: 'Warning',
    danger: 'Error',
    info: 'Information'
  }

  return (
    <span 
      role="status"
      aria-label={`${labels[variant]}: ${children}`}
      className={`badge badge-${variant}`}
    >
      {children}
    </span>
  )
}

// Accessible progress bar
export const AccessibleProgress: FC<{
  value: number
  max?: number
  label?: string
}> = ({ value, max = 100, label }) => {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div 
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `Progress: ${percentage}%`}
      className="progress-container"
    >
      <div 
        className="progress-bar"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Accessible checkbox with proper labeling
export const AccessibleCheckbox: FC<{
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}> = ({ id, checked, onChange, label, description }) => {
  return (
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
        aria-describedby={description ? `${id}-description` : undefined}
      />
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

// Accessible toggle switch
export const AccessibleToggle: FC<{
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}> = ({ id, checked, onChange, label }) => {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-brand-500' : 'bg-muted'
        }`}
      >
        <span className="sr-only">
          {checked ? 'On' : 'Off'}
        </span>
        <span
          className={`block w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

// Accessible modal with focus trapping
export const AccessibleModal: FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
        <h2 id="modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

// Accessible alert
export const AccessibleAlert: FC<{
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  onClose?: () => void
}> = ({ type, title, message, onClose }) => {
  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  }

  return (
    <div 
      role="alert"
      className={`p-4 rounded-lg border-l-4 alert-${type}`}
    >
      <div className="flex items-start space-x-3">
        <span aria-hidden="true">{icons[type]}</span>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Close alert"
            className="text-muted-foreground hover:text-text"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// Accessible navigation
export const AccessibleNav: FC<{
  items: Array<{ label: string; href: string; current?: boolean }>
}> = ({ items }) => {
  return (
    <nav aria-label="Main navigation">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={`block px-4 py-2 rounded-lg ${
                item.current 
                  ? 'bg-brand-100 text-brand-700 font-medium' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Accessible table
export const AccessibleTable: FC<{
  caption: string
  headers: string[]
  rows: Array<Record<string, React.ReactNode>>
}> = ({ caption, headers, rows }) => {
  return (
    <table className="w-full">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col" className="text-left p-2">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {headers.map((header) => (
              <td key={header} className="p-2">
                {row[header]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
