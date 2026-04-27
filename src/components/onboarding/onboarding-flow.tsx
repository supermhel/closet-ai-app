"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfile } from "@/contexts/profile-context"
import { useAuth } from "@/contexts/auth-context"
import { WelcomeStep } from "./welcome-step"
import { PersonalInfoStep } from "./personal-info-step"
import { LocationStep } from "./location-step"
import { StyleQuizStep } from "./style-quiz-step"
import { PreferencesStep } from "./preferences-step"
import { toast } from "sonner"
import type { UserLocation, StylePreferences } from "@/contexts/profile-context"

const ONBOARDING_STEPS = [
  "welcome",
  "personal-info",
  "location",
  "style-quiz",
  "preferences",
] as const

type OnboardingStep = typeof ONBOARDING_STEPS[number]

export interface OnboardingData {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  gender?: string
  phoneNumber?: string
  bio?: string
  location: Partial<UserLocation>
  preferences: {
    theme?: "light" | "dark" | "system"
    language?: string
    notifications?: boolean
    emailUpdates?: boolean
    interests?: string[]
  }
  stylePreferences?: Partial<StylePreferences>
}

export function OnboardingFlow() {
  const router = useRouter()
  const { updateProfile, updateStylePreferences, updateLocation } = useProfile()
  const { updateOnboardingStatus } = useAuth()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    location: {},
    preferences: {
      theme: "system",
      language: "English",
      notifications: true,
      emailUpdates: true,
      interests: [],
    },
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
    },
  })

  const handleComplete = async () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep)
    
    // If we're on the last step, save all data and redirect
    if (currentIndex === ONBOARDING_STEPS.length - 1) {
      try {
        setLoading(true)

        // Update profile data - filter out undefined values
        const profileUpdateData: Record<string, unknown> = {
          displayName: `${data.firstName} ${data.lastName}`,
          email: data.email,
        }
        
        // Only include bio if it has a value
        if (data.bio && data.bio.trim() !== "") {
          profileUpdateData.bio = data.bio.trim()
        }
        
        await updateProfile(profileUpdateData)

        // Update location if provided - only include defined fields
        if (data.location.city && data.location.country) {
          const locationData: UserLocation = {
            city: data.location.city,
            country: data.location.country,
          }
          
          // Only add optional fields if they exist
          if (data.location.countryCode) {
            locationData.countryCode = data.location.countryCode
          }
          if (data.location.coords) {
            locationData.coords = {
              latitude: data.location.coords.latitude,
              longitude: data.location.coords.longitude,
              ...(data.location.coords.accuracy !== undefined && { 
                accuracy: data.location.coords.accuracy 
              })
            }
          }
          
          await updateLocation(locationData)
        }

        // Update style preferences if provided
        if (data.stylePreferences) {
          // Filter out any undefined values
          const cleanedPreferences = Object.fromEntries(
            Object.entries(data.stylePreferences)
              .filter(([_key, value]) => value !== undefined)
          )
          if (Object.keys(cleanedPreferences).length > 0) {
            await updateStylePreferences(cleanedPreferences)
          }
        }

        // Update onboarding status in auth context (this updates local state)
        await updateOnboardingStatus(true)

        toast.success("Profile setup complete!")
        router.push("/dashboard")
    } catch (error) {
        console.error("Error saving profile:", error)
        toast.error("Failed to save profile. Please try again.")
    } finally {
        setLoading(false)
      }
    } else {
      // Move to next step
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1])
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1])
      window.scrollTo(0, 0)
    }
  }

  const handleUpdate = (updates: Partial<OnboardingData>) => {
    setData((prev) => {
      // If the updates are identical to current data, return previous state
      if (Object.entries(updates).every(([key, value]) => {
        const typedKey = key as keyof OnboardingData
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(prev[typedKey]) === JSON.stringify(value)
        }
        return prev[typedKey] === value
      })) {
        return prev
      }

      const newData = { ...prev }
      
      // Handle nested updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return // Skip undefined values
        
        const typedKey = key as keyof OnboardingData
        
        // Handle each nested object type separately
        switch(typedKey) {
          case 'location':
            if (JSON.stringify(newData.location) !== JSON.stringify(value)) {
              newData.location = { ...newData.location, ...(value as Partial<UserLocation>) }
            }
            break
          case 'preferences':
            if (JSON.stringify(newData.preferences) !== JSON.stringify(value)) {
              newData.preferences = { ...newData.preferences, ...(value as typeof newData.preferences) }
            }
            break
          case 'stylePreferences':
            if (JSON.stringify(newData.stylePreferences) !== JSON.stringify(value)) {
              newData.stylePreferences = { ...newData.stylePreferences, ...(value as Partial<StylePreferences>) }
            }
            break
          default:
            // For non-object fields, assign only if different
            if (newData[typedKey] !== value) {
              (newData[typedKey] as unknown) = value
            }
        }
      })

      return newData
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onComplete={handleComplete} onPrevious={handlePrevious} loading={loading} />
      case "personal-info":
        return (
          <PersonalInfoStep
            data={data}
            onNext={handleComplete}
            onUpdate={handleUpdate}
            onPrevious={handlePrevious}
          />
        )
      case "location":
        return (
          <LocationStep
            data={data.location}
            onNext={handleComplete}
            onUpdate={(locationData) => handleUpdate({ location: locationData })}
            onPrevious={handlePrevious}
          />
        )
      case "style-quiz":
        return (
          <div className="max-w-4xl mx-auto px-4">
            <StyleQuizStep
              data={data.stylePreferences}
              onComplete={(styleData: Partial<StylePreferences>) => {
                handleUpdate({ stylePreferences: styleData })
                handleComplete()
              }}
              onPrevious={handlePrevious}
                />
              </div>
        )
      case "preferences":
        return (
          <PreferencesStep
            data={data}
            onNext={handleComplete}
            onUpdate={handleUpdate}
            onPrevious={handlePrevious}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    ONBOARDING_STEPS.indexOf(currentStep) >= index
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 ${
                      ONBOARDING_STEPS.indexOf(currentStep) > index
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
        </div>
        </div>
        {renderStep()}
      </div>
    </div>
  )
}
