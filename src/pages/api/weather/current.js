/**
 * @endpoint GET /api/weather/current
 * @description Fetch current weather data based on location or coordinates
 * 
 * This API endpoint provides a RESTful interface to the weather service.
 * While most frontend components now use the useWeather hook directly,
 * this endpoint remains available for:
 * - External services that need weather data
 * - Server-side rendering contexts
 * - Development and testing tools
 * - Mobile applications or other clients
 * 
 * @param {string} [location] - City name or location string (e.g., "London", "New York")
 * @param {number} [lat] - Latitude coordinate
 * @param {number} [lon] - Longitude coordinate
 * @returns {Object} Weather data with current conditions
 * 
 * @example
 * // Fetch by city name
 * fetch('/api/weather/current?location=London')
 * 
 * // Fetch by coordinates
 * fetch('/api/weather/current?lat=51.5074&lon=0.1278')
 */

import { getWeatherData } from "@/lib/services/weatherService";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { lat, lon, location } = req.query

    if (!lat && !lon && !location) {
      return res.status(400).json({
        success: false,
        error: "Either coordinates (lat, lon) or location must be provided",
        code: "MISSING_LOCATION",
      })
    }

    // Fetch via central WeatherAPI-powered service
    const weatherData = await getWeatherData(
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined,
      location
    )

    // Cache for 10 minutes
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate")

    res.status(200).json({ success: true, data: weatherData })
  } catch (error) {
    console.error("Weather API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch weather data",
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}