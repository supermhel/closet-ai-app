"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (!userProfile?.onboardingCompleted) {
          router.push("/onboarding")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [user, userProfile, loading, router])

  // Show landing page for non-authenticated users
  if (!user && !loading) {
    return <LandingPage />
  }

  // Return null while redirecting
  return null
}
