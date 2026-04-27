"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useCloset, type ClosetItem } from "@/contexts/closet-context"
import { useOutfit } from "@/contexts/outfit-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OutfitRating } from "@/components/outfit-rating"
import {
  Calendar,
  Shuffle,
  Plus,
  Heart,
  Share2,
  Sparkles,
  RefreshCw,
  Eye,
  Star,
  ShoppingBag,
  Save,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentWeather, getWeatherOutfitRecommendations } from "@/lib/services/weatherService"
import { generateEnhancedOutfits } from "@/lib/services/outfitGenerationService"

import logger from "@/utils/logger"

// Import types
import { 
  WeatherData, 
  GeneratedOutfit, 
  SavedOutfit, 
  FavoriteOutfit,
  OutfitCompatibilityResult,
  OutfitGenerationOptions
} from "@/types/outfit"

// Import new components
import WeatherSection from "@/components/outfit/WeatherSection"


// Import the new components
import OutfitCompatibilityChecker from "@/components/outfit/OutfitCompatibilityChecker"
import OutfitCard from "@/components/outfit/OutfitCard"
import OutfitShareModal from "@/components/outfit/OutfitShareModal"
import OutfitActions from "@/components/outfit/OutfitActions"
import CalendarViews from "@/components/outfit/calendar/CalendarViews"
import ManualOutfitBuilder from "@/components/outfit/ManualOutfitBuilder"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
}





// Favorites Section Component
function FavoritesSection({
  favoriteOutfits,
  setFavoriteOutfits,
  setGeneratedOutfits,
  showFavorites,
  setShowFavorites,
}: {
  favoriteOutfits: FavoriteOutfit[];
  setFavoriteOutfits: React.Dispatch<React.SetStateAction<FavoriteOutfit[]>>;
  setGeneratedOutfits: React.Dispatch<React.SetStateAction<GeneratedOutfit[]>>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user } = useAuth()

  const handleDelete = async (id: string) => {
    if (!user) return; // Add null check for user
    try {
      await deleteDoc(doc(db, "users", user.uid, "favoriteOutfits", id))
      setFavoriteOutfits((prev) => prev.filter((fav) => fav.id !== id))
    } catch (error) {
      console.error("Error deleting favorite:", error instanceof Error ? error.message : String(error))
    }
  }

  const handleLoad = (items: ClosetItem[]) => {
    // Create a simple GeneratedOutfit from the items
    const simpleOutfit: GeneratedOutfit = {
      id: `loaded-${Date.now()}`,
      name: "Loaded Outfit",
      items,
      score: 0.8,
      reasoning: ["Loaded from favorites"],
      tags: ["favorite"],
      weatherSuitability: 0.8,
      colorHarmony: 0.8,
      styleConsistency: 0.8,
    }
    setGeneratedOutfits([simpleOutfit])
  }

  if (favoriteOutfits.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            Favorite Outfits
            <Badge variant="outline" className="ml-2">
              {favoriteOutfits.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowFavorites(!showFavorites)}>
            {showFavorites ? "Show Less" : "Show All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showFavorites ? favoriteOutfits : favoriteOutfits.slice(0, 3)).map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{favorite.name}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleLoad(favorite.items)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDelete(favorite.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {favorite.items.slice(0, 3).map((item: ClosetItem, idx: number) => (
                    <div key={idx} className="aspect-square bg-muted rounded overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {favorite.items.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2">+{favorite.items.length - 3} more items</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Outfit Page Component
export default function OutfitPage() {
  const { user } = useAuth()
  const { closetItems } = useCloset()
  const { saveOutfit, rateOutfit } = useOutfit()
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>([])
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([])
  const [scheduledOutfits, setScheduledOutfits] = useState<SavedOutfit[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isManualBuilderOpen, setIsManualBuilderOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("week")
  const [showFavorites, setShowFavorites] = useState(false)
  const [climateOverride, setClimateOverride] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedOutfitForShare, setSelectedOutfitForShare] = useState<ClosetItem[] | null>(null)
  const [compatibilityResult, setCompatibilityResult] = useState<OutfitCompatibilityResult | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherSuggestion, setWeatherSuggestion] = useState("")

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    try {
      logger.info("Fetching weather data for outfit recommendations")

      // Try to get user's location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const weatherData = await getCurrentWeather(latitude, longitude)
            setWeather(weatherData)

            // Generate weather-based recommendations
            const recommendations = getWeatherOutfitRecommendations(weatherData)
            setWeatherSuggestion(recommendations[0] || "Dress comfortably for today's weather")
          },
          async () => {
            // Fallback to default location if geolocation fails
            const weatherData = await getCurrentWeather(undefined, undefined, "New York")
            setWeather(weatherData)
            const recommendations = getWeatherOutfitRecommendations(weatherData)
            setWeatherSuggestion(recommendations[0] || "Dress comfortably for today's weather")
          },
        )
      } else {
        // Fallback if geolocation is not supported
        const weatherData = await getCurrentWeather(undefined, undefined, "New York")
        setWeather(weatherData)
        const recommendations = getWeatherOutfitRecommendations(weatherData)
        setWeatherSuggestion(recommendations[0] || "Dress comfortably for today's weather")
      }
    } catch (error) {
      logger.error("Failed to fetch weather data", { error: error instanceof Error ? error.message : String(error) })
      // Set fallback weather data
      setWeather({
        current: { temp_c: 20, condition: { text: "Partly Cloudy" }, humidity: 65 },
        location: { name: "Unknown Location" },
        wind: { speed: 10 },
      })
    }
  }, [])

  // Fetch closet items and outfits
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        // Fetch weather data
        await fetchWeather()

        // Fetch saved outfits
        const outfitsRef = collection(db, "users", user.uid, "savedOutfits")
        const outfitsQuery = query(outfitsRef, orderBy("createdAt", "desc"))
        const outfitsSnapshot = await getDocs(outfitsQuery)
        const outfits = outfitsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SavedOutfit[]
        setScheduledOutfits(outfits)

        // Fetch favorite outfits
        const favoritesRef = collection(db, "users", user.uid, "favoriteOutfits")
        const favoritesQuery = query(favoritesRef, orderBy("createdAt", "desc"))
        const favoritesSnapshot = await getDocs(favoritesQuery)
        const favorites = favoritesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FavoriteOutfit[]
        setFavoriteOutfits(favorites)
      } catch (error) {
        logger.error("Error fetching data", { error: error instanceof Error ? error.message : String(error) })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, fetchWeather])

  // Generate AI-powered outfit using intelligent service
  const generateOutfit = useCallback(async () => {
    if (closetItems.length < 3) {
      alert("You need at least 3 items in your closet to generate an outfit")
      return
    }

    setIsGenerating(true)

    try {
      logger.info("Starting intelligent outfit generation", {
        itemCount: closetItems.length,
        hasWeather: !!weather,
        selectedDate: selectedDate.toISOString()
      })

      // Prepare generation options
      const options: OutfitGenerationOptions = {
        weather: weather,
        occasion: "casual",
        season: getSeason(selectedDate)
      }

      // Use intelligent outfit generation service
      const enhancedOutfits = await generateEnhancedOutfits(closetItems, options)
      
      if (enhancedOutfits.length > 0) {
        // Set all generated outfits
        setGeneratedOutfits(enhancedOutfits)
        
        // Set compatibility result from best generation
        const bestOutfit = enhancedOutfits[0]
        setCompatibilityResult({
          compatible: bestOutfit.score > 0.6,
          score: Math.round(bestOutfit.score * 100),
          analysis: bestOutfit.reasoning.map(reason => ({ 
            type: 'positive' as const, 
            text: reason 
          })),
          suggestions: bestOutfit.score < 0.7 ? 
            ['Try different color combinations', 'Consider the weather when selecting items'] : 
            ['Great outfit choice!']
        })
        
        logger.info("Intelligent outfit generation successful", {
          score: bestOutfit.score,
          itemCount: bestOutfit.items.length,
          reasoning: bestOutfit.reasoning
        })
      } else {
        throw new Error("No suitable outfits could be generated")
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("Intelligent outfit generation failed", { 
        error: errorMessage
      })
      alert("Failed to generate outfit. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [closetItems, weather, selectedDate])

  // Helper function to determine season
  const getSeason = (date: Date): string => {
    const month = date.getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  // Save outfit to calendar
  const saveOutfitToCalendar = async (outfit: ClosetItem[], date: Date, name?: string) => {
    if (!user || !outfit.length) return

    try {
      const outfitData = {
        name: name || `Outfit for ${date.toLocaleDateString()}`,
        items: outfit.map((item) => item.id),
        itemsData: outfit,
        date: date,
        occasion: "casual",
        weather: weather?.current?.temp_c?.toString(), // Convert number to string
      }

      const savedOutfit = await saveOutfit(outfitData)

      if (savedOutfit) {
        setScheduledOutfits((prev) => [...prev, savedOutfit as SavedOutfit])
        alert("Outfit saved to calendar!")
      }
    } catch (error) {
      logger.error("Error saving outfit", { error: error instanceof Error ? error.message : String(error) })
      alert("Failed to save outfit")
    }
  }

  // Handle manual outfit save
  const handleManualOutfitSave = (items: ClosetItem[], date: Date, name: string) => {
    saveOutfitToCalendar(items, date, name)
  }

  // Toggle favorite outfit
  const toggleFavoriteOutfit = async (outfitItems: ClosetItem[]) => {
    if (!user) return

    try {
      const favoritesRef = collection(db, "users", user.uid, "favoriteOutfits")
      await addDoc(favoritesRef, {
        items: outfitItems.map(item => ({ id: item.id, name: item.name, imageUrl: item.imageUrl, category: item.category })),
        name: `Favorite Outfit ${favoriteOutfits.length + 1}`,
        createdAt: new Date(),
      })
      alert("Outfit added to favorites!")
    } catch (error) {
      logger.error("Error adding to favorites", { error: error instanceof Error ? error.message : String(error) })
      alert("Failed to add to favorites")
    }
  }

  // Handle outfit rating
  const handleOutfitRating = async (rating: number, feedback: string) => {
    if (!user || !generatedOutfits.length) return

    try {
      const outfitId = `generated-${Date.now()}`
      await rateOutfit(outfitId, rating)

      const ratingsRef = collection(db, "users", user.uid, "outfitRatings")
      await addDoc(ratingsRef, {
        outfitItems: generatedOutfits.map((item) => item.id),
        rating,
        feedback,
        timestamp: new Date(),
        weather: weather?.current?.temp_c,
        occasion: "casual",
      })

      logger.info("Outfit rating saved", { rating, feedback: feedback.length })
    } catch (error) {
      logger.error("Error saving rating", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // Handle share outfit
  const handleShareOutfit = (outfit: ClosetItem[]) => {
    setSelectedOutfitForShare(outfit)
    setShareModalOpen(true)
  }

  // Handle compatibility result
  const handleCompatibilityResult = (result: OutfitCompatibilityResult) => {
    setCompatibilityResult(result)
    logger.info("Compatibility check completed", {
      compatible: result.compatible,
      score: result.score,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Outfit Planner</h2>
          <p className="text-muted-foreground">Preparing your wardrobe...</p>
        </div>
      </div>
    )
  }

  const isCurrentOutfitFavorite = () => {
    if (generatedOutfits.length === 0) return false
    const firstOutfit = generatedOutfits[0]
    return favoriteOutfits.some(
      (fav) =>
        fav.items.length === firstOutfit.items.length &&
        fav.items.every((item, index) => item.id === firstOutfit.items[index]?.id),
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={itemVariants}>
            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Outfit Planner</h1>
                <p className="text-muted-foreground text-lg">
                  Plan your perfect outfit for {selectedDate.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button onClick={generateOutfit} disabled={isGenerating || closetItems.length < 3} className="gap-2">
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                  Generate Outfit
                </Button>
                <Button variant="outline" onClick={() => setIsManualBuilderOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Build Manually
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Weather Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <WeatherSection
            weather={weather}
            weatherSuggestion={weatherSuggestion}
            climateOverride={climateOverride}
            setClimateOverride={setClimateOverride}
            onRefresh={fetchWeather}
          />
        </motion.div>

        {/* Calendar Views */}
        <motion.div variants={itemVariants} className="mb-6">
          <CalendarViews
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            scheduledOutfits={scheduledOutfits}
            weather={weather}
          />
        </motion.div>

        {/* Generated Outfit Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Today's Outfit
                  {compatibilityResult && (
                    <Badge variant={compatibilityResult.compatible ? "default" : "secondary"} className="ml-2">
                      {Math.round(compatibilityResult.score * 100)}% Match
                    </Badge>
                  )}
                </CardTitle>
                {generatedOutfits.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatedOutfits.length > 0 && toggleFavoriteOutfit(generatedOutfits[0].items)}
                      className="gap-2"
                    >
                      <Heart className={`h-4 w-4 ${isCurrentOutfitFavorite() ? "fill-current text-red-500" : ""}`} />
                      {isCurrentOutfitFavorite() ? "Favorited" : "Favorite"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatedOutfits.length > 0 && saveOutfitToCalendar(generatedOutfits[0].items, selectedDate)}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Save to Calendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatedOutfits.length > 0 && handleShareOutfit(generatedOutfits[0].items)}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Generating your perfect outfit...</p>
                  <p className="text-muted-foreground">Using AI to match your style and weather</p>
                </div>
              ) : generatedOutfits.length > 0 ? (
                <div className="space-y-6">
                  {/* Display generated outfits */}
                  <div className="space-y-4">
                    {generatedOutfits.map((outfit) => (
                      <div key={outfit.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{outfit.name}</h3>
                          <div className="flex gap-2">
                            <Badge variant={outfit.score > 0.8 ? "default" : outfit.score > 0.6 ? "secondary" : "outline"}>
                              {Math.round(outfit.score * 100)}% Match
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          {outfit.items.map((item, itemIndex) => (
                      <OutfitCard
                        key={item.id}
                        item={item}
                              index={itemIndex}
                        onViewDetails={(item) => console.log("View details:", item)}
                                                      onRemove={() => {
                                // Remove item from this specific outfit
                                setGeneratedOutfits(prev => prev.map(o => 
                                  o.id === outfit.id 
                                    ? { ...o, items: o.items.filter((_, i) => i !== itemIndex) }
                                    : o
                                ))
                        }}
                      />
                    ))}
                  </div>

                        {outfit.reasoning && outfit.reasoning.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <p><strong>Why this works:</strong> {outfit.reasoning.join(", ")}</p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => toggleFavoriteOutfit(outfit.items)}>
                            <Heart className="h-3 w-3 mr-1" />
                            Favorite
                          </Button>
                          <Button size="sm" onClick={() => saveOutfitToCalendar(outfit.items, selectedDate, outfit.name)}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleShareOutfit(outfit.items)}>
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outfit Compatibility Checker for first outfit */}
                  {generatedOutfits.length > 0 && (
                  <OutfitCompatibilityChecker
                      selectedItems={generatedOutfits[0].items}
                    onCompatibilityResult={handleCompatibilityResult}
                  />
                  )}

                  {/* Outfit Actions */}
                  <OutfitActions
                    onGenerateOutfit={generateOutfit}
                    onSaveOutfit={() => generatedOutfits.length > 0 && saveOutfitToCalendar(generatedOutfits[0].items, selectedDate)}
                    isGeneratingOutfit={isGenerating}
                  />

                  {/* Outfit Rating */}
                  <OutfitRating
                    outfitId={`generated-${Date.now()}`}
                    outfitName="Generated Outfit"
                    onRatingSubmit={handleOutfitRating}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No outfit generated yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Click &quot;Generate Outfit&quot; to create a personalized outfit recommendation
                  </p>
                  {closetItems.length < 3 && (
                    <Alert className="max-w-md mx-auto">
                      <AlertDescription>
                        You need at least 3 items in your closet to generate outfits.{" "}
                        <Link href="/closet" className="underline">
                          Add more items
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorites Section */}
        {favoriteOutfits.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <FavoritesSection
              favoriteOutfits={favoriteOutfits}
              setFavoriteOutfits={setFavoriteOutfits}
              setGeneratedOutfits={setGeneratedOutfits}
              showFavorites={showFavorites}
              setShowFavorites={setShowFavorites}
            />
          </motion.div>
        )}

        {/* Manual Outfit Builder Modal */}
        <ManualOutfitBuilder
          isOpen={isManualBuilderOpen}
          onClose={() => setIsManualBuilderOpen(false)}
          closetItems={closetItems}
          onSave={handleManualOutfitSave}
        />

        {/* Share Modal */}
        <OutfitShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          outfit={selectedOutfitForShare || []}
          outfitName="My Outfit"
        />
      </div>
    </div>
  )
}
