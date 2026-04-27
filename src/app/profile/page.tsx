"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useProfile, type StylePreferences } from "@/contexts/profile-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  User,
  MapPin,
  Mail,

  Edit3,
  Camera,
  Palette,
  Heart,
  Check,
  X,
  TrendingUp,
  Eye,
  Globe,
} from "lucide-react"
import { motion } from "framer-motion"
import { doc, updateDoc, type FieldValue } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { db } from "@/lib/firebase"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { toast } from "sonner"
import PreferencesForm from "@/components/profile/PreferencesForm"
import SettingsForm from "@/components/profile/SettingsForm"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
}

// Inline editable component
function EditableField({ 
  value, 
  onSave, 
  type = "text", 
  placeholder, 
  multiline = false,
  className = "",
  displayClassName = ""
}: {
  value: string
  onSave: (value: string) => void
  type?: string
  placeholder?: string
  multiline?: boolean
  className?: string
  displayClassName?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className={className}
            rows={3}
          />
        ) : (
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className={className}
          />
        )}
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={`group cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors ${displayClassName}`}
      onClick={() => setIsEditing(true)}
    >
      <span className={value ? "" : "text-muted-foreground italic"}>
        {value || placeholder || "Click to add..."}
      </span>
      <Edit3 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline" />
    </div>
  )
}

// Photo Upload Modal Component
function PhotoUploadModal({ 
  isOpen, 
  onClose, 
  currentPhotoURL, 
  onPhotoUpdate 
}: {
  isOpen: boolean
  onClose: () => void
  currentPhotoURL: string
  onPhotoUpdate: (photoURL: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)

  const availableAvatars = [
    "/avatars/avatar1.png",
    "/avatars/avatar2.png", 
    "/avatars/avatar3.png",
    "/avatars/avatar4.png",
    "/avatars/avatar5.png",
    "/avatars/avatar6.png",
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          onPhotoUpdate(result)
          toast.success("Photo updated!")
          onClose()
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Photo upload failed:", error)
      toast.error("Failed to upload photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAvatarSelect = (avatarUrl: string) => {
    onPhotoUpdate(avatarUrl)
    toast.success("Avatar updated!")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Update Profile Photo</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Current Photo */}
          <div className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-2">
              <AvatarImage src={currentPhotoURL} />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">Current photo</p>
          </div>

          {/* Upload New Photo */}
          <div>
            <Label htmlFor="photo-upload" className="block mb-2">Upload New Photo</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Label 
                htmlFor="photo-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span>Click to upload photo</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG up to 5MB</span>
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Avatar Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Choose Avatar</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              >
                {showAvatarSelector ? "Hide" : "Show"} Options
              </Button>
            </div>
            
            {showAvatarSelector && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                {availableAvatars.map((avatar, index) => (
                  <button
                    key={avatar}
                    onClick={() => handleAvatarSelect(avatar)}
                    className="relative group hover:scale-105 transition-transform"
                  >
                    <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-primary">
                      <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                      <AvatarFallback>A{index + 1}</AvatarFallback>
                    </Avatar>
                    {currentPhotoURL === avatar && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const { profile: profileContextData, loading: profileLoading, updateProfile: updateProfileContext, updateStylePreferences } = useProfile()
  const router = useRouter()

  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    email: "",
    photoURL: "",
    phoneNumber: "",
    location: {
      city: "",
      country: "",
    },
    preferences: {
      theme: "system",
      notifications: true,
      language: "en",
      interests: [] as string[],
      styles: [] as string[],
      colors: [] as string[],
      sizes: [] as string[],
      occasions: [] as string[],
      brands: [] as string[],
      fits: [] as string[],
      patterns: [] as string[],
    },
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile && profileContextData) {
      const stylePrefs: Partial<StylePreferences> = profileContextData?.stylePreferences || {}
      
      setProfileData({
        displayName: userProfile.displayName || "",
        bio: profileContextData?.bio || "",
        email: userProfile.email || "",
        photoURL: userProfile.photoURL || "",
        phoneNumber: profileContextData?.phoneNumber || "",
        location: {
          city: profileContextData?.location?.city || userProfile.location?.city || "",
          country: profileContextData?.location?.country || userProfile.location?.country || "",
        },
        preferences: {
          theme: userProfile.preferences?.theme || "system",
          notifications: userProfile.preferences?.notifications ?? true,
          language: userProfile.preferences?.language || "en",
          interests: userProfile.preferences?.interests || [],
          styles: stylePrefs.personalStyle || [],
          colors: stylePrefs.colorPreferences || stylePrefs.favoriteColors || [],
          sizes: stylePrefs.sizePreference || [],
          occasions: stylePrefs.occasionWear || [],
          brands: stylePrefs.favoriteBrands || [],
          fits: stylePrefs.fitPreferences || [],
          patterns: stylePrefs.patterns || stylePrefs.favoritePatterns || [],
        },
      })
    }
  }, [userProfile, profileContextData])

  const handleFieldSave = async (field: string, value: string) => {
    if (!user) return

    try {
      // Update local state
      setProfileData(prev => ({ ...prev, [field]: value }))

      // Update in Firebase and contexts
      if (field === "displayName" || field === "bio" || field === "phoneNumber") {
        // Only update if value is not empty or undefined
        const updateData: Record<string, string> = {}
        if (value !== undefined && value !== null && value.trim() !== "") {
          updateData[field] = value.trim()
        }
        
        if (Object.keys(updateData).length > 0) {
          // If updating displayName, also update Firebase Auth
          if (field === "displayName" && value.trim() !== "") {
            await updateProfile(user, {
              displayName: value.trim()
            })
          }
          
          await updateProfileContext(updateData)
        }
      }

      // Also update in auth context for basic fields
      const userRef = doc(db, "users", user.uid)
      const firebaseUpdateData: Record<string, unknown> = { updatedAt: new Date() }
      
      // Only add the field if it has a valid value
      if (value !== undefined && value !== null && value.trim() !== "") {
        firebaseUpdateData[field] = value.trim()
      }
      
      await updateDoc(userRef, firebaseUpdateData as { [x: string]: FieldValue | Partial<unknown> | undefined })
      
      await refreshProfile()
      toast.success("Updated successfully!")
    } catch (error) {
      console.error("Error updating field:", error)
      toast.error("Failed to update. Please try again.")
    }
  }

  const handleLocationSave = async (field: 'city' | 'country', value: string) => {
    if (!user) return

    try {
      const newLocation = { ...profileData.location, [field]: value }
      setProfileData(prev => ({ ...prev, location: newLocation }))

      // Only update if we have valid location data
      const locationUpdate: { city?: string; country?: string } = {}
      
      if (newLocation.city && newLocation.city.trim() !== "") {
        locationUpdate.city = newLocation.city.trim()
      }
      if (newLocation.country && newLocation.country.trim() !== "") {
        locationUpdate.country = newLocation.country.trim()
      }

      if (Object.keys(locationUpdate).length > 0) {
        // Ensure we have required fields for UserLocation
        const validLocation = {
          city: locationUpdate.city || "",
          country: locationUpdate.country || "",
        }
        
        await updateProfileContext({ 
          location: validLocation
        })
      }

      toast.success("Location updated!")
    } catch (error) {
      console.error("Error updating location:", error)
      toast.error("Failed to update location.")
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setProfileData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      }))
    } else {
      setProfileData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleArrayToggle = async (field: string, value: string) => {
    const fieldPath = field.split(".")
    let currentArray: string[] = []
    
    if (fieldPath.length === 2 && fieldPath[0] === 'preferences') {
      const prefKey = fieldPath[1] as keyof typeof profileData.preferences
      const prefsValue = profileData.preferences[prefKey]
      if (Array.isArray(prefsValue)) {
        currentArray = prefsValue
      }
    }

    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value]

    if (fieldPath.length === 2 && fieldPath[0] === 'preferences') {
      const updatedPrefs = {
        ...profileData.preferences,
        [fieldPath[1]]: newArray,
      }
      
      setProfileData(prev => ({
        ...prev,
        preferences: updatedPrefs,
      }))

      // Save to profile context
      try {
        await updateStylePreferences({
          personalStyle: fieldPath[1] === 'styles' ? newArray : profileData.preferences.styles,
          colorPreferences: fieldPath[1] === 'colors' ? newArray : profileData.preferences.colors,
          sizePreference: fieldPath[1] === 'sizes' ? newArray : profileData.preferences.sizes,
          occasionWear: fieldPath[1] === 'occasions' ? newArray : profileData.preferences.occasions,
          favoriteBrands: fieldPath[1] === 'brands' ? newArray : profileData.preferences.brands,
          fitPreferences: fieldPath[1] === 'fits' ? newArray : profileData.preferences.fits,
          patterns: fieldPath[1] === 'patterns' ? newArray : profileData.preferences.patterns,
        })
        toast.success("Preferences updated!")
      } catch (error) {
        console.error("Error updating preferences:", error)
        toast.error("Failed to update preferences.")
      }
    }
  }

  const handlePhotoUpdate = async (photoURL: string) => {
    if (!user) return

    try {
      setProfileData(prev => ({ ...prev, photoURL }))
      
      // Only update if photoURL is valid
      if (photoURL && photoURL.trim() !== "") {
        const trimmedPhotoURL = photoURL.trim()
        
        // Update Firebase Auth user profile (this updates user.photoURL for navbar)
        await updateProfile(user, {
          photoURL: trimmedPhotoURL
        })
        
        // Update Profile Context
        await updateProfileContext({ photoURL: trimmedPhotoURL })
        
        // Update Firestore document
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, { 
          photoURL: trimmedPhotoURL, 
          updatedAt: new Date() 
        })
      }
      
      // Refresh the profile to sync all contexts
      await refreshProfile()
      
      toast.success("Profile photo updated!")
    } catch (error) {
      console.error("Error updating photo:", error)
      toast.error("Failed to update photo.")
    }
  }

  const getProfileCompleteness = () => {
    const requiredFields = [
      profileData.displayName, // Essential
      profileData.email, // Always present
    ]
    
    const optionalFields = [
      profileData.bio,
      profileData.phoneNumber,
      profileData.location.city,
      profileData.location.country,
      profileData.photoURL,
      profileData.preferences.styles.length > 0,
      profileData.preferences.colors.length > 0,
      profileData.preferences.sizes.length > 0,
      profileData.preferences.occasions.length > 0,
      profileData.preferences.brands.length > 0,
    ]
    
    const requiredCompleted = requiredFields.filter(Boolean).length
    const optionalCompleted = optionalFields.filter(Boolean).length
    
    // Required fields are worth 60%, optional fields 40%
    const requiredScore = (requiredCompleted / requiredFields.length) * 60
    const optionalScore = (optionalCompleted / optionalFields.length) * 40
    
    return Math.round(requiredScore + optionalScore)
  }

  const getStyleSummary = () => {
    const { styles, colors, occasions } = profileData.preferences
    const summary = []
    if (styles.length > 0) summary.push(styles.slice(0, 2).join(", "))
    if (colors.length > 0) summary.push(colors.slice(0, 2).join(", "))
    if (occasions.length > 0) summary.push(occasions.slice(0, 1)[0])
    return summary.join(" • ") || "Set your style preferences"
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const completeness = getProfileCompleteness()

  return (
    <ComponentErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Profile Header */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
                <CardContent className="relative p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profileData.photoURL} />
                        <AvatarFallback className="text-2xl font-bold">
                          {profileData.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        size="sm" 
                        onClick={() => setShowPhotoModal(true)}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 space-y-2">
                      <EditableField
                        value={profileData.displayName}
                        onSave={(value) => handleFieldSave("displayName", value)}
                        placeholder="Your display name"
                        displayClassName="text-3xl font-bold"
                      />
                      <EditableField
                        value={profileData.bio}
                        onSave={(value) => handleFieldSave("bio", value)}
                        placeholder="Tell us about yourself..."
                        multiline
                        displayClassName="text-muted-foreground"
                      />
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {profileData.email}
                        </div>
                        {profileData.location.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {profileData.location.city}, {profileData.location.country}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{completeness}%</div>
                        <div className="text-sm text-muted-foreground">Complete</div>
                      </div>
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${completeness}, 100`}
                            className="text-primary"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Overview Cards */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Style Summary */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Style Profile</h3>
                        <p className="text-sm text-muted-foreground">{getStyleSummary()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Location</h3>
                        <div className="space-y-1">
                          <EditableField
                            value={profileData.location.city}
                            onSave={(value) => handleLocationSave("city", value)}
                            placeholder="Add your city"
                            displayClassName="text-sm text-muted-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Count */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Heart className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Preferences</h3>
                        <p className="text-sm text-muted-foreground">
                          {profileData.preferences.styles.length + profileData.preferences.colors.length} items set
                        </p>
                      </div>
                </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Detailed Tabs */}
            <motion.div variants={itemVariants}>
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>

                <TabsContent value="about" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Phone Number</Label>
                          <EditableField
                            value={profileData.phoneNumber}
                            onSave={(value) => handleFieldSave("phoneNumber", value)}
                            placeholder="Add your phone number"
                            type="tel"
                          />
                        </div>
                        <div>
                          <Label>Email Address</Label>
                          <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                            {profileData.email}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location Details */}
                <Card>
                  <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Location
                        </CardTitle>
                  </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>City</Label>
                          <EditableField
                            value={profileData.location.city}
                            onSave={(value) => handleLocationSave("city", value)}
                            placeholder="Your city"
                          />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <EditableField
                            value={profileData.location.country}
                            onSave={(value) => handleLocationSave("country", value)}
                            placeholder="Your country"
                          />
                        </div>
                  </CardContent>
                </Card>
                  </div>
              </TabsContent>

                                <TabsContent value="style" className="space-y-4">
                  <PreferencesForm
                    preferencesData={{
                      styles: profileData.preferences.styles,
                      colors: profileData.preferences.colors,
                      sizes: profileData.preferences.sizes,
                      budget: "mid-range",
                      occasions: profileData.preferences.occasions,
                      brands: profileData.preferences.brands,
                      fits: profileData.preferences.fits,
                      patterns: profileData.preferences.patterns,
                    }}
                    onArrayToggle={handleArrayToggle}
                    isEditing={true}
                    styleOptions={[
                      "Minimalist", "Bohemian", "Classic", "Trendy", "Casual",
                      "Formal", "Vintage", "Streetwear", "Preppy", "Edgy"
                    ]}
                    colorOptions={[
                      "Black", "White", "Gray", "Navy", "Brown", "Beige",
                      "Red", "Pink", "Orange", "Yellow", "Green", "Blue", "Purple"
                    ]}
                    sizeOptions={["XS", "S", "M", "L", "XL", "XXL"]}
                    onInputChange={handleInputChange}
                  />
                </TabsContent>

                              <TabsContent value="settings">
                  <SettingsForm
                    privacyData={{
                      profileVisibility: "public",
                      showLocation: true,
                      showStats: true,
                      showActivity: false,
                    }}
                    preferencesData={{
                      theme: profileData.preferences.theme,
                      language: profileData.preferences.language,
                      notifications: profileData.preferences.notifications,
                      emailUpdates: true,
                      pushNotifications: true,
                    }}
                    onInputChange={handleInputChange}
                    isEditing={true}
                  />
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{completeness}%</div>
                        <div className="text-sm text-muted-foreground">Profile Complete</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <Eye className="h-8 w-8 mx-auto mb-2 text-secondary" />
                        <div className="text-2xl font-bold">{profileData.preferences.styles.length}</div>
                        <div className="text-sm text-muted-foreground">Style Preferences</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <Globe className="h-8 w-8 mx-auto mb-2 text-accent" />
                        <div className="text-2xl font-bold">{profileData.location.city ? "1" : "0"}</div>
                        <div className="text-sm text-muted-foreground">Locations Added</div>
                      </CardContent>
                    </Card>
                  </div>
              </TabsContent>
            </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentPhotoURL={profileData.photoURL}
        onPhotoUpdate={handlePhotoUpdate}
      />
    </ComponentErrorBoundary>
  )
}