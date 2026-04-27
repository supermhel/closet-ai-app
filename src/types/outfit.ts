/**
 * Comprehensive TypeScript interfaces for outfit management
 */

import { ClosetItem } from "@/contexts/closet-context"

export interface WeatherData {
  location?: { 
    name?: string 
    country?: string
  }
  current?: { 
    temp_c?: number
    condition?: { 
      text?: string
      icon?: string 
    }
    humidity?: number
  }
  wind?: { 
    speed?: number 
  }
}

export interface OutfitCompatibilityResult {
  compatible: boolean
  score: number
  analysis: Array<{ type: 'positive' | 'negative' | 'neutral' | 'error'; text: string }>
  suggestions: string[]
}

export interface GeneratedOutfit {
  id: string
  name: string
  items: ClosetItem[]
  score: number
  reasoning: string[]
  tags: string[]
  weatherSuitability: number
  colorHarmony: number
  styleConsistency: number
  confidence?: number
  occasion?: string
  weather?: WeatherData['current']
  createdAt?: Date // Make optional since service doesn't always provide
  analysis?: {
    colorHarmony: number
    styleConsistency: number
    weatherSuitability: number
  }
}

export interface SavedOutfit {
  id: string
  name: string
  items: string[] // Item IDs
  itemsData: ClosetItem[]
  date?: Date
  occasion?: string
  weather?: string
  isFavorite?: boolean
  rating?: number
  createdAt: Date
  updatedAt?: Date
}

export interface FavoriteOutfit {
  id: string
  name: string
  items: Array<{
    id: string
    name: string
    imageUrl?: string
    category?: string
  }>
  createdAt: Date
}

export interface OutfitGenerationOptions {
  weather?: WeatherData | null
  occasion?: string
  style?: string
  colorPreference?: string[]
  avoidColors?: string[]
  season?: string
}

export interface OutfitRating {
  id: string
  outfitItems: string[] // Item IDs
  rating: number // 1-5
  feedback?: string
  timestamp: Date
  weather?: number
  occasion?: string
}

export interface ManualOutfitSelection {
  tops: ClosetItem | null
  bottoms: ClosetItem | null
  shoes: ClosetItem | null
  accessories: ClosetItem[]
}

export interface CalendarOutfit {
  id: string
  date: Date
  outfit: SavedOutfit
  weather?: WeatherData
} 