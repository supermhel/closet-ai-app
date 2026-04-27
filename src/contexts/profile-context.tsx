"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

// Define types for our context
export interface StylePreferences {
  personalStyle: string[]
  colorPreferences: string[]
  fabricPreferences: string[]
  patterns: string[]
  printPreferences: string[]
  occasionWear: string[]
  overallLook: string[]
  workWear: string[]
  casualWear: string[]
  footwear: string[]
  accessories: string[]
  sizePreference: string[]
  fitPreferences: string[]
  favoriteColors: string[]
  favoritePatterns: string[]
  favoriteBrands: string[]
  updatedAt?: Timestamp
}

export interface UserLocation {
  city: string
  country: string
  countryCode?: string
  coords?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  source?: string
  timestamp?: Timestamp
}

export interface UserProfile {
  displayName: string
  photoURL?: string
  email: string
  bio?: string
  phoneNumber?: string
  location?: UserLocation
  stylePreferences?: StylePreferences
  onboardingCompleted: boolean
  createdAt: Timestamp
  updatedAt?: Timestamp
}

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>
  updateStylePreferences: (preferences: Partial<StylePreferences>) => Promise<boolean>
  updateLocation: (location: UserLocation) => Promise<boolean>
  detectLocation: () => Promise<UserLocation | null>
  completeOnboarding: () => Promise<boolean>
}

// Create the context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Custom hook to use the context
export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}

// Provider component
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Use a timeout to debounce rapid user changes
    const loadProfile = async () => {
      setLoading(true)
      try {
        // Check if we already have fresh profile data from auth context
        // to avoid redundant API calls
        const profileRef = doc(db, "users", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile
          setProfile(profileData)
        } else {
          // Create a default profile if none exists
          const defaultProfile: UserProfile = {
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
            photoURL: user.photoURL || undefined,
            onboardingCompleted: false,
            createdAt: Timestamp.now(),
            stylePreferences: {
              personalStyle: [],
              colorPreferences: [],
              fabricPreferences: [],
              patterns: [],
              printPreferences: [],
              occasionWear: [],
              overallLook: [],
              workWear: [],
              casualWear: [],
              footwear: [],
              accessories: [],
              sizePreference: [],
              fitPreferences: [],
              favoriteColors: [],
              favoritePatterns: [],
              favoriteBrands: [],
              updatedAt: Timestamp.now(),
            },
          }

          await setDoc(profileRef, defaultProfile)
          setProfile(defaultProfile)
        }
      } catch (err) {
        console.error("Error loading profile:", err)
        setError("Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Update profile
  const updateProfile = useCallback(
    async (profileData: Partial<UserProfile>): Promise<boolean> => {
      if (!user) return false

      try {
        // Filter out undefined values to prevent Firestore errors
        const cleanedData = Object.fromEntries(
          Object.entries(profileData).filter(([, value]) => value !== undefined)
        )

        const profileRef = doc(db, "users", user.uid)
        await updateDoc(profileRef, {
          ...cleanedData,
          updatedAt: Timestamp.now(),
        })

        // Update local state
        setProfile((prev) => (prev ? { ...prev, ...cleanedData, updatedAt: Timestamp.now() } : null))
        return true
      } catch (err) {
        console.error("Error updating profile:", err)
        setError("Failed to update profile")
        return false
      }
    },
    [user],
  )

  // Update style preferences
  const updateStylePreferences = useCallback(
    async (preferences: Partial<StylePreferences>): Promise<boolean> => {
      if (!user) return false

      try {
        // Filter out undefined values from preferences
        const cleanedPreferences = Object.fromEntries(
          Object.entries(preferences).filter(([, value]) => value !== undefined)
        )

        const profileRef = doc(db, "users", user.uid)
        const updatedPreferences: StylePreferences = {
          ...(profile?.stylePreferences || {
            personalStyle: [],
            colorPreferences: [],
            fabricPreferences: [],
            patterns: [],
            printPreferences: [],
            occasionWear: [],
            overallLook: [],
            workWear: [],
            casualWear: [],
            footwear: [],
            accessories: [],
            sizePreference: [],
            fitPreferences: [],
            favoriteColors: [],
            favoritePatterns: [],
            favoriteBrands: [],
          }),
          ...cleanedPreferences,
          updatedAt: Timestamp.now(),
        }

        await updateDoc(profileRef, {
          stylePreferences: updatedPreferences,
        })

        // Update local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                stylePreferences: updatedPreferences,
              }
            : null,
        )
        return true
      } catch (err) {
        console.error("Error updating style preferences:", err)
        setError("Failed to update style preferences")
        return false
      }
    },
    [user, profile],
  )

  // Update location
  const updateLocation = useCallback(
    async (location: UserLocation): Promise<boolean> => {
      if (!user) return false

      try {
        // Filter out undefined values from location
        const cleanedLocation = Object.fromEntries(
          Object.entries(location).filter(([, value]) => value !== undefined)
        ) as UserLocation

        const profileRef = doc(db, "users", user.uid)
        const updatedLocation: UserLocation = {
          ...cleanedLocation,
          timestamp: Timestamp.now(),
        }

        await updateDoc(profileRef, {
          location: updatedLocation,
        })

        // Update local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                location: updatedLocation,
              }
            : null,
        )
        return true
      } catch (err) {
        console.error("Error updating location:", err)
        setError("Failed to update location")
        return false
      }
    },
    [user],
  )

  // Detect location using IP-based detection instead of browser geolocation
  const detectLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      // Use IP-based location detection via a public API
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.reason || 'Failed to detect location')
      }
      
      const location: UserLocation = {
        city: data.city || "Unknown",
        country: data.country_name || "Unknown",
        countryCode: data.country_code,
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 1000, // IP-based location is less accurate, using 1km as estimate
        },
        source: "ip",
        timestamp: Timestamp.now(),
      }

      // Update the user's location
      await updateLocation(location)
      return location
    } catch (err) {
      console.error("Error detecting location:", err)
      setError("Failed to detect location")
      return null
    }
  }, [updateLocation])

  // Complete onboarding
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    return await updateProfile({ onboardingCompleted: true })
  }, [updateProfile])

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    updateStylePreferences,
    updateLocation,
    detectLocation,
    completeOnboarding,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
