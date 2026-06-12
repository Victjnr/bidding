import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Component } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-sky p-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error mb-6">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-navy">Something went wrong</h1>
          <p className="mt-2 max-w-md text-muted">
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>
          
          <div className="mt-6 p-4 bg-white/50 border border-error/20 rounded-lg max-w-lg w-full overflow-hidden text-left shadow-sm">
            <p className="text-xs font-mono text-error/80 break-words">
              {this.state.error?.message || 'Unknown Error'}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Reload Page
            </button>
            <a href="/app/home" className="btn-outline flex items-center gap-2 border-transparent">
              <Home className="h-4 w-4" /> Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
