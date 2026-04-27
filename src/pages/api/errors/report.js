import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import logger from "@/utils/logger"

// Rate limiting
const RATE_LIMIT = 10 // Max 10 errors per minute per IP
const rateLimitMap = new Map()

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"

    // Check rate limit
    const now = Date.now()
    const minuteAgo = now - 60000

    // Clean up old entries
    if (rateLimitMap.has(clientIp)) {
      rateLimitMap.set(
        clientIp,
        rateLimitMap.get(clientIp).filter((timestamp) => timestamp > minuteAgo),
      )
    }

    // Initialize if needed
    if (!rateLimitMap.has(clientIp)) {
      rateLimitMap.set(clientIp, [])
    }

    // Check if rate limited
    if (rateLimitMap.get(clientIp).length >= RATE_LIMIT) {
      return res.status(429).json({
        error: "Too many error reports",
        message: "Rate limit exceeded",
      })
    }

    // Add current timestamp to rate limit tracking
    rateLimitMap.get(clientIp).push(now)

    const { message, stack, componentStack, url, userAgent } = req.body

    if (!message) {
      return res.status(400).json({ error: "Error message is required" })
    }

    // Log the error
    logger.error("Client-side error reported", {
      message,
      url,
      userAgent,
    })

    // Store in Firestore
    const errorDoc = {
      message: message || "Unknown error",
      stack: stack || null,
      componentStack: componentStack || null,
      url: url || null,
      userAgent: userAgent || null,
      timestamp: serverTimestamp(),
      ipAddress: clientIp || "unknown",
    }
    
    await addDoc(collection(db, "errorReports"), errorDoc)

    // Send to external error tracking service if configured
    if (process.env.SENTRY_DSN) {
      // This would be implemented with Sentry SDK
      // For now, just log that we would send to Sentry
      logger.info("Would send to Sentry:", { message, url })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error reporting failed:", error)
    
    // Don't fail completely if error reporting fails
    // Just log the error and return success to prevent error loops
    logger.error("Failed to store error report in Firestore:", {
      originalError: { message: message || "Unknown", url: url || "Unknown" },
      reportingError: error.message || "Unknown error",
      code: error.code || "Unknown code"
    })
    
    // Return success to prevent infinite error reporting loops
    res.status(200).json({ 
      success: true, 
      warning: "Error logged locally but not stored remotely" 
    })
  }
}
