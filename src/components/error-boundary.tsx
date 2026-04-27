"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: "page" | "component" | "critical"
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error details
    console.error("Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    })

    // Report to error tracking service
    this.reportError(error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Show toast notification for component-level errors
    if (this.props.level === "component") {
      toast.error("A component error occurred. Please try refreshing the page.")
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId)
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        level: this.props.level || "component",
        url: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        timestamp: new Date().toISOString(),
      }

      await fetch("/api/errors/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorReport),
      })
    } catch (reportError) {
      console.error("Failed to report error:", reportError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })

    // Add a small delay to prevent immediate re-error
    this.retryTimeoutId = window.setTimeout(() => {
      // Force a re-render
      this.forceUpdate()
    }, 100)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state
      const { fallback, level = "component" } = this.props

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error!, this.handleRetry)
      }

      // Component-level error (smaller, inline error)
      if (level === "component") {
        return (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Something went wrong with this component.</span>
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )
      }

      // Page-level error (full page replacement)
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {level === "critical" ? "Critical Error" : "Something went wrong"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  {level === "critical"
                    ? "A critical error has occurred. Please contact support if this persists."
                    : "An unexpected error occurred. Our team has been notified and is working on a fix."}
                </AlertDescription>
              </Alert>

              {errorId && (
                <div className="text-sm text-muted-foreground">
                  Error ID: <code className="bg-muted px-1 rounded text-xs">{errorId}</code>
                </div>
              )}

              {process.env.NODE_ENV === "development" && error && (
                <details className="text-xs bg-muted p-3 rounded border">
                  <summary className="cursor-pointer font-medium mb-2">Error details (development only)</summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Message:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-destructive">{error.message}</pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs overflow-auto max-h-32">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)

      // Report to error tracking
      if (typeof window !== "undefined") {
        fetch("/api/errors/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "unhandled_promise_rejection",
            reason: event.reason?.toString() || "Unknown promise rejection",
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        }).catch(console.error)
      }

      // Show user-friendly notification
      toast.error("A network request failed. Please check your connection and try again.")
    }

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error)

      // Report global errors
      if (typeof window !== "undefined") {
        fetch("/api/errors/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "global_error",
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        }).catch(console.error)
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return <>{children}</>
}

// Specific error boundaries for different parts of the app
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="page">{children}</ErrorBoundary>
)

export const ComponentErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="component">{children}</ErrorBoundary>
)

export const CriticalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="critical">{children}</ErrorBoundary>
)
