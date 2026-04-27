import { useState, useEffect, useCallback } from "react"
import { useProfile } from "@/contexts/profile-context"
import { fetchWeatherWithLocation, getWeatherOutfitRecommendations } from "@/lib/services/weatherService"
import { WeatherData } from "@/utils/types"
import logger from "@/utils/logger"

export interface UseWeatherOptions {
  enabled?: boolean
  refetchInterval?: number | false
  onSuccess?: (data: WeatherData) => void
  onError?: (error: Error) => void
  waitForProfileLocation?: boolean
}

/**
 * Custom hook for fetching and caching weather data across the application
 * 
 * This hook provides a standardized way to access weather data throughout the app:
 * - Uses React state for storing weather data
 * - Leverages the centralized fetchWeatherWithLocation function for data fetching
 * - Provides consistent loading, error, and success states
 * - Includes outfit recommendations based on weather conditions
 * 
 * ## Usage examples:
 * 
 * ```tsx
 * // Basic usage
 * const { weather, isLoading, error } = useWeather()
 * 
 * // With custom options
 * const { weather, recommendations } = useWeather({
 *   refetchInterval: 1000 * 60 * 30, // 30 minutes
 *   enabled: !!userId
 * })
 * 
 * // Manual refresh
 * const { refreshWeather } = useWeather()
 * <Button onClick={refreshWeather}>Refresh Weather</Button>
 * ```
 * 
 * @param options Configuration options for the hook
 * @returns Weather data, recommendations, loading/error states and utility functions
 */
export function useWeather(options: UseWeatherOptions = {}) {
  const { profile, loading: profileLoading } = useProfile()
  
  const {
    enabled = true,
    refetchInterval = 1000 * 60 * 10, // 10 minutes
    onSuccess,
    onError,
    waitForProfileLocation = true,
  } = options

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch weather data
  const fetchWeather = useCallback(async (isRefresh = false) => {
    if (!enabled) return
    
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    
    setError(null)
    
    try {
      logger.info("Fetching weather data via useWeather hook")
      const data = await fetchWeatherWithLocation(profile?.location)
      setWeather(data)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather data"
      setError(errorMessage)
      if (onError) onError(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [enabled, profile?.location, onSuccess, onError])

  // Initial fetch and interval setup
  useEffect(() => {
    // If waiting for profile location is enabled, don't fetch until profile is loaded and has location
    if (waitForProfileLocation && (profileLoading || !profile?.location)) {
      return;
    }
    
    if (!enabled) return
    
    fetchWeather()
    
    // Set up interval for refetching if enabled
    let intervalId: NodeJS.Timeout | null = null
    if (refetchInterval !== false) {
      intervalId = setInterval(() => {
        fetchWeather(true)
      }, refetchInterval)
    }
    
    // Cleanup interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [enabled, refetchInterval, profile?.location?.city, profile?.location?.country, fetchWeather, waitForProfileLocation, profileLoading, profile?.location])

  // Recommendations based on current weather
  const recommendations = weather ? getWeatherOutfitRecommendations(weather) : []

  // Function to manually refresh weather data
  const refreshWeather = async () => {
    logger.info("Manually refreshing weather data")
    await fetchWeather(true)
  }

  // Function to invalidate weather cache (now just refetches)
  const invalidateWeather = () => {
    logger.info("Invalidating weather cache")
    fetchWeather(true)
  }

  return {
    weather,
    recommendations,
    isLoading: isLoading || (waitForProfileLocation && profileLoading),
    isRefreshing,
    error,
    refreshWeather,
    invalidateWeather,
  }
} 