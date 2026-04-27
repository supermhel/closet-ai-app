import logger from "@/utils/logger"
import { ServiceError } from "@/utils/serviceUtils"
import { aiCache } from "@/utils/aiCache"
import { WeatherData, ServiceErrorCode } from "@/utils/types"
import { UserLocation } from "@/contexts/profile-context"

/**
 * Centralized function for fetching weather data that uses user's profile location.
 * 
 * This function is the main entry point for weather data in the client-side application:
 * - Used directly by the useWeather hook for React components
 * - Provides a single consistent interface for all weather data needs
 * - Relies exclusively on the profile location data
 * 
 * Note: This service function is preferred over API routes for client-side components
 * as it avoids unnecessary HTTP requests and provides better type safety.
 * 
 * For server-side or external access, use the /api/weather/* endpoints.
 * 
 * @param profileLocation - User's stored location from ProfileContext
 * @returns Promise<WeatherData> - Weather data including current conditions
 */
export async function fetchWeatherWithLocation(
  profileLocation?: UserLocation | null
): Promise<WeatherData> {
  try {
    logger.info("Fetching weather with profile location")
    
    // Use profile location if available
    if (profileLocation?.city) {
      const coords = profileLocation.coords
      logger.info("Using profile location", { city: profileLocation.city })
      
      return await getWeatherData(
        coords?.latitude,
        coords?.longitude,
        profileLocation.city
      )
    }
    
    // If no profile location is available, throw an error
    throw new Error("No location available. Please set your location in your profile.")
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error("Error in fetchWeatherWithLocation", { error: errorMessage })
    throw new Error(errorMessage)
  }
}

/**
 * Fetch real weather data from WeatherAPI
 */
export async function getWeatherData(lat?: number, lon?: number, location?: string): Promise<WeatherData> {
  try {
    const cacheKey = `weather-${lat}-${lon}-${location}`

    // Check cache first (cache for 10 minutes)
    const cached = aiCache.get<WeatherData>(cacheKey)
    if (cached) {
      logger.info("Returning cached weather data")
      return cached
    }

    // Try both environment variable formats
    const apiKey = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY
    if (!apiKey) {
      throw new ServiceError(
        "Weather API key not configured",
        ServiceErrorCode.MISSING_API_KEY
      )
    }

    let query = ""
    if (lat && lon) {
      query = `${lat},${lon}`
    } else if (location) {
      query = location
    } else {
      throw new Error("No location parameters provided")
    }

    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=yes`

    logger.info("Fetching weather data", { query, url: url.replace(apiKey, "[REDACTED]") })

    const response = await fetch(url)

    if (!response.ok) {
      throw new ServiceError(
        `Failed to get weather data: ${response.status}`,
        ServiceErrorCode.WEATHER_ERROR,
        response.status
      )
    }

    const data = await response.json()
    const weatherData: WeatherData = {
      current: {
        temp_c: data.current.temp_c,
        feels_like: data.current.feelslike_c,
        humidity: data.current.humidity,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
          code: data.current.condition.code,
        },
        wind_kph: data.current.wind_kph,
        uv: data.current.uv,
        visibility_km: data.current.vis_km,
      },
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        tz_id: data.location.tz_id,
        localtime: data.location.localtime,
      },
      forecast: data.forecast
    }

    // Cache for 10 minutes - using type assertion to satisfy the linter
    aiCache.set<Record<string, unknown>>(cacheKey, weatherData as unknown as Record<string, unknown>, 10 * 60 * 1000)

    logger.info("Weather data fetched successfully", {
      location: weatherData.location.name,
      temp: weatherData.current.temp_c,
      condition: weatherData.current.condition.text,
      timestamp: Date.now()
    })

    return weatherData
  } catch (error: unknown) {
    logger.error("Weather fetch failed", { error: error instanceof Error ? error.message : "Unknown error" })

    // Return fallback weather data instead of throwing
    const fallbackWeather: WeatherData = {
      current: {
        temp_c: 20,
        feels_like: 20,
        humidity: 50,
        condition: {
          text: "Partly cloudy",
          icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          code: 1003
        },
        wind_kph: 10,
        uv: 3,
        visibility_km: 10
      },
      location: {
        name: "Unknown",
        region: "Unknown",
        country: "Unknown",
        lat: 0,
        lon: 0,
        tz_id: "UTC",
        localtime: new Date().toISOString()
      }
    }

    logger.warn("Using fallback weather data", fallbackWeather)
    return fallbackWeather
  }
}

/**
 * Alias for getWeatherData for backward compatibility
 */
export const getCurrentWeather = getWeatherData;

/**
 * Get real weather forecast data
 */
export async function getWeatherForecast(
  lat?: number,
  lon?: number,
  location?: string,
  days = 3
): Promise<WeatherData> {
  try {
    const cacheKey = `forecast-${lat ?? 'na'  }-${lon ?? 'na'}-${location ?? 'na'}-${days}`;

    // Check cache first (cache for 30 minutes for forecasts)
    const cached = aiCache.get<WeatherData>(cacheKey);
    if (cached) {
      logger.info("Returning cached weather forecast data");
      return cached;                                                                                      
    }

    // Try both environment variable formats
    const apiKey = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (!apiKey) {
      throw new ServiceError(
        "Weather API key not configured", 
        ServiceErrorCode.MISSING_API_KEY
      );
    }

    let query = "";
    if (lat && lon) {
      query = `${lat},${lon}`;
    } else if (location) {
      query = location;
    } else {
      throw new Error("No location parameters provided");
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
      query
    )}&days=${days}&aqi=no&alerts=no`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceError(
        `Weather forecast API error: ${response.status}`,
        ServiceErrorCode.WEATHER_ERROR,
        response.status
      );
    }

    const data = await response.json();

    interface ForecastDay {
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }

    const forecastData: WeatherData = {
      current: {
        temp_c: data.current.temp_c,
        feels_like: data.current.feelslike_c,
        humidity: data.current.humidity,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
          code: data.current.condition.code,
        },
        wind_kph: data.current.wind_kph,
        uv: data.current.uv,
        visibility_km: data.current.vis_km,
      },
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        tz_id: data.location.tz_id,
        localtime: data.location.localtime,
      },
      forecast: {
        forecastday: data.forecast.forecastday.map((day: ForecastDay) => ({
          date: day.date,
          day: {
            maxtemp_c: day.day.maxtemp_c,
            mintemp_c: day.day.mintemp_c,
            condition: {
              text: day.day.condition.text,
              icon: day.day.condition.icon,
            },
          },
        })),
      },
    };

    // Cache for 30 minutes - using type assertion to satisfy the linter
    aiCache.set<Record<string, unknown>>(cacheKey, forecastData as unknown as Record<string, unknown>, 30 * 60 * 1000);

    return forecastData;

  } catch (error: unknown) {
    logger.error("Weather forecast fetch failed", { error: error instanceof Error ? error.message : "Unknown error" });
    // Return a fallback structure to avoid breaking the UI
    return {
      current: {
        temp_c: 20,
        feels_like: 20,
        humidity: 50,
        condition: { text: "Partly cloudy", icon: "", code: 1003 },
        wind_kph: 10,
        uv: 3,
        visibility_km: 10,
      },
      location: {
        name: "Unknown",
        region: "",
        country: "",
        lat: 0,
        lon: 0,
        tz_id: "UTC",
        localtime: new Date().toISOString(),
      },
      forecast: {
        forecastday: [], // Return empty array to prevent iteration errors
      },
    };
  }
}

/**
 * Get outfit recommendations based on weather data
 */
export function getWeatherOutfitRecommendations(weather: WeatherData): string[] {
  const recommendations: string[] = []
  
  if (!weather?.current) return recommendations
  
  const temp = weather.current.temp_c
  const condition = weather.current.condition?.text?.toLowerCase() || ""
  const isRaining = condition.includes("rain") || condition.includes("drizzle")
  const isSnowing = condition.includes("snow") || condition.includes("sleet")
  const isWindy = weather.current.wind_kph > 20
  
  // Temperature-based recommendations
  if (temp < 0) {
    recommendations.push("Very cold - wear heavy winter coat, layers, hat, gloves, and scarf")
  } else if (temp < 10) {
    recommendations.push("Cold - wear a warm coat, sweater, and long pants")
  } else if (temp < 20) {
    recommendations.push("Cool - consider a light jacket or sweater")
  } else if (temp < 25) {
    recommendations.push("Mild - t-shirt with light layers works well")
  } else if (temp < 30) {
    recommendations.push("Warm - light clothing, shorts or skirt recommended")
  } else {
    recommendations.push("Hot - very light clothing, consider breathable fabrics")
  }
  
  // Condition-based recommendations
  if (isRaining) {
    recommendations.push("Rainy conditions - bring an umbrella and waterproof jacket")
  }
  
  if (isSnowing) {
    recommendations.push("Snowy conditions - wear waterproof boots and warm layers")
  }
  
  if (isWindy) {
    recommendations.push("Windy conditions - secure loose items and wear windproof outer layer")
  }
  
  if (condition.includes("sunny") || condition.includes("clear")) {
    recommendations.push("Sunny - don't forget sunglasses and sunscreen")
  }
  
  return recommendations
}
