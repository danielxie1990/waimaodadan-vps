"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches React rendering errors.
 * Prevents the entire page from crashing when a single component fails.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          padding: 24,
          background: "#fff5f5",
          border: "1px solid #fecaca",
          borderRadius: 8,
          color: "#991b1b",
          fontSize: 14,
          lineHeight: 1.6,
          margin: 16,
        }}>
          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>⚠️ Something went wrong</p>
          <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
