/**
 * Unified Preference System
 * Merges onboarding app preferences with profile style preferences
 */

export interface AppPreferences {
  // Theme & Display
  theme: "light" | "dark" | "system"
  language: string
  
  // Notifications
  notifications: boolean
  emailUpdates: boolean
  pushNotifications: boolean
  
  // Fashion Interests (from onboarding)
  interests: string[]
}

export interface StylePreferences {
  // Basic Style Elements
  styles: string[]
  colors: string[]
  sizes: string[]
  
  // Advanced Style Elements
  budget: string
  occasions: string[]
  brands: string[]
  fits: string[]
  patterns: string[]
  
  // Future Enhancement Fields
  fabrics?: string[]
  seasons?: string[]
  bodyType?: string
  lifestyle?: string[]
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "friends" | "private"
  showLocation: boolean
  showStats: boolean
  showActivity: boolean
  showRecentActivity: boolean
  allowDataCollection: boolean
}

export interface UnifiedPreferences {
  app: AppPreferences
  style: StylePreferences
  privacy: PrivacyPreferences
  lastUpdated: Date
  version: string // For future migrations
}

// Default values for new users
export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: "system",
  language: "English",
  notifications: true,
  emailUpdates: true,
  pushNotifications: true,
  interests: []
}

export const DEFAULT_STYLE_PREFERENCES: StylePreferences = {
  styles: [],
  colors: [],
  sizes: [],
  budget: "mid-range",
  occasions: [],
  brands: [],
  fits: [],
  patterns: []
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: "public",
  showLocation: true,
  showStats: true,
  showActivity: false,
  showRecentActivity: true,
  allowDataCollection: true
}

export const DEFAULT_UNIFIED_PREFERENCES: UnifiedPreferences = {
  app: DEFAULT_APP_PREFERENCES,
  style: DEFAULT_STYLE_PREFERENCES,
  privacy: DEFAULT_PRIVACY_PREFERENCES,
  lastUpdated: new Date(),
  version: "1.0"
}

// Migration helper for existing users
export function migrateToUnifiedPreferences(
  oldAppPrefs?: Partial<AppPreferences>,
  oldStylePrefs?: Partial<StylePreferences>, 
  oldPrivacyPrefs?: Partial<PrivacyPreferences>
): UnifiedPreferences {
  return {
    app: {
      ...DEFAULT_APP_PREFERENCES,
      ...oldAppPrefs
    },
    style: {
      ...DEFAULT_STYLE_PREFERENCES,
      ...oldStylePrefs
    },
    privacy: {
      ...DEFAULT_PRIVACY_PREFERENCES,
      ...oldPrivacyPrefs
    },
    lastUpdated: new Date(),
    version: "1.0"
  }
} 