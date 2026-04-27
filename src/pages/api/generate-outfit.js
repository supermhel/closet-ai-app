import { generateEnhancedOutfits } from "@/lib/services/outfitGenerationService"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId, closetItems, preferences, weather, occasion } = req.body

    if (!userId || !closetItems) {
      return res.status(400).json({ error: "User ID and closet items are required" })
    }

    const result = await generateEnhancedOutfits({
      userId,
      closetItems,
      preferences: preferences || {},
      weather: weather || null,
      date: new Date(),
    })

    res.status(200).json({
      success: true,
      outfits: result.outfits,
      recommendations: result.recommendations,
    })
  } catch (error) {
    console.error("Outfit generation error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate outfits",
    })
  }
}
