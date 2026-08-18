"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-score-red/10">
            <span className="text-2xl text-score-red">!</span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 rounded-lg bg-stellar-blue px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
