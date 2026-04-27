"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2 } from "lucide-react"
import { countries } from "@/utils/onboarding-constants"
import type { UserLocation } from "@/contexts/profile-context"
import { useProfile } from "@/contexts/profile-context"
import { toast } from "sonner"

interface LocationStepProps {
  data: Partial<UserLocation>
  onUpdate: (data: Partial<UserLocation>) => void
  onNext: () => void
  onPrevious: () => void
}

export function LocationStep({ data, onUpdate, onNext, onPrevious }: LocationStepProps) {
  const { detectLocation } = useProfile()
  const [formData, setFormData] = useState({
    country: data.country || "",
    city: data.city || "",
  })
  const [detecting, setDetecting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate(newData)
  }

  const handleAutoDetect = async () => {
    setDetecting(true)
    try {
      const location = await detectLocation()
      if (location) {
        const newData = {
          country: location.country,
          city: location.city,
        }
        setFormData(newData)
        onUpdate(newData)
        toast.success("Location detected successfully!")
    } else {
        toast.error("Could not detect your location. Please enter it manually.")
      }
    } catch (error) {
      console.error("Error detecting location:", error)
      toast.error("Failed to detect location. Please enter it manually.")
    } finally {
      setDetecting(false)
    }
  }

  const isValid = formData.country && formData.city

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 rounded-full p-6">
            <MapPin className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Your Location</h2>
        <p className="text-muted-foreground">
          We'll use this to provide weather-appropriate outfit suggestions and local style recommendations
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAutoDetect} 
          disabled={detecting}
          className="w-full mb-4"
        >
          {detecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting Location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Auto-Detect My Location
            </>
          )}
        </Button>

      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
                {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City *</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => handleInputChange("city", e.target.value)}
          placeholder="Enter your city"
        />
      </div>

        <div className="text-sm text-muted-foreground mt-4">
          <p>
            This information helps us provide:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Weather-appropriate outfit suggestions</li>
            <li>Local style trends and recommendations</li>
            <li>Seasonal wardrobe planning</li>
          </ul>
        </div>
      </div>

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
