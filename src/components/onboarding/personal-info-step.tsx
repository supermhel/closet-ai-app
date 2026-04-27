"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { OnboardingData } from "./onboarding-flow"

interface PersonalInfoStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrevious: () => void
}

interface ValidationErrors {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  email?: string
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  gender: string
  phoneNumber: string
  bio: string
}

export function PersonalInfoStep({ data, onUpdate, onNext, onPrevious }: PersonalInfoStepProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    firstName: data.firstName || user?.displayName?.split(" ")[0] || "",
    lastName: data.lastName || user?.displayName?.split(" ")[1] || "",
    email: data.email || user?.email || "",
    dateOfBirth: data.dateOfBirth || "",
    gender: data.gender || "",
    phoneNumber: data.phoneNumber || "",
    bio: data.bio || "",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [shouldUpdate, setShouldUpdate] = useState(false)

  const isValid = 
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.dateOfBirth &&
    !Object.values(errors).some(Boolean)

  useEffect(() => {
    // Only update parent if form is valid and shouldUpdate is true
    if (isValid && shouldUpdate) {
      const { firstName, lastName, email, dateOfBirth, gender, phoneNumber, bio } = formData
      const updatedData = {
        firstName,
        lastName,
        email,
        dateOfBirth,
        ...(gender && { gender }),
        ...(phoneNumber && { phoneNumber }),
        ...(bio && { bio })
      }
      onUpdate(updatedData)
      setShouldUpdate(false) // Reset the flag after update
    }
  }, [formData, isValid, shouldUpdate, onUpdate])

  // Update local state when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      firstName: data.firstName || user?.displayName?.split(" ")[0] || "",
      lastName: data.lastName || user?.displayName?.split(" ")[1] || "",
      email: data.email || user?.email || "",
      dateOfBirth: data.dateOfBirth || "",
      gender: data.gender || "",
      phoneNumber: data.phoneNumber || "",
      bio: data.bio || "",
    }))
  }, [data, user])

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required"
        if (value.trim().length < 2) return "First name must be at least 2 characters"
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "First name contains invalid characters"
        break
      case "lastName":
        if (!value.trim()) return "Last name is required"
        if (value.trim().length < 2) return "Last name must be at least 2 characters"
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "Last name contains invalid characters"
        break
      case "email":
        if (!value.trim()) return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address"
        break
      case "dateOfBirth":
        if (!value) return "Date of birth is required"
        const date = new Date(value)
        const now = new Date()
        if (date > now) return "Date of birth cannot be in the future"
        const age = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (age < 13) return "You must be at least 13 years old"
        break
    }
  }

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    const newTouched = { ...touched, [field]: true }
    const error = validateField(field, value)
    const newErrors = { ...errors, [field]: newTouched[field] ? error : undefined }

    setFormData(newFormData)
    setTouched(newTouched)
    setErrors(newErrors)
    setShouldUpdate(true) // Set flag to trigger update
  }

  const handleBlur = (field: string) => {
    const newTouched = { ...touched, [field]: true }
    const error = validateField(field, formData[field as keyof typeof formData])
    const newErrors = { ...errors, [field]: error }

    setTouched(newTouched)
    setErrors(newErrors)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="text-4xl">
                {formData.firstName.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
              <Camera className="h-5 w-5" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Personal Information</h2>
        <p className="text-muted-foreground">
          Tell us about yourself to personalize your experience
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            onBlur={() => handleBlur("firstName")}
            placeholder="Enter your first name"
            aria-invalid={!!errors.firstName}
          />
          {touched.firstName && errors.firstName && (
            <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            onBlur={() => handleBlur("lastName")}
            placeholder="Enter your last name"
            aria-invalid={!!errors.lastName}
          />
          {touched.lastName && errors.lastName && (
            <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          placeholder="Enter your email address"
          aria-invalid={!!errors.email}
        />
        {touched.email && errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          onBlur={() => handleBlur("dateOfBirth")}
          aria-invalid={!!errors.dateOfBirth}
        />
        {touched.dateOfBirth && errors.dateOfBirth && (
          <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender (Optional)</Label>
        <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          placeholder="Tell us a bit about yourself"
          rows={3}
        />
      </div>

      {Object.values(errors).some(Boolean) && touched.firstName && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above to continue
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continue
        </Button>
      </div>
    </div>
  )
}
