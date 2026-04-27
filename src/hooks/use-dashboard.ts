import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { getWeatherData, getWeatherOutfitRecommendations } from "@/lib/services/weatherService"
import { getUserAnalytics } from "@/lib/services/analyticsService"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { WeatherData } from "@/utils/types"

interface AnalyticsData {
  outfitRatings: {
    rating: number
    feedback: string
    timestamp: Date
  }[]
  wearFrequency: {
    wearCount: number
    frequency: number
    averageRating: number
  }[]
  colorPreferences: {
    color: string
    count: number
    averageRating: number
  }[]
  usageStatistics: {
    totalItems: number
    totalOutfits: number
    averageRating: number
    outfitsThisMonth: number
    itemsAddedThisMonth: number
  }
  monthlyActivity: {
    month: string
    outfitsCreated: number
    itemsAdded: number
  }[]
}

interface OutfitData {
  id: string
  name: string
  items: string[]
  createdAt: Date
  [key: string]: unknown
}

export function useDashboardData() {
  const { user } = useAuth()
  const uid = user?.uid
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
  
  const [recentOutfits, setRecentOutfits] = useState<OutfitData[]>([])
  const [isOutfitsLoading, setIsOutfitsLoading] = useState(false)
  
  const [outfitRecommendations, setOutfitRecommendations] = useState<string[]>([])
  const [isOutfitLoading, setIsOutfitLoading] = useState(false)

  // Fetch weather data
  useEffect(() => {
    if (!uid) return
    
    const fetchWeatherData = async () => {
      setIsWeatherLoading(true)
      try {
        const data = await getWeatherData()
        setWeatherData(data)
      } catch (error) {
        console.error("Error fetching weather data:", error)
      } finally {
        setIsWeatherLoading(false)
      }
    }
    
    fetchWeatherData()
  }, [uid])

  // Fetch analytics data
  useEffect(() => {
    if (!uid) return
    
    const fetchAnalyticsData = async () => {
      setIsAnalyticsLoading(true)
      try {
        const data = await getUserAnalytics(uid)
        setAnalyticsData(data)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setIsAnalyticsLoading(false)
      }
    }
    
    fetchAnalyticsData()
  }, [uid])

  // Fetch recent outfits
  useEffect(() => {
    if (!uid) return
    
    const fetchRecentOutfits = async () => {
      setIsOutfitsLoading(true)
      try {
        const q = query(
          collection(db, "users", uid, "outfits"),
          orderBy("createdAt", "desc"),
          limit(5)
        )
        const querySnapshot = await getDocs(q)
        setRecentOutfits(querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as OutfitData)))
      } catch (error) {
        console.error("Error fetching recent outfits:", error)
      } finally {
        setIsOutfitsLoading(false)
      }
    }
    
    fetchRecentOutfits()
  }, [uid])

  // Fetch outfit recommendations
  useEffect(() => {
    if (!uid || !weatherData) return
    
    const fetchOutfitRecommendations = async () => {
      setIsOutfitLoading(true)
      try {
        const recommendations = getWeatherOutfitRecommendations(weatherData)
        setOutfitRecommendations(recommendations)
      } catch (error) {
        console.error("Error fetching outfit recommendations:", error)
      } finally {
        setIsOutfitLoading(false)
      }
    }
    
    fetchOutfitRecommendations()
  }, [uid, weatherData])

  const isLoading = 
    isWeatherLoading || 
    isAnalyticsLoading || 
    isOutfitsLoading || 
    isOutfitLoading

  return {
    weather: weatherData,
    analytics: analyticsData,
    recentOutfits,
    outfitRecommendations,
    isLoading,
  }
}
