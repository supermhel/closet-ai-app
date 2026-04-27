import logger from "@/utils/logger"
import { db } from "../firebase"
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from "firebase/firestore"

interface Notification {
  id?: string
  userId: string
  type: "outfit_reminder" | "weather_alert" | "style_tip" | "achievement"
  title: string
  message: string
  read: boolean
  createdAt: Date
  scheduledFor?: Date
  metadata?: any
}

export async function createNotification(notification: Omit<Notification, "id" | "createdAt" | "read">) {
  try {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)

    logger.info("Notification created", {
      notificationId: docRef.id,
      userId: notification.userId,
      type: notification.type,
    })

    return { id: docRef.id, ...notificationData }
  } catch (error) {
    logger.error("Failed to create notification", { error: error.message })
    throw error
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(limit))

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    logger.error("Failed to fetch notifications", { userId, error: error.message })
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      readAt: new Date(),
    })

    logger.info("Notification marked as read", { notificationId })
  } catch (error) {
    logger.error("Failed to mark notification as read", { notificationId, error: error.message })
    throw error
  }
}

export async function scheduleOutfitReminder(userId: string, outfitId: string, scheduledFor: Date) {
  return createNotification({
    userId,
    type: "outfit_reminder",
    title: "Outfit Reminder",
    message: "Don't forget about your planned outfit for today!",
    scheduledFor,
    metadata: { outfitId },
  })
}

export async function sendWeatherAlert(userId: string, weatherCondition: string, recommendation: string) {
  return createNotification({
    userId,
    type: "weather_alert",
    title: "Weather Update",
    message: `${weatherCondition} - ${recommendation}`,
    metadata: { weatherCondition },
  })
}

export async function sendStyleTip(userId: string, tip: string) {
  return createNotification({
    userId,
    type: "style_tip",
    title: "Style Tip",
    message: tip,
  })
}
