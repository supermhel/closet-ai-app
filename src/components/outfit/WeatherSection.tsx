/**
 * Weather Section Component
 * Displays current weather conditions and outfit recommendations
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Cloud,
  Sun,
  CloudRain,
  Droplets,
  Thermometer,
  RefreshCw,
  MapPin,
} from "lucide-react"
import { WeatherData } from "@/types/outfit"
import { Skeleton } from "@/components/ui/skeleton"

interface WeatherSectionProps {
  weather: WeatherData | null
  weatherSuggestion: string
  climateOverride: string | null
  setClimateOverride: (climate: string | null) => void
  onRefresh: () => Promise<void>
  isLoading?: boolean
}

export default function WeatherSection({
  weather,
  weatherSuggestion,
  climateOverride,
  setClimateOverride,
  onRefresh,
  isLoading = false
}: WeatherSectionProps) {
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes("sun") || lowerCondition.includes("clear")) {
      return <Sun className="h-6 w-6 text-yellow-500" />
    } else if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
      return <CloudRain className="h-6 w-6 text-blue-500" />
    } else if (lowerCondition.includes("cloud")) {
      return <Cloud className="h-6 w-6 text-gray-500" />
    }
    return <Cloud className="h-6 w-6 text-gray-500" />
  }

  const climateOptions = [
    { value: "hot", label: "Hot (25°C+)", icon: "🔥" },
    { value: "warm", label: "Warm (20-25°C)", icon: "☀️" },
    { value: "mild", label: "Mild (15-20°C)", icon: "🌤️" },
    { value: "cool", label: "Cool (10-15°C)", icon: "🌥️" },
    { value: "cold", label: "Cold (<10°C)", icon: "❄️" },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {weather?.current?.condition?.text && 
            getWeatherIcon(weather.current.condition.text)
          }
          Weather-Based Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weather ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {weather.location?.name || "Current Location"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Temperature</p>
                  <p className="text-lg font-bold text-blue-600">
                    {weather.current?.temp_c}°C
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Droplets className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Humidity</p>
                  <p className="text-lg font-bold text-gray-600">
                    {weather.current?.humidity}%
                  </p>
                </div>
              </div>
            </div>

            {weatherSuggestion && (
              <Alert>
                <AlertDescription>
                  <strong>Weather Recommendation:</strong> {weatherSuggestion}
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <Alert>
            <AlertDescription>
              Weather data unavailable. You can manually set climate conditions below.
            </AlertDescription>
          </Alert>
        )}

        {/* Climate Override Options */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Manual Climate Override:</p>
          <div className="flex flex-wrap gap-2">
            {climateOptions.map((option) => (
              <Badge
                key={option.value}
                variant={climateOverride === option.value ? "default" : "outline"}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => 
                  setClimateOverride(
                    climateOverride === option.value ? null : option.value
                  )
                }
              >
                {option.icon} {option.label}
              </Badge>
            ))}
            {climateOverride && (
              <Badge
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setClimateOverride(null)}
              >
                Clear Override
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 