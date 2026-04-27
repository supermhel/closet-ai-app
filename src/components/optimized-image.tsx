"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  [key: string]: any
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 600,
  className,
  priority = false,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    setImgSrc(src)
    setError(false)
    setLoading(true)
  }, [src])

  // Replace placeholder URLs with real images
  useEffect(() => {
    if (imgSrc && imgSrc.includes("placeholder.svg")) {
      // Generate a real image URL based on dimensions
      const realImageUrl = getRealImageUrl(width, height)
      setImgSrc(realImageUrl)
    }
  }, [imgSrc, width, height])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true)
    setLoading(false)

    // Use a data URI fallback
    setImgSrc(getFallbackImage(width, height))

    if (onError) {
      onError(e)
    }
  }

  const handleLoad = () => {
    setLoading(false)
  }

  if (error && !imgSrc.startsWith("data:")) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }} {...props}>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  // Check if className includes sizing classes (w-full, h-full, etc.)
  const hasResponsiveSizing = className && (
    className.includes('w-full') || 
    className.includes('h-full') || 
    className.includes('w-') || 
    className.includes('h-')
  );

  return (
    <div className={`relative ${className}`} style={hasResponsiveSizing ? {} : { width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      )}
      <Image
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={hasResponsiveSizing ? { width: '100%', height: '100%' } : {}}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        {...props}
      />
    </div>
  )
}

// Real fashion images from Unsplash with proper licensing
const FASHION_IMAGES = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1506629805607-d405b7a30db9?w=400&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center",
]

// Get a real image URL based on dimensions
function getRealImageUrl(width: number, height: number): string {
  const randomImage = FASHION_IMAGES[Math.floor(Math.random() * FASHION_IMAGES.length)]
  return randomImage.replace(/w=\d+&h=\d+/, `w=${width}&h=${height}`)
}

// Generate a fallback image as data URI
function getFallbackImage(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#F3F4F6"/>
      <rect x="${width * 0.25}" y="${height * 0.25}" width="${width * 0.5}" height="${height * 0.5}" rx="${width * 0.05}" fill="#9CA3AF"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
