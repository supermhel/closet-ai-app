import { m } from "framer-motion"

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  data?: Record<string, unknown>
  timestamp: string
  stack?: string
}

interface LoggerOptions {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
}

class Logger {
  private options: LoggerOptions

  constructor(options: LoggerOptions) {
    this.options = options
  }
  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...(level === "error" && data?.stack && { stack: data.stack }),
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry = this.formatMessage(level, message, data)

    if (this.options.enableConsole) {
      const style = this.getConsoleStyle(level)
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, data || "")
    }

    // In production, you might want to send logs to a service
    if (!this.options.enableConsole && level === "error" && this.options.enableRemote) {
      // Send to error tracking service
      this.sendToErrorService(entry)
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: "color: #6B7280",
      info: "color: #3B82F6",
      warn: "color: #F59E0B",
      error: "color: #EF4444; font-weight: bold",
    }
    return styles[level]
  }

  private sendToErrorService(entry: LogEntry) {
    // Implement error service integration here
    // e.g., Sentry, LogRocket, etc.
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (this.options.level === "debug") {
      this.log("debug", message, data)
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    if (this.options.level === "debug" || this.options.level === "info") {
      this.log("info", message, data)
    }
  }

  warn(message: string, data?: Record<string, unknown>) {
    if (this.options.level === "debug" || this.options.level === "info" || this.options.level === "warn") {
      this.log("warn", message, data)
    }
  }

  error(message: string, data?: { error: Error } & Record<string, unknown>) {
    this.log("error", message, data)
  }
}

const logger = new Logger({ level: "debug", enableConsole: true, enableRemote: false })
export default logger


