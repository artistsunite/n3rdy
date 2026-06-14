'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PanelErrorBoundary]', error.message, info.componentStack?.slice(0, 300));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="liquid-glass-card rounded-2xl p-8 text-center max-w-sm">
            <p className="text-white/50 text-sm mb-4">Something went wrong loading this page.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-xl transition-colors"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
