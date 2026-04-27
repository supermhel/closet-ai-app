import logger from "@/utils/logger"
import { db } from "../firebase"
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore"

interface AnalyticsData {
  outfitRatings: OutfitRating[]
  wearFrequency: WearFrequencyData[]
  colorPreferences: ColorPreferenceData[]
  seasonalTrends: SeasonalTrendData[]
  styleInsights: StyleInsightData[]
  usageStatistics: UsageStatistics
  monthlyActivity: MonthlyActivityData[]
}

interface OutfitRating {
  id: string
  outfitId: string
  rating: number
  feedback: string
  timestamp: Date
  weather?: any
  occasion?: string
}

interface WearFrequencyData {
  itemId: string
  itemName: string
  category: string
  wearCount: number
  lastWorn: Date | null
  frequency: number
  averageRating: number
}

interface ColorPreferenceData {
  color: string
  count: number
  averageRating: number
  preference: number
  seasonalUsage: Record<string, number>
}

interface SeasonalTrendData {
  season: string
  averageRating: number
  outfitCount: number
  topCategories: string[]
  topColors: string[]
  weatherPatterns: any[]
}

interface StyleInsightData {
  type: string
  title: string
  description: string
  value: any
  confidence: number
  actionable: boolean
}

interface UsageStatistics {
  totalItems: number
  totalOutfits: number
  averageRating: number
  mostWornCategory: string
  favoriteColor: string
  outfitsThisMonth: number
  itemsAddedThisMonth: number
  engagementScore: number
}

interface MonthlyActivityData {
  month: string
  outfitsCreated: number
  itemsAdded: number
  averageRating: number
  topCategory: string
}

/**
 * Fetch real user analytics data from Firebase
 */
export async function getUserAnalytics(userId: string): Promise<AnalyticsData> {
  try {
    logger.info("Fetching real user analytics", { userId })

    // Fetch outfit ratings
    const ratingsRef = collection(db, "users", userId, "outfitRatings")
    const ratingsQuery = query(ratingsRef, orderBy("timestamp", "desc"), limit(200))
    const ratingsSnapshot = await getDocs(ratingsQuery)
    const outfitRatings: OutfitRating[] = ratingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as OutfitRating[]

    // Fetch closet items for analysis
    const itemsRef = collection(db, "users", userId, "closetItems")
    const itemsSnapshot = await getDocs(itemsRef)
    const closetItems = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }))

    // Fetch outfits
    const outfitsRef = collection(db, "users", userId, "savedOutfits")
    const outfitsSnapshot = await getDocs(outfitsRef)
    const outfits = outfitsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }))

    // Fetch wear tracking data
    const wearTrackingRef = collection(db, "users", userId, "wearTracking")
    const wearTrackingSnapshot = await getDocs(wearTrackingRef)
    const wearTrackingData = wearTrackingSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      wornAt: doc.data().wornAt?.toDate() || new Date(),
    }))

    // Analyze wear frequency
    const wearFrequency = analyzeWearFrequency(closetItems, wearTrackingData, outfitRatings)

    // Analyze color preferences
    const colorPreferences = analyzeColorPreferences(closetItems, outfitRatings, wearTrackingData)

    // Analyze seasonal trends
    const seasonalTrends = analyzeSeasonalTrends(outfitRatings, wearTrackingData)

    // Generate real style insights
    const styleInsights = generateStyleInsights(closetItems, outfitRatings, wearTrackingData, outfits)

    // Calculate usage statistics
    const usageStatistics = calculateUsageStatistics(closetItems, outfits, outfitRatings, wearTrackingData)

    // Generate monthly activity data
    const monthlyActivity = generateMonthlyActivity(closetItems, outfits, outfitRatings)

    const analyticsData: AnalyticsData = {
      outfitRatings,
      wearFrequency,
      colorPreferences,
      seasonalTrends,
      styleInsights,
      usageStatistics,
      monthlyActivity,
    }

    logger.info("Analytics data generated successfully", {
      userId,
      ratingsCount: outfitRatings.length,
      itemsCount: closetItems.length,
      outfitsCount: outfits.length,
    })

    return analyticsData
  } catch (error) {
    logger.error("Failed to fetch real user analytics", { userId, error: error.message })
    throw error
  }
}

function analyzeWearFrequency(items: any[], wearTracking: any[], ratings: OutfitRating[]): WearFrequencyData[] {
  return items
    .map((item) => {
      // Count actual wear instances
      const wearInstances = wearTracking.filter((wear) => wear.itemId === item.id)
      const wearCount = wearInstances.length

      // Find last worn date
      const lastWorn =
        wearInstances.length > 0 ? new Date(Math.max(...wearInstances.map((w) => w.wornAt.getTime()))) : null

      // Calculate frequency (wears per week since creation)
      const daysSinceCreated = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const weeksSinceCreated = Math.max(1, daysSinceCreated / 7)
      const frequency = wearCount / weeksSinceCreated

      // Calculate average rating for outfits containing this item
      const itemRatings = ratings.filter(
        (rating) => rating.outfitId && wearInstances.some((wear) => wear.outfitId === rating.outfitId),
      )
      const averageRating =
        itemRatings.length > 0 ? itemRatings.reduce((sum, r) => sum + r.rating, 0) / itemRatings.length : 0

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        wearCount,
        lastWorn,
        frequency,
        averageRating,
      }
    })
    .sort((a, b) => b.wearCount - a.wearCount)
}

function analyzeColorPreferences(
  items: any[],
  ratings: OutfitRating[],
  wearTracking: any[],
): ColorPreferenceData[] {
  const colorData: Record<
    string,
    {
      count: number
      ratings: number[]
      seasonalUsage: Record<string, number>
    }
  > = {}

  // Count color occurrences and collect ratings
  items.forEach((item) => {
    if (item.colors && Array.isArray(item.colors)) {
      item.colors.forEach((color: string) => {
        if (!colorData[color]) {
          colorData[color] = {
            count: 0,
            ratings: [],
            seasonalUsage: { spring: 0, summer: 0, fall: 0, winter: 0 },
          }
        }
        colorData[color].count++

        // Track seasonal usage
        const itemWears = wearTracking.filter((wear) => wear.itemId === item.id)
        itemWears.forEach((wear) => {
          const season = getSeason(wear.wornAt.getMonth())
          colorData[color].seasonalUsage[season]++
        })
      })
    }
  })

  // Collect ratings for each color
  ratings.forEach((rating) => {
    if (rating.outfitId) {
      // Find items in this outfit and their colors
      const outfitWears = wearTracking.filter((wear) => wear.outfitId === rating.outfitId)
      outfitWears.forEach((wear) => {
        const item = items.find((i) => i.id === wear.itemId)
        if (item && item.colors) {
          item.colors.forEach((color: string) => {
            if (colorData[color]) {
              colorData[color].ratings.push(rating.rating)
            }
          })
        }
      })
    }
  })

  return Object.entries(colorData)
    .map(([color, data]) => ({
      color,
      count: data.count,
      averageRating: data.ratings.length > 0 ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length : 0,
      preference: calculateColorPreference(data.count, data.ratings),
      seasonalUsage: data.seasonalUsage,
    }))
    .sort((a, b) => b.preference - a.preference)
}

function analyzeSeasonalTrends(ratings: OutfitRating[], wearTracking: any[]): SeasonalTrendData[] {
  const seasons = { spring: [], summer: [], fall: [], winter: [] }

  ratings.forEach((rating) => {
    const month = rating.timestamp.getMonth()
    const season = getSeason(month)
    seasons[season].push(rating)
  })

  return Object.entries(seasons).map(([season, seasonRatings]) => {
    const seasonWears = wearTracking.filter((wear) => {
      const wearSeason = getSeason(wear.wornAt.getMonth())
      return wearSeason === season
    })

    // Analyze categories and colors for this season
    const categoryCount: Record<string, number> = {}
    const colorCount: Record<string, number> = {}

    seasonWears.forEach((wear) => {
      if (wear.itemCategory) {
        categoryCount[wear.itemCategory] = (categoryCount[wear.itemCategory] || 0) + 1
      }
      if (wear.itemColors && Array.isArray(wear.itemColors)) {
        wear.itemColors.forEach((color: string) => {
          colorCount[color] = (colorCount[color] || 0) + 1
        })
      }
    })

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    const topColors = Object.entries(colorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color)

    return {
      season,
      averageRating:
        seasonRatings.length > 0 ? seasonRatings.reduce((sum, r) => sum + r.rating, 0) / seasonRatings.length : 0,
      outfitCount: seasonRatings.length,
      topCategories,
      topColors,
      weatherPatterns: seasonRatings.map((r) => r.weather).filter(Boolean),
    }
  })
}

function generateStyleInsights(
  items: any[],
  ratings: OutfitRating[],
  wearTracking: any[],
  outfits: any[],
): StyleInsightData[] {
  const insights: StyleInsightData[] = []

  // Most worn category insight
  const categoryCounts = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + wearTracking.filter((wear) => wear.itemId === item.id).length
      return acc
    },
    {} as Record<string, number>,
  )

  const mostWornCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]

  if (mostWornCategory) {
    insights.push({
      type: "most_worn_category",
      title: "Most Worn Category",
      description: `You wear ${mostWornCategory[0]} items most frequently (${mostWornCategory[1]} times)`,
      value: mostWornCategory[0],
      confidence: 0.9,
      actionable: true,
    })
  }

  // Outfit satisfaction insight
  if (ratings.length > 0) {
    const highRatedOutfits = ratings.filter((r) => r.rating >= 4).length
    const satisfactionRate = (highRatedOutfits / ratings.length) * 100

    insights.push({
      type: "satisfaction_rate",
      title: "Outfit Satisfaction",
      description: `${Math.round(satisfactionRate)}% of your outfits are highly rated (4+ stars)`,
      value: Math.round(satisfactionRate),
      confidence: ratings.length >= 10 ? 0.8 : 0.6,
      actionable: satisfactionRate < 70,
    })
  }

  // Wardrobe utilization insight
  const wornItems = new Set(wearTracking.map((wear) => wear.itemId))
  const utilizationRate = (wornItems.size / items.length) * 100

  insights.push({
    type: "wardrobe_utilization",
    title: "Wardrobe Utilization",
    description: `You actively wear ${Math.round(utilizationRate)}% of your wardrobe`,
    value: Math.round(utilizationRate),
    confidence: 0.9,
    actionable: utilizationRate < 60,
  })

  // Seasonal preference insight
  const seasonalWears = wearTracking.reduce(
    (acc, wear) => {
      const season = getSeason(wear.wornAt.getMonth())
      acc[season] = (acc[season] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const favoriteSeason = Object.entries(seasonalWears).sort(([, a], [, b]) => b - a)[0]

  if (favoriteSeason) {
    insights.push({
      type: "seasonal_preference",
      title: "Seasonal Style Preference",
      description: `You're most active with your wardrobe during ${favoriteSeason[0]}`,
      value: favoriteSeason[0],
      confidence: 0.7,
      actionable: false,
    })
  }

  return insights
}

function calculateUsageStatistics(
  items: any[],
  outfits: any[],
  ratings: OutfitRating[],
  wearTracking: any[],
): UsageStatistics {
  const totalItems = items.length
  const totalOutfits = outfits.length

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

  // Most worn category
  const categoryCounts = items.reduce(
    (acc, item) => {
      const wearCount = wearTracking.filter((wear) => wear.itemId === item.id).length
      acc[item.category] = (acc[item.category] || 0) + wearCount
      return acc
    },
    {} as Record<string, number>,
  )

  const mostWornCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown"

  // Favorite color
  const colorCounts = items.reduce(
    (acc, item) => {
      if (item.colors && Array.isArray(item.colors)) {
        item.colors.forEach((color: string) => {
          const wearCount = wearTracking.filter((wear) => wear.itemId === item.id).length
          acc[color] = (acc[color] || 0) + wearCount
        })
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const favoriteColor = Object.entries(colorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown"

  // This month's activity
  const thisMonth = new Date()
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)

  const outfitsThisMonth = outfits.filter((outfit) => outfit.createdAt >= monthStart).length

  const itemsAddedThisMonth = items.filter((item) => item.createdAt >= monthStart).length

  // Engagement score (0-100)
  const engagementScore = Math.min(
    100,
    Math.round(wearTracking.length * 2 + ratings.length * 3 + outfits.length * 5 + totalItems * 1),
  )

  return {
    totalItems,
    totalOutfits,
    averageRating: Math.round(averageRating * 10) / 10,
    mostWornCategory,
    favoriteColor,
    outfitsThisMonth,
    itemsAddedThisMonth,
    engagementScore,
  }
}

function generateMonthlyActivity(items: any[], outfits: any[], ratings: OutfitRating[]): MonthlyActivityData[] {
  const monthlyData: Record<
    string,
    {
      outfitsCreated: number
      itemsAdded: number
      ratings: number[]
      categories: Record<string, number>
    }
  > = {}

  // Process outfits
  outfits.forEach((outfit) => {
    const monthKey = outfit.createdAt.toISOString().slice(0, 7) // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        outfitsCreated: 0,
        itemsAdded: 0,
        ratings: [],
        categories: {},
      }
    }
    monthlyData[monthKey].outfitsCreated++
  })

  // Process items
  items.forEach((item) => {
    const monthKey = item.createdAt.toISOString().slice(0, 7)
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        outfitsCreated: 0,
        itemsAdded: 0,
        ratings: [],
        categories: {},
      }
    }
    monthlyData[monthKey].itemsAdded++
    monthlyData[monthKey].categories[item.category] = (monthlyData[monthKey].categories[item.category] || 0) + 1
  })

  // Process ratings
  ratings.forEach((rating) => {
    const monthKey = rating.timestamp.toISOString().slice(0, 7)
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].ratings.push(rating.rating)
    }
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      outfitsCreated: data.outfitsCreated,
      itemsAdded: data.itemsAdded,
      averageRating: data.ratings.length > 0 ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length : 0,
      topCategory: Object.entries(data.categories).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown",
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12) // Last 12 months
}

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return "spring"
  if (month >= 5 && month <= 7) return "summer"
  if (month >= 8 && month <= 10) return "fall"
  return "winter"
}

function calculateColorPreference(count: number, ratings: number[]): number {
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 3
  return count * avgRating
}
