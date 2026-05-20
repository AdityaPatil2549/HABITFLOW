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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base,#0f0f13)] text-[var(--text-primary,white)] p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-black text-brand-400 mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6 font-medium">An unexpected error occurred in the application. Please try reloading the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold transition-colors"
            >
              Reload Application
            </button>
            <div className="mt-8 p-4 bg-black/50 border border-white/10 rounded-lg text-left overflow-x-auto">
              <pre className="text-xs text-red-400">{this.state.error?.message}</pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
