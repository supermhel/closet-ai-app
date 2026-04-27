"use client"

import { useState, useEffect } from "react"
import { OptimizedImage } from "./optimized-image"

// Real fashion images from Unsplash
const FASHION_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop",
]

const OUTFIT_IMAGES = [
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
]

const PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
]

interface RealPlaceholderProps {
  type: "fashion" | "outfit" | "profile"
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function RealPlaceholder({
  type,
  width = 400,
  height = 600,
  className,
  alt = "Fashion placeholder",
}: RealPlaceholderProps) {
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    // Randomly select an image based on type
    const images = {
      fashion: FASHION_IMAGES,
      outfit: OUTFIT_IMAGES,
      profile: PROFILE_IMAGES,
    }

    const selectedImages = images[type]
    setImageIndex(Math.floor(Math.random() * selectedImages.length))
  }, [type])

  const getImageUrl = () => {
    const images = {
      fashion: FASHION_IMAGES,
      outfit: OUTFIT_IMAGES,
      profile: PROFILE_IMAGES,
    }

    const selectedImages = images[type]
    const baseUrl = selectedImages[imageIndex]

    // Modify URL for specific dimensions
    return baseUrl.replace(/w=\d+&h=\d+/, `w=${width}&h=${height}`)
  }

  return (
    <OptimizedImage
      src={getImageUrl()}
      alt={alt}
      width={width}
      height={height}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  )
}

// Component for replacing all placeholder.svg instances
export function FashionPlaceholder({ className, ...props }: Omit<RealPlaceholderProps, "type">) {
  return <RealPlaceholder type="fashion" className={className} {...props} />
}

export function OutfitPlaceholder({ className, ...props }: Omit<RealPlaceholderProps, "type">) {
  return <RealPlaceholder type="outfit" className={className} {...props} />
}

export function ProfilePlaceholder({ className, ...props }: Omit<RealPlaceholderProps, "type">) {
  return <RealPlaceholder type="profile" className={className} {...props} />
}

// Hook to replace placeholder URLs with real images
export function useRealPlaceholder(url: string, type: "fashion" | "outfit" | "profile" = "fashion") {
  const [realUrl, setRealUrl] = useState(url)

  useEffect(() => {
    if (url.includes("placeholder.svg")) {
      const images = {
        fashion: FASHION_IMAGES,
        outfit: OUTFIT_IMAGES,
        profile: PROFILE_IMAGES,
      }

      const selectedImages = images[type]
      const randomImage = selectedImages[Math.floor(Math.random() * selectedImages.length)]
      setRealUrl(randomImage)
    }
  }, [url, type])

  return realUrl
}
