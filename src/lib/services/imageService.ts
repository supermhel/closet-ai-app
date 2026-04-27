import { OptimizedImage } from "@/components/optimized-image"

// Real fashion images from Unsplash with proper licensing
const FASHION_CATEGORIES = {
  tops: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=600&fit=crop&crop=center",
  ],
  bottoms: [
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?w=400&h=600&fit=crop&crop=center",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center",
  ],
  dresses: [
    "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop&crop=center",
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop&crop=center",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?w=400&h=400&fit=crop&crop=center",
  ],
}

const PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
]

const DEFAULT_FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTAwQzE3Mi4zODYgMTAwIDE1MCA3Ny42MTQyIDE1MCA1MEMxNTAgMjIuMzg1OCAxNzIuMzg2IDAgMjAwIDBDMjI3LjYxNCAwIDI1MCAyMi4zODU4IDI1MCA1MEMyNTAgNzcuNjE0MiAyMjcuNjE0IDEwMCAyMDAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzAwIDM1MEgxMDBWMzAwQzEwMCAyNDQuNzcyIDEzNC43NzIgMjAwIDIwMCAyMDBDMjY1LjIyOCAyMDAgMzAwIDI0NC43NzIgMzAwIDMwMFYzNTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo="

interface ImageServiceOptions {
  category?: keyof typeof FASHION_CATEGORIES
  width?: number
  height?: number
  fallback?: string
}

/**
 * Get a fashion image URL based on category
 */
export function getFashionImage(options: ImageServiceOptions = {}): string {
  const { category = "tops", width = 400, height = 600, fallback = DEFAULT_FALLBACK } = options

  try {
    const categoryImages = FASHION_CATEGORIES[category] || FASHION_CATEGORIES.tops
    const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)]

    // Modify URL for specific dimensions
    return randomImage.replace(/w=\d+&h=\d+/, `w=${width}&h=${height}`)
  } catch (error) {
    console.error("Error getting real fashion image:", error)
    return fallback
  }
}

/**
 * Get a profile image URL
 */
export function getProfileImage(width = 200, height = 200): string {
  try {
    const randomImage = PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)]
    return randomImage.replace(/w=\d+&h=\d+/, `w=${width}&h=${height}`)
  } catch (error) {
    console.error("Error getting real profile image:", error)
    return DEFAULT_FALLBACK
  }
}

/**
 * Replace placeholder URLs with real images
 */
export function replacePlaceholderUrl(url: string, category?: keyof typeof FASHION_CATEGORIES): string {
  if (!url || !url.includes("placeholder.svg")) {
    return url
  }

  // Extract dimensions from placeholder URL
  const widthMatch = url.match(/width=(\d+)/)
  const heightMatch = url.match(/height=(\d+)/)

  const width = widthMatch ? Number.parseInt(widthMatch[1]) : 400
  const height = heightMatch ? Number.parseInt(heightMatch[1]) : 600

  // Determine if it's a profile image based on dimensions
  if (width <= 200 && height <= 200) {
    return getProfileImage(width, height)
  }

  return getFashionImage({ category, width, height })
}

/**
 * Validate image URL and provide fallback
 */
export async function validateImageUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    if (response.ok) {
      return url
    }
    throw new Error("Image not accessible")
  } catch (error) {
    console.warn(`Image validation failed for ${url}, using fallback`)
    return DEFAULT_FALLBACK
  }
}

/**
 * Get production-ready image source with fallbacks
 */
export function getProductionImageSrc(
  src: string,
  category?: keyof typeof FASHION_CATEGORIES
): string {
  return replacePlaceholderUrl(src, category)
}
