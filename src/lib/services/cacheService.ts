/**
 * Cache Service for Outfit Recommendations
 *
 * Provides intelligent caching for outfit generations to improve performance
 * and reduce redundant AI processing.
 */

import logger from "@/utils/logger"
import { GeneratedOutfit } from "@/types/outfit"
import { ClosetItem } from "@/contexts/closet-context"

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 100 // Maximum number of cached entries
const CACHE_VERSION = '1.0' // For cache invalidation when logic changes

interface CacheEntry {
  data: GeneratedOutfit[]
  timestamp: number
  key: string
  version: string
  metadata: {
    itemCount: number
    occasionType: string
    weatherCondition?: string
    userPreferences?: Record<string, unknown>
  }
}

interface CacheKey {
  userId: string
  itemIds: string[] // Sorted array of item IDs
  occasion: string
  weather?: {
    temp: number
    condition: string
  }
  preferences?: {
    style?: string
    colors?: string[]
    season?: string
  }
}

class OutfitCacheService {
  private cache = new Map<string, CacheEntry>()
  private accessLog = new Map<string, number>() // For LRU eviction

  /**
   * Generate a cache key from outfit generation parameters
   */
  private generateCacheKey(params: CacheKey): string {
    const keyData = {
      userId: params.userId,
      items: params.itemIds.sort(), // Ensure consistent ordering
      occasion: params.occasion,
      weather: params.weather ? {
        temp: Math.round(params.weather.temp / 5) * 5, // Round to nearest 5°C
        condition: params.weather.condition.toLowerCase()
      } : null,
      preferences: params.preferences || {}
    }

    return btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '')
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now()
    const isNotExpired = (now - entry.timestamp) < CACHE_DURATION
    const isCorrectVersion = entry.version === CACHE_VERSION

    return isNotExpired && isCorrectVersion
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < MAX_CACHE_SIZE) return

    // Find least recently accessed entry
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, lastAccess] of this.accessLog.entries()) {
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.accessLog.delete(oldestKey)
      logger.info("Cache LRU eviction", { evictedKey: oldestKey })
    }
  }

  /**
   * Get cached outfit recommendations
   */
  async get(params: CacheKey): Promise<GeneratedOutfit[] | null> {
    const key = this.generateCacheKey(params)
    const entry = this.cache.get(key)

    if (!entry) {
      logger.debug("Cache miss", { key, reason: "not_found" })
      return null
    }

    if (!this.isValidEntry(entry)) {
      this.cache.delete(key)
      this.accessLog.delete(key)
      logger.debug("Cache miss", { key, reason: "expired" })
      return null
    }

    // Update access time for LRU
    this.accessLog.set(key, Date.now())

    logger.info("Cache hit", {
      key,
      itemCount: entry.data.length,
      age: Date.now() - entry.timestamp
    })

    return entry.data
  }

  /**
   * Store outfit recommendations in cache
   */
  async set(
    params: CacheKey,
    outfits: GeneratedOutfit[],
    metadata?: Partial<CacheEntry['metadata']>
  ): Promise<void> {
    this.evictLRU()

    const key = this.generateCacheKey(params)
    const entry: CacheEntry = {
      data: outfits,
      timestamp: Date.now(),
      key,
      version: CACHE_VERSION,
      metadata: {
        itemCount: params.itemIds.length,
        occasionType: params.occasion,
        weatherCondition: params.weather?.condition,
        ...metadata
      }
    }

    this.cache.set(key, entry)
    this.accessLog.set(key, Date.now())

    logger.info("Cache stored", {
      key,
      outfitCount: outfits.length,
      metadata: entry.metadata
    })
  }

  /**
   * Invalidate cache entries for a specific user
   */
  async invalidateUser(userId: string): Promise<void> {
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      try {
        const keyData = JSON.parse(atob(key + '==='))
        if (keyData.userId === userId) {
          keysToDelete.push(key)
        }
      } catch (error) {
        // Invalid key format, remove it
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.accessLog.delete(key)
    })

    logger.info("User cache invalidated", {
      userId,
      entriesRemoved: keysToDelete.length
    })
  }

  /**
   * Invalidate cache when closet items change
   */
  async invalidateForItemChange(userId: string, changedItemId: string): Promise<void> {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      try {
        const keyData = JSON.parse(atob(key + '==='))
        if (keyData.userId === userId && keyData.items.includes(changedItemId)) {
          keysToDelete.push(key)
        }
      } catch (error) {
        // Invalid key format, remove it
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.accessLog.delete(key)
    })

    logger.info("Item change cache invalidation", {
      userId,
      itemId: changedItemId,
      entriesRemoved: keysToDelete.length
    })
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size
    this.cache.clear()
    this.accessLog.clear()

    logger.info("Cache cleared", { entriesRemoved: size })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    const entries = Array.from(this.cache.values())

    return {
      totalEntries: this.cache.size,
      validEntries: entries.filter(entry => this.isValidEntry(entry)).length,
      expiredEntries: entries.filter(entry => !this.isValidEntry(entry)).length,
      oldestEntry: entries.length > 0 ?
        Math.min(...entries.map(e => now - e.timestamp)) : 0,
      newestEntry: entries.length > 0 ?
        Math.max(...entries.map(e => now - e.timestamp)) : 0,
      memoryUsage: this.cache.size * 1024 // Rough estimate
    }
  }
}

// Export singleton instance
export const outfitCache = new OutfitCacheService()

// Helper function to create cache keys from closet items
export function createCacheKey(
  userId: string,
  items: ClosetItem[],
  options: {
    occasion?: string
    weather?: { temp: number; condition: string }
    preferences?: { style?: string; colors?: string[]; season?: string }
  } = {}
): CacheKey {
  return {
    userId,
    itemIds: items.map(item => item.id),
    occasion: options.occasion || 'casual',
    weather: options.weather,
    preferences: options.preferences
  }
}

export default outfitCache 