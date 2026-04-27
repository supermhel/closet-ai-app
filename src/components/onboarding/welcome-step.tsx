"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Shirt, Users, Settings } from "lucide-react"

interface WelcomeStepProps {
  onComplete: () => void
  onPrevious: () => void
  loading: boolean
}

export function WelcomeStep({ onComplete, loading }: WelcomeStepProps) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold">Welcome to ClosetAI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personal AI-powered wardrobe assistant. Let&apos;s get started by setting up your profile.
        </p>
      </div>

      <div className="grid gap-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shirt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-medium">Smart Wardrobe Organization</h3>
              <p className="text-muted-foreground">
                Organize and manage your clothing with AI-powered insights and recommendations
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-medium">Personalized Style Profile</h3>
              <p className="text-muted-foreground">
                Create your unique style profile and get personalized outfit suggestions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-medium">Easy Setup Process</h3>
              <p className="text-muted-foreground">
                Quick and simple setup process to get you started in minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Button onClick={onComplete} disabled={loading} size="lg">
          {loading ? "Loading..." : "Get Started"}
        </Button>
      </div>
    </div>
  )
}
