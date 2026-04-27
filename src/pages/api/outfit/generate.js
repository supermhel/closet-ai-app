import { getCurrentWeather } from "@/lib/services/weatherService"
import { generateEnhancedOutfits } from "@/lib/services/outfitGenerationService"
import logger from "@/utils/logger"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, closetItems, location, occasion = "casual", style, colorPreference, season } = req.body

    if (!userId || !closetItems || !Array.isArray(closetItems)) {
      return res.status(400).json({
        success: false,
        error: "User ID and closet items array are required",
        code: "INVALID_INPUT",
      })
    }

    if (closetItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No closet items available for outfit generation",
        code: "NO_ITEMS",
      })
    }

    if (closetItems.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Need at least 3 items in closet to generate outfits",
        code: "INSUFFICIENT_ITEMS",
      })
    }

    logger.info("Starting intelligent outfit generation", {
      userId,
      itemCount: closetItems.length,
      occasion,
      style,
      hasLocation: !!location
    })

    // Fetch weather data if location is provided
    let weatherData = null
    if (location) {
      try {
        if (location.lat && location.lon) {
          weatherData = await getCurrentWeather(location.lat, location.lon)
        } else if (location.city) {
          weatherData = await getCurrentWeather(null, null, location.city)
        }
        logger.info("Weather data fetched for outfit generation", {
          temperature: weatherData?.current?.temp_c,
          condition: weatherData?.current?.condition?.text
        })
      } catch (weatherError) {
        logger.warn("Weather fetch failed, continuing without weather data:", weatherError.message)
      }
    }

    // Prepare generation options
    const generationOptions = {
      weather: weatherData,
      occasion,
      style,
      colorPreference: colorPreference || [],
      season
    }

    // Generate intelligent outfits using the new service
    const enhancedOutfits = await generateEnhancedOutfits(closetItems, generationOptions)

    logger.info("Intelligent outfit generation completed", {
      generatedCount: enhancedOutfits.length,
      averageScore: enhancedOutfits.reduce((sum, outfit) => sum + outfit.score, 0) / enhancedOutfits.length,
      topScore: enhancedOutfits[0]?.score
    })

    // Generate style recommendations based on the generated outfits
    const recommendations = generateStyleRecommendations(weatherData, occasion, enhancedOutfits)
    
    res.status(200).json({
      success: true,
      outfits: enhancedOutfits.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        items: outfit.items.map(item => item.id),
        itemsData: outfit.items,
        occasion,
        weather: weatherData?.current,
        confidence: outfit.score,
        reasoning: outfit.reasoning.join('. '),
        tags: outfit.tags,
        analysis: {
          colorHarmony: outfit.colorHarmony,
          styleConsistency: outfit.styleConsistency,
          weatherSuitability: outfit.weatherSuitability
        },
        createdAt: new Date(),
      })),
      recommendations,
      intelligent: true, // Mark as intelligent generation
      analysis: {
        totalItems: closetItems.length,
        weatherConsidered: !!weatherData,
        occasionMatched: occasion,
        generationMethod: 'intelligent_algorithm'
      }
    })
  } catch (error) {
    logger.error("Intelligent outfit generation failed:", {
      error: error.message,
      stack: error.stack,
      userId: req.body?.userId,
      itemCount: req.body?.closetItems?.length
    })
    
    const errorCode = error.code || "GENERATION_ERROR"

    res.status(500).json({ 
      success: false, 
      error: error.message, 
      code: errorCode 
    })
  }
}

function generateStyleRecommendations(weatherData, occasion, outfits) {
  const recommendations = []

  // Weather-based recommendations
  if (weatherData?.current) {
    const temp = weatherData.current.temp_c
    const condition = weatherData.current.condition?.text?.toLowerCase() || ""

    if (temp < 5) {
      recommendations.push("Layer up with warm materials like wool or fleece")
      recommendations.push("Don't forget accessories like gloves, scarf, and hat")
    } else if (temp < 15) {
      recommendations.push("A light jacket or cardigan would be perfect")
      recommendations.push("Consider closed-toe shoes for comfort")
    } else if (temp > 25) {
      recommendations.push("Choose breathable fabrics like cotton or linen")
      recommendations.push("Light colors will help reflect heat")
    }

    if (condition.includes("rain")) {
      recommendations.push("Waterproof outerwear is essential")
      recommendations.push("Avoid suede or delicate materials")
    }

    if (condition.includes("wind")) {
      recommendations.push("Fitted clothing works better in windy conditions")
      recommendations.push("Secure any loose accessories")
    }
  }

  // Outfit-specific recommendations based on generated outfits
  if (outfits?.length > 0) {
    const topOutfit = outfits[0]
    
    if (topOutfit.colorHarmony > 0.8) {
      recommendations.push("Your outfit has excellent color coordination!")
    } else if (topOutfit.colorHarmony < 0.5) {
      recommendations.push("Consider adding a neutral piece to balance the colors")
    }
    
    if (topOutfit.styleConsistency > 0.8) {
      recommendations.push("Great style consistency across all pieces")
    }
    
    if (topOutfit.weatherSuitability > 0.8) {
      recommendations.push("Perfect outfit choice for today's weather")
    }
  }

  // Occasion-based recommendations
  switch (occasion?.toLowerCase()) {
    case "formal":
      recommendations.push("Stick to classic colors like navy, black, or gray")
      recommendations.push("Ensure all items are well-fitted and pressed")
      break
    case "casual":
      recommendations.push("Mix and match different textures for interest")
      recommendations.push("Comfortable shoes are key for casual outfits")
      break
    case "work":
      recommendations.push("Business casual allows for more color and pattern")
      recommendations.push("A blazer can instantly elevate any outfit")
      break
    case "date":
      recommendations.push("Choose something that makes you feel confident")
      recommendations.push("Consider the venue when selecting your outfit")
      break
  }

  return recommendations.slice(0, 5) // Limit to 5 recommendations
}
