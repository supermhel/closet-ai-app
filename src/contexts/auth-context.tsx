"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  location?: {
    country: string
    city: string
    coordinates?: { lat: number; lng: number }
  }
  preferences: {
    theme: string
    notifications: boolean
    language: string
    interests: string[]
    style: {
      tags: string[]
      colors: string[]
      categories: string[]
    }
  }
  closetStats: {
    tops: number
    bottoms: number
    shoes: number
    accessories: number
    lastUpdated: Date | null
  }
  onboardingCompleted: boolean
  createdAt: Date | Timestamp
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateOnboardingStatus: (completed: boolean) => Promise<void>
  updateUserPreferences: (preferences: Partial<UserProfile["preferences"]>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      try {
        const profileDoc = await getDoc(doc(db, "users", user.uid))
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data() as UserProfile)
        } else {
          // Create a default profile if none exists
          const defaultProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            photoURL: user.photoURL || undefined,
            onboardingCompleted: false,
            createdAt: new Date(),
            preferences: {
              theme: "system",
              notifications: true,
              language: "en",
              interests: [],
              style: {
                tags: [],
                colors: [],
                categories: [],
              },
            },
            closetStats: {
              tops: 0,
              bottoms: 0,
              shoes: 0,
              accessories: 0,
              lastUpdated: null,
            },
          }

          await setDoc(doc(db, "users", user.uid), defaultProfile)
          setUserProfile(defaultProfile)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }
  }

  const updateOnboardingStatus = async (completed: boolean) => {
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          onboardingCompleted: completed,
          lastUpdated: serverTimestamp(),
        })

        // Update local state
        setUserProfile((prev) => (prev ? { ...prev, onboardingCompleted: completed } : null))
      } catch (error) {
        console.error("Error updating onboarding status:", error)
        throw error
      }
    }
  }

  const updateUserPreferences = async (preferences: Partial<UserProfile["preferences"]>) => {
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          preferences: { ...(userProfile?.preferences || {}), ...preferences },
          lastUpdated: serverTimestamp(),
        })

        // Update local state
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                preferences: { ...(prev.preferences || {}), ...preferences },
              }
            : null,
        )
      } catch (error) {
        console.error("Error updating user preferences:", error)
        throw error
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      if (newUser) {
        // If a user is detected, set the user state and fetch their profile
        setUser(newUser);
        try {
          const profileDoc = await getDoc(doc(db, "users", newUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          } else {
            // If no profile exists, create a default one
            const defaultProfile: Omit<UserProfile, 'createdAt'> = {
              uid: newUser.uid,
              email: newUser.email || "",
              displayName: newUser.displayName || newUser.email?.split("@")[0] || "User",
              photoURL: newUser.photoURL || undefined,
              onboardingCompleted: false,
              preferences: {
                theme: "system",
                notifications: true,
                language: "en",
                interests: [],
                style: {
                  tags: [],
                  colors: [],
                  categories: [],
                },
              },
              closetStats: {
                tops: 0,
                bottoms: 0,
                shoes: 0,
                accessories: 0,
                lastUpdated: null,
              },
            };

            // Create the document with server timestamp
            await setDoc(doc(db, "users", newUser.uid), {
              ...defaultProfile,
              createdAt: serverTimestamp(),
            });

            // Set local state with current date
            setUserProfile({
              ...defaultProfile,
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error("Error fetching or creating user profile:", error);
          // Even if profile fetch fails, we have a user, but clear profile
          setUserProfile(null);
        }
      } else {
        // If no user is detected, clear all user-related state
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut,
        refreshProfile,
        updateOnboardingStatus,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
