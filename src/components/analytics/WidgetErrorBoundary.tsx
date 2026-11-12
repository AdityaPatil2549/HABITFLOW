import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Widget Error caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl p-6 border border-rose-500/20 bg-rose-950/20 backdrop-blur-xl flex flex-col items-center justify-center text-center py-10 min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <AlertTriangle size={22} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {this.props.title ? `${this.props.title} Unavailable` : 'Widget Rendering Issue'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            {this.props.fallbackMessage ||
              'A temporary telemetry calculation error occurred. Your underlying habit logs remain completely safe.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer hover:border-white/30"
          >
            <RotateCcw size={13} />
            <span>Retry Metric</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
