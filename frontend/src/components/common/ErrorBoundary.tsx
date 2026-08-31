/**
 * Error Boundary Component
 * Catches React rendering errors and displays a fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (could also send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400 p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 font-serif">System Malfunction</h1>
            <p className="mb-6 text-slate-400">
              The cogitation engine has encountered an error. Please reload the terminal to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded font-serif uppercase tracking-wider transition-colors"
            >
              Reload Terminal
            </button>
            {this.state.error && (
              <details className="mt-6 text-left text-xs text-slate-500">
                <summary>Error Details</summary>
                <pre className="mt-2 p-4 bg-slate-900 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}