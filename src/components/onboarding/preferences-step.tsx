"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { OnboardingData } from "./onboarding-flow"

interface PreferencesStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrevious: () => void
  loading?: boolean
}

type Theme = "light" | "dark" | "system"

interface FormData {
  theme: Theme
  language: string
  notifications: boolean
  emailUpdates: boolean
  interests: string[]
}

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
]

const INTERESTS = [
  "Sustainable Fashion",
  "Minimalist Style",
  "Vintage Clothing",
  "Street Style",
  "Business Casual",
  "Athletic Wear",
  "Formal Wear",
  "Accessories",
  "Shoes",
  "Color Coordination",
  "Fashion Trends",
  "Style Tips",
]

export function PreferencesStep({ data, onUpdate, onNext, onPrevious, loading = false }: PreferencesStepProps) {
  const [formData, setFormData] = useState<FormData>({
    theme: (data.preferences?.theme || "light") as Theme,
    language: data.preferences?.language || "English",
    notifications: data.preferences?.notifications ?? true,
    emailUpdates: data.preferences?.emailUpdates ?? true,
    interests: data.preferences?.interests || [],
  })

  useEffect(() => {
    onUpdate({
      preferences: {
        ...data.preferences,
        ...formData,
      },
    })
  }, [formData, onUpdate, data.preferences])

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      interests: checked ? [...prev.interests, interest] : prev.interests.filter((i: string) => i !== interest),
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">App Preferences</h2>
        <p className="text-muted-foreground">
          Customize your experience with ClosetAI. You can always change these settings later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Display Preferences</CardTitle>
          <CardDescription>Customize how the app looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value: Theme) => setFormData((prev) => ({ ...prev, theme: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Choose what notifications you&apos;d like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about important updates</p>
            </div>
            <Switch
              id="notifications"
              checked={formData.notifications}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, notifications: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailUpdates">Email Updates</Label>
              <p className="text-sm text-muted-foreground">Get weekly summaries and product updates</p>
            </div>
            <Switch
              id="emailUpdates"
              checked={formData.emailUpdates}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, emailUpdates: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fashion Interests</CardTitle>
          <CardDescription>Select topics you&apos;re interested in for personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {INTERESTS.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox
                  id={interest}
                  checked={formData.interests.includes(interest)}
                  onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                />
                <Label htmlFor={interest} className="text-sm">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={loading}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={loading}>
          {loading ? "Saving..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  )
}
