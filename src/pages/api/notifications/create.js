import { createNotification } from "@/lib/services/notificationService"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, type, title, message, scheduledFor, metadata } = req.body

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "userId, type, title, and message are required",
        code: "MISSING_REQUIRED_FIELDS",
      })
    }

    const validTypes = ["outfit_reminder", "weather_alert", "style_tip", "achievement"]
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification type",
        code: "INVALID_TYPE",
      })
    }

    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      metadata: metadata || {},
    })

    res.status(201).json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Notification creation error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
      code: "CREATION_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
