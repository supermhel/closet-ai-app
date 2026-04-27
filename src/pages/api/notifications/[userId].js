import { getUserNotifications, markNotificationAsRead } from "@/lib/services/notificationService"

export default async function handler(req, res) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "User ID is required",
      code: "MISSING_USER_ID",
    })
  }

  try {
    if (req.method === "GET") {
      const { limit = 20, unreadOnly = false } = req.query

      const notifications = await getUserNotifications(userId, Number.parseInt(limit))

      const filteredNotifications = unreadOnly === "true" ? notifications.filter((n) => !n.read) : notifications

      res.status(200).json({
        success: true,
        data: filteredNotifications,
        count: filteredNotifications.length,
        timestamp: new Date().toISOString(),
      })
    } else if (req.method === "PATCH") {
      const { notificationId, action } = req.body

      if (!notificationId || !action) {
        return res.status(400).json({
          success: false,
          error: "notificationId and action are required",
          code: "MISSING_REQUIRED_FIELDS",
        })
      }

      if (action === "mark_read") {
        await markNotificationAsRead(notificationId)

        res.status(200).json({
          success: true,
          message: "Notification marked as read",
          timestamp: new Date().toISOString(),
        })
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid action",
          code: "INVALID_ACTION",
        })
      }
    } else {
      res.status(405).json({ error: "Method not allowed" })
    }
  } catch (error) {
    console.error("Notifications API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to process notification request",
      code: "PROCESSING_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
