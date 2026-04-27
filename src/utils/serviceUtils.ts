import { useFormState } from "react-dom";

export enum ServiceErrorCode {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  MISSING_API_KEY = "MISSING_API_KEY",
  WEATHER_ERROR = "WEATHER_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  IMAGE_PROCESSING_ERROR = "IMAGE_PROCESSING_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  ANALYSIS_ERROR = "ANALYSIS_ERROR"
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = "ServiceError"
  }
}
export type ServiceResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  error: string | null;
  code: string | null;
  timestamp: string;
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

export function formatResponse(success: boolean, data?: unknown, error?: string, code?: string) {
  return {
    success,
    data: success ? data : null,
    error: success ? null : error,
    code: success ? null : code,
    timestamp: new Date().toISOString(),
  }
}

export function checkSignal(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Operation aborted", "AbortError")
  }
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>()

  return {
    checkLimit(key = "default"): boolean {
      const now = Date.now()
      const windowStart = now - windowMs

      if (!requests.has(key)) {
        requests.set(key, [])
      }

      const userRequests = requests.get(key)!

      // Remove old requests outside the window
      const validRequests = userRequests.filter((time) => time > windowStart)

      if (validRequests.length >= maxRequests) {
        return false
      }

      validRequests.push(now)
      requests.set(key, validRequests)

      return true
    },
  }
}
