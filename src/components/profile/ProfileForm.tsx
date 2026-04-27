"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  MapPin,
  User,
  Mail,
  Phone,
  Upload,
  Check,
  AlertCircle,
} from "lucide-react"


interface UserLocation {
  city: string
  country: string
  countryCode?: string
  coords?: {
    latitude: number
    longitude: number
  }
}

interface ProfileFormProps {
  profileData: {
    displayName: string
    bio: string
    email: string
    photoURL?: string
    phoneNumber?: string
    location?: UserLocation
  }
  onInputChange: (field: string, value: string) => void
  isEditing: boolean
  onPhotoUpload?: (photoURL: string) => void
  onLocationUpdate?: (location: UserLocation) => void
}

export default function ProfileForm({ 
  profileData, 
  onInputChange, 
  isEditing,
  onPhotoUpload,
  onLocationUpdate
}: ProfileFormProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [showLocationEditor, setShowLocationEditor] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Available avatar options from public/avatars
  const availableAvatars = [
    '/avatars/avatar1.png',
    '/avatars/avatar2.png', 
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
    '/avatars/avatar6.png'
  ]

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone)
  }

  const validateDisplayName = (name: string) => {
    return name.trim().length >= 2 && name.trim().length <= 50
  }

  const handleInputChangeWithValidation = (field: string, value: string) => {
    // Clear previous error
    setValidationErrors(prev => ({ ...prev, [field]: '' }))

    // Validate input
    let error = ''
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'phoneNumber':
        if (value && !validatePhone(value)) {
          error = 'Please enter a valid phone number'
        }
        break
      case 'displayName':
        if (!validateDisplayName(value)) {
          error = 'Display name must be between 2 and 50 characters'
        }
        break
      case 'bio':
        if (value.length > 500) {
          error = 'Bio must be less than 500 characters'
        }
        break
    }

    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }))
    }

    onInputChange(field, value)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onPhotoUpload) return

    setIsUploadingPhoto(true)
    try {
      // Create a local URL for the uploaded file
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          onPhotoUpload(result)
          setValidationErrors(prev => ({ ...prev, photo: '' }))
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Photo upload failed:', error)
      setValidationErrors(prev => ({ 
        ...prev, 
        photo: 'Failed to upload photo. Please try again.' 
      }))
    } finally {
      setIsUploadingPhoto(false)
    }
  }
  
  const handleAvatarSelect = (avatarUrl: string) => {
    if (onPhotoUpload) {
      onPhotoUpload(avatarUrl)
      setShowAvatarSelector(false)
      setValidationErrors(prev => ({ ...prev, photo: '' }))
    }
  }

  const handleLocationUpdate = (field: 'city' | 'country', value: string) => {
    if (!onLocationUpdate || !profileData.location) return
    
    const updatedLocation = {
      ...profileData.location,
      [field]: value
    }
    onLocationUpdate(updatedLocation)
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profileData.photoURL} alt={profileData.displayName} />
            <AvatarFallback className="text-2xl">
              {profileData.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isEditing && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {/* Upload from Gallery */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={isUploadingPhoto}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={isUploadingPhoto}
                  className="gap-2"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Upload className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                
                {/* Choose from Avatars */}
                <Button
                  variant="outline"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Choose Avatar
                </Button>
              </div>
              
              {/* Avatar Selector */}
              {showAvatarSelector && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">Choose an Avatar</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {availableAvatars.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => handleAvatarSelect(avatar)}
                        className="relative group"
                      >
                        <Avatar className="w-12 h-12 border-2 border-transparent group-hover:border-primary transition-colors">
                          <AvatarImage src={avatar} alt="Avatar option" />
                          <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        {profileData.photoURL === avatar && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {validationErrors.photo && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationErrors.photo}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={profileData.displayName}
              onChange={(e) => handleInputChangeWithValidation("displayName", e.target.value)}
              disabled={!isEditing}
              className={validationErrors.displayName ? "border-red-500" : ""}
            />
            {validationErrors.displayName && (
              <p className="text-sm text-red-500">{validationErrors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChangeWithValidation("email", e.target.value)}
              disabled={!isEditing}
              className={validationErrors.email ? "border-red-500" : ""}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={profileData.phoneNumber || ''}
              onChange={(e) => handleInputChangeWithValidation("phoneNumber", e.target.value)}
          disabled={!isEditing}
              placeholder="+1 (555) 123-4567"
              className={validationErrors.phoneNumber ? "border-red-500" : ""}
        />
            {validationErrors.phoneNumber && (
              <p className="text-sm text-red-500">{validationErrors.phoneNumber}</p>
            )}
      </div>

          {/* Bio */}
          <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profileData.bio}
              onChange={(e) => handleInputChangeWithValidation("bio", e.target.value)}
          disabled={!isEditing}
          rows={4}
              placeholder="Tell us about yourself..."
              className={validationErrors.bio ? "border-red-500" : ""}
            />
            <div className="flex justify-between">
              {validationErrors.bio && (
                <p className="text-sm text-red-500">{validationErrors.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                {profileData.bio.length}/500 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location Display */}
          {profileData.location && (profileData.location.city || profileData.location.country) && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                {profileData.location.city && profileData.location.country 
                  ? `${profileData.location.city}, ${profileData.location.country}`
                  : profileData.location.city || profileData.location.country}
              </span>
            </div>
          )}
          
          {/* Location Editor */}
          {isEditing && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowLocationEditor(!showLocationEditor)}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {showLocationEditor ? 'Hide Location Editor' : 'Edit Location'}
              </Button>
              
              {showLocationEditor && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium">Update Your Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-city">City</Label>
                      <input
                        id="edit-city"
                        type="text"
                        value={profileData.location?.city || ''}
                        onChange={(e) => handleLocationUpdate('city', e.target.value)}
                        placeholder="Enter your city"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-country">Country</Label>
                      <input
                        id="edit-country"
                        type="text"
                        value={profileData.location?.country || ''}
                        onChange={(e) => handleLocationUpdate('country', e.target.value)}
                        placeholder="Enter your country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This location was initially set during onboarding. You can update it here.
                  </p>
                </div>
              )}
              
              {validationErrors.location && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationErrors.location}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Your location helps us provide better weather-based outfit recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
