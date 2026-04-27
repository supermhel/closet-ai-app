"use client"

import { useProfile } from "@/contexts/profile-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, MapPin, RefreshCw, Shirt } from "lucide-react"
import Link from "next/link"
import { useWeather } from "@/hooks/use-weather"

interface WeatherWidgetProps {
  compact?: boolean
  className?: string
  showOutfitRecommendations?: boolean
  showOutfitButton?: boolean
}

/**
 * Standardized weather widget component for use across the application
 * 
 * This component provides a consistent weather display UI that can be used in multiple places:
 * - Dashboard page (full size version)
 * - Sidebar widgets (compact version)
 * - Profile pages
 * - Outfit planning pages
 * 
 * Features:
 * - Uses the useWeather hook for standardized data fetching and caching
 * - Responsive design with compact/full-size modes
 * - Handles loading, error, and empty states
 * - Shows weather condition, temperature, and humidity
 * - Can display outfit recommendations based on weather
 * - Includes a refresh button to update weather data
 * - Falls back to location detection if user location isn't set
 * 
 * Note: This component replaces multiple duplicated weather display implementations
 * that previously existed across the app, standardizing both the UI and data fetching.
 * 
 * @example
 * // Basic usage (full size)
 * <WeatherWidget />
 * 
 * // Compact version for sidebars
 * <WeatherWidget compact={true} showOutfitButton={false} />
 * 
 * @param props Configuration options for the widget
 */
export function WeatherWidget({
  compact = false,
  className = "",
  showOutfitRecommendations = true,
  showOutfitButton = true
}: WeatherWidgetProps) {
  const { profile } = useProfile()
  const {
    weather,
    recommendations,
    isLoading,
    isRefreshing,
    error,
    refreshWeather
  } = useWeather({
    waitForProfileLocation: true,
  })

  // Function to render the weather icon
  const getWeatherIcon = (iconUrl?: string) => {
    if (iconUrl) {
      return (
        <img
          src={iconUrl.startsWith("//") ? `https:${iconUrl}` : iconUrl}
          alt="Weather condition"
          className={compact ? "h-8 w-8" : "h-12 w-12"}
        />
      )
    }
    return <Cloud className={compact ? "h-8 w-8 text-gray-400" : "h-12 w-12 text-gray-400"} />
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-1 px-3" : "pb-2"}>
          <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center ${compact ? "text-base" : ""}`}>
            <Cloud className={`${compact ? "h-4 w-4 mr-1" : "h-5 w-5 mr-2"}`} />
            {compact ? "Weather" : "Weather & Outfit Recommendations"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshWeather()}
            disabled={isLoading || isRefreshing}
            title="Refresh weather data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
            </div>
      </CardHeader>
      <CardContent className={compact ? "px-3 py-2" : ""}>
        {isLoading ? (
          <div className={`flex items-center justify-center ${compact ? "h-16" : "h-32"}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <p className="text-muted-foreground text-sm">
              {error}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refreshWeather()}>
              Retry
            </Button>
          </div>
        ) : weather ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm text-muted-foreground ${compact ? "mb-0" : "mb-1"}`}>
                  {profile?.location?.city || weather.location.name || "Current Weather"}
                </p>
                <div className="flex items-center">
                  {getWeatherIcon(weather.current?.condition?.icon)}
                  <div className={compact ? "ml-2" : ""}>
                    <p className={compact ? "text-xl font-bold" : "text-2xl font-bold"}>
                      {Math.round(weather.current?.temp_c)}°C
                    </p>
                    <p className="text-sm capitalize">{weather.current?.condition?.text}</p>
                  </div>
                </div>
                    </div>
              {!compact && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Feels Like</p>
                  <p className="text-lg font-medium">{Math.round(weather.current?.feels_like)}°C</p>
                  <p className="text-sm text-muted-foreground">Humidity: {weather.current?.humidity}%</p>
                </div>
              )}
            </div>

            {showOutfitRecommendations && recommendations.length > 0 && !compact && (
              <div>
                <p className="text-sm font-medium mb-2">Recommended for today:</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="space-y-2">
                    {recommendations.slice(0, 2).map((recommendation, index) => (
                      <p key={index} className="text-sm">{recommendation}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showOutfitButton && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/outfit">
                  <Shirt className="h-4 w-4 mr-2" />
                  Plan Today&apos;s Outfit
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground">
              {profile?.location?.city
                ? "Unable to fetch weather data"
                : "Set your location to see weather"}
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/profile">
                <MapPin className="h-4 w-4 mr-1" />
                {profile?.location?.city ? "Update Location" : "Set Location"}
              </Link>
            </Button>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
