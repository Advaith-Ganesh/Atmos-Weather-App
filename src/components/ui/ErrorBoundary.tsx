import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called with the error so a host app could forward it to a reporter. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, an exception thrown while rendering unmounts the whole tree and
 * leaves a blank page — React 19 has no default UI for that. The weather data
 * itself is already guarded by `WeatherError`, so this exists for the failures
 * that guard cannot see: a bad assumption in a component, or a browser API
 * behaving unexpectedly.
 *
 * Class component because `componentDidCatch` has no hook equivalent.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // Kept: this is the only record of an unexpected render failure, and the
    // message is developer-facing, never shown to the user.
    console.error('Unhandled render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-semibold text-mist-100">Something went wrong</h1>
        <p className="text-sm text-mist-300">
          Atmos hit an unexpected error and stopped. Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-mist-200 transition-colors hover:border-white/20 hover:text-mist-100"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
