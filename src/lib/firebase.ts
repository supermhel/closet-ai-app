import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase client configuration
// Note: These keys are meant to be public in client-side Firebase apps
// Security is handled through Firebase Security Rules and domain restrictions
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only if it hasn't been initialized already
// This prevents multiple initializations during hot reloads
let app
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (error) {
    console.error("Firebase initialization error:", error)
    // Provide a more user-friendly error message
    throw new Error(
      "Firebase could not initialize. Please check your configuration or try again later."
    )
  }
} else {
  app = getApps()[0]
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
