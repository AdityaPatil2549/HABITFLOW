import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Auto-reload on chunk load errors (usually means a new deployment happened)
    const isChunkError = 
      error?.message?.match(/Failed to fetch dynamically imported module/i) || 
      error?.message?.match(/Loading chunk [\w-]+ failed/i) ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_error_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_error_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--sf-base)] text-[var(--tx-primary)] p-6 text-center">
          <div className="max-w-md card-raised p-8 rounded-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--danger)] mb-3">Something went wrong</h1>
            <p className="text-[var(--tx-secondary)] mb-6 text-sm">
              An unexpected error occurred in the application. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-2.5 text-sm font-semibold"
            >
              Reload Application
            </button>
            <div className="mt-6 p-3.5 bg-[var(--sf-overlay)] border border-[var(--border-default)] rounded-lg text-left overflow-x-auto">
              <pre className="text-xs font-mono text-[var(--danger)]">{this.state.error?.message}</pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
