"use client"

import { useState, useEffect } from "react"
import { OptimizedImage } from "./optimized-image"
import { getFashionImage, replacePlaceholderUrl, validateImageUrl } from "@/lib/services/imageService"
import { Package } from "lucide-react"

interface ProductionImageFallbackProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  category?: "tops" | "bottoms" | "shoes" | "dresses" | "outerwear" | "accessories"
  fallbackType?: "fashion" | "profile" | "generic"
  [key: string]: any
}

export function ProductionImageFallback({
  src,
  alt,
  width = 400,
  height = 600,
  className,
  category,
  fallbackType = "fashion",
  ...props
}: ProductionImageFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    // Replace placeholder URLs immediately
    if (src && src.includes("placeholder.svg")) {
      const realSrc = replacePlaceholderUrl(src, category)
      setImageSrc(realSrc)
    } else {
      setImageSrc(src)
    }
  }, [src, category])

  useEffect(() => {
    // Validate image URL if it's not a placeholder
    if (imageSrc && !imageSrc.includes("placeholder.svg") && !imageSrc.startsWith("data:")) {
      setIsValidating(true)
      validateImageUrl(imageSrc)
        .then((validatedSrc) => {
          if (validatedSrc !== imageSrc) {
            setImageSrc(validatedSrc)
          }
        })
        .catch(() => {
          setHasError(true)
          // Use category-specific fallback
          const fallbackSrc = getFashionImage({ category, width, height })
          setImageSrc(fallbackSrc)
        })
        .finally(() => {
          setIsValidating(false)
        })
    }
  }, [imageSrc, category, width, height])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // Try category-specific fallback first
      if (category) {
        const fallbackSrc = getFashionImage({ category, width, height })
        setImageSrc(fallbackSrc)
      } else {
        // Use generic fallback
        setImageSrc(getGenericFallback(fallbackType, width, height))
      }
    }
  }

  if (isValidating) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <div className="animate-pulse">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}

function getGenericFallback(type: string, width: number, height: number): string {
  const iconSvg =
    type === "profile"
      ? `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#F3F4F6"/>
        <circle cx="${width / 2}" cy="${height / 3}" r="${Math.min(width, height) / 8}" fill="#9CA3AF"/>
        <path d="M${width * 0.25} ${height * 0.85}H${width * 0.75}V${height * 0.75}C${width * 0.75} ${height * 0.6} ${width * 0.65} ${height * 0.5} ${width / 2} ${height * 0.5}C${width * 0.35} ${height * 0.5} ${width * 0.25} ${height * 0.6} ${width * 0.25} ${height * 0.75}V${height * 0.85}Z" fill="#9CA3AF"/>
      </svg>`
      : `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#F3F4F6"/>
        <rect x="${width * 0.25}" y="${height * 0.25}" width="${width * 0.5}" height="${height * 0.5}" rx="${width * 0.05}" fill="#9CA3AF"/>
      </svg>`

  return `data:image/svg+xml;base64,${btoa(iconSvg)}`
}

// Hook for replacing placeholder images throughout the app
export function useProductionImage(src: string, category?: string) {
  const [productionSrc, setProductionSrc] = useState(src)

  useEffect(() => {
    if (src && src.includes("placeholder.svg")) {
      const realSrc = replacePlaceholderUrl(src, category as any)
      setProductionSrc(realSrc)
    } else {
      setProductionSrc(src)
    }
  }, [src, category])

  return productionSrc
}
