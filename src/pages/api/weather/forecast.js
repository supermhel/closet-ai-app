/**
 * @endpoint GET /api/weather/forecast
 * @description Fetch weather forecast data for multiple days based on location or coordinates
 * 
 * This API endpoint provides a RESTful interface to the weather forecast service.
 * While most frontend components now use the useWeather hook directly,
 * this endpoint remains available for:
 * - External services that need forecast data
 * - Server-side rendering contexts
 * - Development and testing tools
 * - Mobile applications or other clients
 * 
 * @param {string} [location] - City name or location string (e.g., "London", "New York")
 * @param {number} [lat] - Latitude coordinate
 * @param {number} [lon] - Longitude coordinate
 * @param {number} [days=5] - Number of days to forecast (1-14)
 * @returns {Object} Weather data with forecast for specified days
 * 
 * @example
 * // Fetch 3-day forecast by city name
 * fetch('/api/weather/forecast?location=London&days=3')
 * 
 * // Fetch 7-day forecast by coordinates
 * fetch('/api/weather/forecast?lat=51.5074&lon=0.1278&days=7')
 */

import { getWeatherForecast } from "@/lib/services/weatherService";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { lat, lon, location, days = 5 } = req.query

    if (!lat && !lon && !location) {
      return res.status(400).json({
        success: false,
        error: "Either coordinates (lat, lon) or location must be provided",
        code: "MISSING_LOCATION",
      })
    }

    const forecastData = await getWeatherForecast(
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined,
      location,
      Number(days)
    )

    // Cache 30 min
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate")

    res.status(200).json({ success: true, data: forecastData })
  } catch (error) {
    console.error("Weather forecast API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch weather forecast",
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}