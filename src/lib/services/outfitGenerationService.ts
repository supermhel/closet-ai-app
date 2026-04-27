/**
 * Intelligent Outfit Generation Service
 * 
 * This service provides smart outfit generation using rule-based algorithms
 * for color harmony, style compatibility, weather appropriateness, and user preferences.
 */

import { ClosetItem } from "@/contexts/closet-context"
import logger from "@/utils/logger"

// Color analysis utilities
const COLOR_FAMILIES = {
  warm: ['red', 'orange', 'yellow', 'pink', 'coral', 'gold', 'burgundy'],
  cool: ['blue', 'green', 'purple', 'teal', 'navy', 'emerald', 'violet'],
  neutral: ['black', 'white', 'gray', 'grey', 'brown', 'beige', 'cream', 'tan', 'khaki']
}

const COMPLEMENTARY_COLORS = {
  red: ['green', 'white', 'black', 'navy'],
  blue: ['orange', 'white', 'beige', 'yellow'],
  green: ['red', 'pink', 'white', 'brown'],
  yellow: ['purple', 'blue', 'black', 'gray'],
  purple: ['yellow', 'green', 'white', 'gold'],
  orange: ['blue', 'white', 'brown', 'black'],
  pink: ['green', 'gray', 'white', 'navy'],
  black: ['white', 'red', 'pink', 'yellow'],
  white: ['any'], // White goes with everything
  gray: ['any'], // Gray is neutral
  brown: ['cream', 'white', 'green', 'blue'],
  navy: ['white', 'red', 'pink', 'beige']
}

const STYLE_CATEGORIES = {
  formal: ['suit', 'blazer', 'dress shirt', 'dress pants', 'dress', 'heels'],
  business: ['blazer', 'blouse', 'dress pants', 'skirt', 'loafers', 'pumps'],
  casual: ['t-shirt', 'jeans', 'sneakers', 'sweater', 'shorts', 'sandals'],
  sporty: ['activewear', 'sneakers', 'shorts', 'tank top', 'hoodie'],
  elegant: ['dress', 'heels', 'jewelry', 'blouse', 'skirt']
}

interface WeatherData {
  current?: {
    temp_c?: number
    condition?: { text?: string }
    humidity?: number
  }
}

interface OutfitGenerationOptions {
  weather?: WeatherData | null
  occasion?: string
  style?: string
  colorPreference?: string[]
  avoidColors?: string[]
  season?: string
}

interface GeneratedOutfit {
  id: string
  name: string
  items: ClosetItem[]
  score: number
  reasoning: string[]
  tags: string[]
  weatherSuitability: number
  colorHarmony: number
  styleConsistency: number
}

/**
 * Analyzes color harmony between items
 */
function calculateColorHarmony(items: ClosetItem[]): number {
  if (items.length < 2) return 1.0

  let harmonyScore = 0
  let comparisons = 0

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1Colors = items[i].colors || []
      const item2Colors = items[j].colors || []

      if (item1Colors.length === 0 || item2Colors.length === 0) continue

      // Check if colors are complementary
      let pairScore = 0
      for (const color1 of item1Colors) {
        for (const color2 of item2Colors) {
          if (areColorsCompatible(color1, color2)) {
            pairScore = Math.max(pairScore, 0.8)
          }
        }
      }

      // Check if they're in the same color family (also good)
      if (pairScore < 0.5) {
        const family1 = getColorFamily(item1Colors[0])
        const family2 = getColorFamily(item2Colors[0])
        if (family1 === family2 || family1 === 'neutral' || family2 === 'neutral') {
          pairScore = 0.6
        }
      }

      harmonyScore += pairScore
      comparisons++
    }
  }

  return comparisons > 0 ? harmonyScore / comparisons : 0.5
}

/**
 * Checks if two colors are compatible
 */
function areColorsCompatible(color1: string, color2: string): boolean {
  const c1 = color1.toLowerCase()
  const c2 = color2.toLowerCase()

  // Same color is always compatible
  if (c1 === c2) return true

  // Check complementary colors
  const complementary = COMPLEMENTARY_COLORS[c1] || []
  if (complementary.includes('any') || complementary.includes(c2)) return true

  // Check reverse compatibility
  const reverseComplementary = COMPLEMENTARY_COLORS[c2] || []
  if (reverseComplementary.includes('any') || reverseComplementary.includes(c1)) return true

  return false
}

/**
 * Gets the color family for a color
 */
function getColorFamily(color: string): string {
  const c = color.toLowerCase()
  
  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    if (colors.some(familyColor => c.includes(familyColor))) {
      return family
    }
  }
  
  return 'neutral'
}

/**
 * Calculates style consistency score
 */
function calculateStyleConsistency(items: ClosetItem[]): number {
  if (items.length < 2) return 1.0

  const categories = items.map(item => item.category?.toLowerCase() || '')
  
  // Count how many items belong to each style category
  const styleScores = Object.entries(STYLE_CATEGORIES).map(([style, styleItems]) => {
    const matchingItems = categories.filter(cat => 
      styleItems.some(styleItem => cat.includes(styleItem.toLowerCase()))
    )
    return { style, score: matchingItems.length / items.length }
  })

  // Return the highest style consistency score
  return Math.max(...styleScores.map(s => s.score), 0.3)
}

/**
 * Calculates weather suitability score
 */
function calculateWeatherSuitability(items: ClosetItem[], weather?: WeatherData | null): number {
  if (!weather?.current?.temp_c) return 0.7 // Default neutral score

  const temp = weather.current.temp_c
  const condition = weather.current.condition?.text?.toLowerCase() || ''
  
  let suitabilityScore = 0.5
  const itemCategories = items.map(item => item.category?.toLowerCase() || '')
  
  // Temperature appropriateness
  if (temp < 10) {
    // Cold weather - need warm items
    if (itemCategories.some(cat => ['coat', 'jacket', 'sweater', 'boots'].includes(cat))) {
      suitabilityScore += 0.3
    }
    if (itemCategories.some(cat => ['shorts', 'sandals', 't-shirt'].includes(cat))) {
      suitabilityScore -= 0.2
    }
  } else if (temp > 25) {
    // Hot weather - need light items
    if (itemCategories.some(cat => ['shorts', 't-shirt', 'sandals', 'dress'].includes(cat))) {
      suitabilityScore += 0.3
    }
    if (itemCategories.some(cat => ['coat', 'jacket', 'boots'].includes(cat))) {
      suitabilityScore -= 0.2
    }
  } else {
    // Moderate weather - most items are fine
    suitabilityScore += 0.2
  }

  // Rain appropriateness
  if (condition.includes('rain')) {
    if (itemCategories.some(cat => ['jacket', 'coat', 'boots'].includes(cat))) {
      suitabilityScore += 0.2
    }
    if (itemCategories.some(cat => ['sandals', 'canvas'].includes(cat))) {
      suitabilityScore -= 0.1
    }
  }

  return Math.max(0, Math.min(1, suitabilityScore))
}

/**
 * Generates multiple outfit options using intelligent algorithms
 */
export async function generateEnhancedOutfits(
  closetItems: ClosetItem[],
  options: OutfitGenerationOptions = {}
): Promise<GeneratedOutfit[]> {
  
  logger.info('Starting enhanced outfit generation', {
    itemCount: closetItems.length,
    weather: !!options.weather,
    occasion: options.occasion
  })

  if (closetItems.length < 3) {
    throw new Error('Need at least 3 items to generate outfits')
  }

  // Categorize items
  const categories = {
    tops: closetItems.filter(item => 
      ['top', 'shirt', 'blouse', 'sweater', 't-shirt', 'tank'].some(cat => 
        item.category?.toLowerCase().includes(cat)
      )
    ),
    bottoms: closetItems.filter(item => 
      ['bottom', 'pants', 'jeans', 'skirt', 'shorts'].some(cat => 
        item.category?.toLowerCase().includes(cat)
      )
    ),
    dresses: closetItems.filter(item => 
      item.category?.toLowerCase().includes('dress')
    ),
    shoes: closetItems.filter(item => 
      ['shoes', 'sneakers', 'boots', 'sandals', 'heels'].some(cat => 
        item.category?.toLowerCase().includes(cat)
      )
    ),
    outerwear: closetItems.filter(item => 
      ['jacket', 'coat', 'blazer', 'cardigan'].some(cat => 
        item.category?.toLowerCase().includes(cat)
      )
    ),
    accessories: closetItems.filter(item => 
      ['accessory', 'bag', 'jewelry', 'hat', 'scarf'].some(cat => 
        item.category?.toLowerCase().includes(cat)
      )
    )
  }

  const outfits: GeneratedOutfit[] = []
  const maxOutfits = 5
  
  // Generate dress-based outfits
  for (let i = 0; i < Math.min(2, categories.dresses.length) && outfits.length < maxOutfits; i++) {
    const dress = categories.dresses[i]
    const items = [dress]
    
    // Add shoes
    if (categories.shoes.length > 0) {
      const bestShoe = findBestMatch(dress, categories.shoes, options)
      if (bestShoe) items.push(bestShoe)
    }
    
    // Add outerwear if cold
    if (options.weather?.current?.temp_c && options.weather.current.temp_c < 18 && categories.outerwear.length > 0) {
      const bestOuterwear = findBestMatch(dress, categories.outerwear, options)
      if (bestOuterwear) items.push(bestOuterwear)
    }
    
    // Add accessory
    if (categories.accessories.length > 0 && Math.random() > 0.4) {
      const bestAccessory = findBestMatch(dress, categories.accessories, options)
      if (bestAccessory) items.push(bestAccessory)
    }
    
    if (items.length >= 2) {
      outfits.push(createOutfitFromItems(items, options, `Dress Outfit ${i + 1}`))
    }
  }
  
  // Generate top+bottom outfits
  for (let i = 0; i < Math.min(3, categories.tops.length) && outfits.length < maxOutfits; i++) {
    if (categories.bottoms.length === 0) break
    
    const top = categories.tops[i]
    const bestBottom = findBestMatch(top, categories.bottoms, options)
    
    if (!bestBottom) continue
    
    const items = [top, bestBottom]
    
    // Add shoes
    if (categories.shoes.length > 0) {
      const bestShoe = findBestMatchForOutfit(items, categories.shoes, options)
      if (bestShoe) items.push(bestShoe)
    }
    
    // Add outerwear if needed
    if (needsOuterwear(options.weather) && categories.outerwear.length > 0) {
      const bestOuterwear = findBestMatchForOutfit(items, categories.outerwear, options)
      if (bestOuterwear) items.push(bestOuterwear)
    }
    
    outfits.push(createOutfitFromItems(items, options, `Coordinated Outfit ${i + 1}`))
  }
  
  // Sort by overall score
  outfits.sort((a, b) => b.score - a.score)
  
  logger.info('Enhanced outfit generation complete', {
    generatedCount: outfits.length,
    averageScore: outfits.reduce((sum, o) => sum + o.score, 0) / outfits.length
  })
  
  return outfits.slice(0, 3) // Return top 3 outfits
}

/**
 * Finds the best matching item for a given base item
 */
function findBestMatch(baseItem: ClosetItem, candidates: ClosetItem[], options: OutfitGenerationOptions): ClosetItem | null {
  if (candidates.length === 0) return null
  
  let bestMatch = candidates[0]
  let bestScore = 0
  
  for (const candidate of candidates) {
    let score = 0
    
    // Color compatibility
    const colorScore = calculateColorHarmony([baseItem, candidate])
    score += colorScore * 0.4
    
    // Style compatibility
    const styleScore = calculateStyleConsistency([baseItem, candidate])
    score += styleScore * 0.3
    
    // Weather appropriateness
    const weatherScore = calculateWeatherSuitability([baseItem, candidate], options.weather)
    score += weatherScore * 0.3
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidate
    }
  }
  
  return bestMatch
}

/**
 * Finds the best matching item for an existing outfit
 */
function findBestMatchForOutfit(outfit: ClosetItem[], candidates: ClosetItem[], options: OutfitGenerationOptions): ClosetItem | null {
  if (candidates.length === 0) return null
  
  let bestMatch = candidates[0]
  let bestScore = 0
  
  for (const candidate of candidates) {
    const testOutfit = [...outfit, candidate]
    
    const colorScore = calculateColorHarmony(testOutfit)
    const styleScore = calculateStyleConsistency(testOutfit)
    const weatherScore = calculateWeatherSuitability(testOutfit, options.weather)
    
    const totalScore = colorScore * 0.4 + styleScore * 0.3 + weatherScore * 0.3
    
    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMatch = candidate
    }
  }
  
  return bestMatch
}

/**
 * Creates an outfit object from items with scoring
 */
function createOutfitFromItems(items: ClosetItem[], options: OutfitGenerationOptions, name: string): GeneratedOutfit {
  const colorHarmony = calculateColorHarmony(items)
  const styleConsistency = calculateStyleConsistency(items)
  const weatherSuitability = calculateWeatherSuitability(items, options.weather)
  
  const score = colorHarmony * 0.4 + styleConsistency * 0.3 + weatherSuitability * 0.3
  
  const reasoning = []
  if (colorHarmony > 0.7) reasoning.push('Excellent color coordination')
  if (styleConsistency > 0.7) reasoning.push('Consistent style theme')
  if (weatherSuitability > 0.7) reasoning.push('Perfect for current weather')
  if (reasoning.length === 0) reasoning.push('Well-balanced outfit combination')
  
  const tags = []
  if (options.occasion) tags.push(options.occasion)
  if (options.weather?.current?.temp_c && options.weather.current.temp_c < 15) tags.push('cold-weather')
  if (options.weather?.current?.temp_c && options.weather.current.temp_c > 25) tags.push('warm-weather')
  
  return {
    id: `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    items,
    score: Math.round(score * 100) / 100,
    reasoning,
    tags,
    weatherSuitability: Math.round(weatherSuitability * 100) / 100,
    colorHarmony: Math.round(colorHarmony * 100) / 100,
    styleConsistency: Math.round(styleConsistency * 100) / 100
  }
}

/**
 * Determines if outerwear is needed based on weather
 */
function needsOuterwear(weather?: WeatherData | null): boolean {
  if (!weather?.current?.temp_c) return false
  return weather.current.temp_c < 18
}

/**
 * Checks compatibility between multiple items
 */
export async function checkOutfitCompatibility(items: ClosetItem[]): Promise<{
  compatible: boolean
  score: number
  analysis: Array<{ type: string; text: string }>
  suggestions: string[]
}> {
  
  if (items.length < 2) {
    return {
      compatible: false,
      score: 0,
      analysis: [{ type: 'error', text: 'Need at least 2 items to check compatibility' }],
      suggestions: ['Add more items to your outfit']
    }
  }
  
  const colorHarmony = calculateColorHarmony(items)
  const styleConsistency = calculateStyleConsistency(items)
  const overallScore = (colorHarmony + styleConsistency) / 2
  
  const analysis = []
  const suggestions = []
  
  // Color analysis
  if (colorHarmony > 0.7) {
    analysis.push({ type: 'positive', text: 'Excellent color coordination - these colors work beautifully together' })
  } else if (colorHarmony > 0.5) {
    analysis.push({ type: 'neutral', text: 'Good color balance with room for improvement' })
    suggestions.push('Consider adding a neutral piece to balance the colors')
  } else {
    analysis.push({ type: 'negative', text: 'Colors may clash - consider adjusting your color choices' })
    suggestions.push('Try swapping one item for a more neutral color')
  }
  
  // Style analysis
  if (styleConsistency > 0.7) {
    analysis.push({ type: 'positive', text: 'Consistent style theme throughout the outfit' })
  } else if (styleConsistency > 0.5) {
    analysis.push({ type: 'neutral', text: 'Mixed style elements - could work for eclectic looks' })
    suggestions.push('Consider accessories to tie the different styles together')
  } else {
    analysis.push({ type: 'negative', text: 'Style elements don\'t seem to match well' })
    suggestions.push('Try choosing items from the same style category')
  }
  
  // Additional suggestions
  if (items.length < 3) {
    suggestions.push('Consider adding shoes or accessories to complete the look')
  }
  
  return {
    compatible: overallScore > 0.6,
    score: Math.round(overallScore * 100),
    analysis,
    suggestions: suggestions.length > 0 ? suggestions : ['This outfit looks great as is!']
  }
} 