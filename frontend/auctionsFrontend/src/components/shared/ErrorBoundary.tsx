import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Error Boundary
   ─────────────────────────────────────────────────
   Catches render errors in child tree and displays
   a branded fallback UI instead of a blank page.
   ═══════════════════════════════════════════════════ */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Send to error reporting service (Sentry, etc.)
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 px-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
            <AlertTriangle className="h-8 w-8 text-error" aria-hidden="true" />
          </div>

          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              Something went wrong
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-navy/5 p-3 text-left font-mono text-xs text-error">
                {this.state.error.message}
              </pre>
            )}
          </div>

          <button
            onClick={this.handleReset}
            className="btn-primary"
            aria-label="Try again"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
