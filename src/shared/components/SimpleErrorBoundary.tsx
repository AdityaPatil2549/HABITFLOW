import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SimpleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-danger mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
