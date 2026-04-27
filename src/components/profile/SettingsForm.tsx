"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  Monitor,
  Sun,
  Moon,
  Bell,
  Globe,
  Shield,
  Eye,

  Smartphone,
  Mail,
  Users,
  Lock,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { motion } from "framer-motion"

// Theme and language options
const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follow system preference" }
]

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇧🇷" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "hi", label: "हिन्दी", flag: "🇮🇳" }
]

const PRIVACY_LEVELS = [
  { value: "public", label: "Public", description: "Visible to everyone", icon: Users },
  { value: "friends", label: "Friends Only", description: "Visible to your friends", icon: Eye },
  { value: "private", label: "Private", description: "Only visible to you", icon: Lock }
]

interface SettingsFormProps {
  privacyData: {
    profileVisibility: string
    showLocation: boolean
    showStats?: boolean
    showActivity?: boolean
  }
  preferencesData?: {
    theme?: string
    language?: string
    notifications?: boolean
    emailUpdates?: boolean
    pushNotifications?: boolean
  }
  onInputChange: (field: string, value: string | boolean) => void
  isEditing: boolean
}

export default function SettingsForm({ 
  privacyData, 
  preferencesData = {},
  onInputChange, 
  isEditing 
}: SettingsFormProps) {
  const [currentTheme, setCurrentTheme] = useState(preferencesData.theme || "system")
  const [isDeleteAccount, setIsDeleteAccount] = useState(false)

  // Apply theme changes immediately for preview
  useEffect(() => {
    if (isEditing && currentTheme !== "system") {
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(currentTheme)
    } else if (currentTheme === "system") {
      document.documentElement.classList.remove("light", "dark")
      // System theme will be handled by the system preference
    }
  }, [currentTheme, isEditing])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    onInputChange("preferences.theme", theme)
  }

  const handleDataExport = async () => {
    try {
      // Implementation would export user data
      console.log("Exporting user data...")
      // This would typically trigger a download of user data
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  const handleDeleteAccount = async () => {
    // This would be handled with proper confirmation dialogs
    setIsDeleteAccount(true)
  }

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Theme & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Choose Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const IconComponent = theme.icon
                const isSelected = currentTheme === theme.value
                
                return (
                  <motion.div
                    key={theme.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 w-full ${
                        !isEditing ? "opacity-75 cursor-default" : ""
                      }`}
                      onClick={() => isEditing && handleThemeChange(theme.value)}
                      disabled={!isEditing}
                    >
                      <IconComponent className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">{theme.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {theme.description}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </div>
          
          {currentTheme && (
            <Alert>
              <Sun className="h-4 w-4" />
              <AlertDescription>
                Theme changes will be applied immediately when editing is enabled.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Interface Language</Label>
            <Select
              value={preferencesData.language || "en"}
              onValueChange={(value) => onInputChange("preferences.language", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              Language changes will take effect after refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <Label>Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications about outfit suggestions and app updates.
              </p>
            </div>
            <Switch
              checked={preferencesData.pushNotifications ?? true}
              onCheckedChange={(checked) => onInputChange("preferences.pushNotifications", checked)}
              disabled={!isEditing}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label>Email Updates</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive weekly style tips and app news via email.
              </p>
            </div>
            <Switch
              checked={preferencesData.emailUpdates ?? true}
              onCheckedChange={(checked) => onInputChange("preferences.emailUpdates", checked)}
              disabled={!isEditing}
            />
          </div>

          {/* General Notifications */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>App Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified about outfit recommendations and social features.
              </p>
            </div>
            <Switch
              checked={preferencesData.notifications ?? true}
              onCheckedChange={(checked) => onInputChange("preferences.notifications", checked)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-3">
            <Label>Profile Visibility</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRIVACY_LEVELS.map((level) => {
                const IconComponent = level.icon
                const isSelected = privacyData.profileVisibility === level.value
                
                return (
                  <motion.div
                    key={level.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 w-full ${
                        !isEditing ? "opacity-75 cursor-default" : ""
                      }`}
                      onClick={() => isEditing && onInputChange("privacy.profileVisibility", level.value)}
                      disabled={!isEditing}
                    >
                      <IconComponent className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{level.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {level.description}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Detailed Privacy Controls */}
          <div className="space-y-4">
            <h4 className="font-medium">What others can see</h4>
            
            {/* Location Visibility */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your city and country.
                </p>
              </div>
              <Switch
                checked={privacyData.showLocation}
                onCheckedChange={(checked) => onInputChange("privacy.showLocation", checked)}
                disabled={!isEditing}
              />
            </div>

            {/* Stats Visibility */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Closet Stats</Label>
                <p className="text-sm text-muted-foreground">
                  Display your closet statistics on your profile.
                </p>
              </div>
              <Switch
                checked={privacyData.showStats ?? true}
                onCheckedChange={(checked) => onInputChange("privacy.showStats", checked)}
                disabled={!isEditing}
              />
            </div>

            {/* Activity Visibility */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see your recent outfit activity.
                </p>
              </div>
              <Switch
                checked={privacyData.showActivity ?? false}
                onCheckedChange={(checked) => onInputChange("privacy.showActivity", checked)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Export */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Export Your Data</Label>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your data including outfits and preferences.
              </p>
            </div>
            <Button variant="outline" onClick={handleDataExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="font-medium">Danger Zone</h4>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
              <div className="space-y-0.5">
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={!isEditing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {isDeleteAccount && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Account deletion is permanent and cannot be undone. All your data will be lost.
                  Please contact support if you need assistance.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
