/**
 * Outfit Generation Panel Component
 * Handles AI-powered outfit generation with loading states
 */

"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Shuffle,
  Sparkles,
  RefreshCw,
  Heart,
  Save,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GeneratedOutfit } from "@/types/outfit"
import { OutfitRating } from "@/components/outfit-rating"

interface OutfitGenerationPanelProps {
  generatedOutfits: GeneratedOutfit[]
  isGenerating: boolean
  onGenerate: () => Promise<void>
  onSaveOutfit: (outfit: GeneratedOutfit, date: Date) => Promise<void>
  onAddToFavorites: (outfit: GeneratedOutfit) => Promise<void>
  closetItemCount: number
}

export default function OutfitGenerationPanel({
  generatedOutfits,
  isGenerating,
  onGenerate,
  onSaveOutfit,
  onAddToFavorites,
  closetItemCount
}: OutfitGenerationPanelProps) {
  // Date selection for saving outfits - using current date as default
  const selectedDate = new Date()

  // Loading skeleton for outfit generation
  const OutfitSkeleton = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </motion.div>
  )

  const OutfitCard = ({ outfit, index }: { outfit: GeneratedOutfit; index: number }) => (
    <motion.div
      key={outfit.id}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Outfit Items Grid */}
      <div className="grid grid-cols-3 gap-2">
        {outfit.items.map((item) => (
          <div key={item.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-1 truncate" title={item.name}>
              {item.name}
            </p>
          </div>
        ))}
      </div>

      {/* Outfit Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{outfit.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{outfit.score}/100</span>
          </div>
        </div>
        
        {outfit.reasoning && outfit.reasoning.length > 0 && (
          <div className="text-sm text-gray-600">
            <p><strong>Why this works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              {outfit.reasoning.slice(0, 2).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            🎨 Color: {outfit.colorHarmony}/100
          </Badge>
          <Badge variant="outline" className="gap-1">
            👔 Style: {outfit.styleConsistency}/100
          </Badge>
          <Badge variant="outline" className="gap-1">
            🌤️ Weather: {outfit.weatherSuitability}/100
          </Badge>
        </div>

        {outfit.tags && outfit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {outfit.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddToFavorites(outfit)}
          className="gap-1 flex-1"
        >
          <Heart className="h-3 w-3" />
          Favorite
        </Button>
        <Button
          size="sm"
          onClick={() => onSaveOutfit(outfit, selectedDate)}
          className="gap-1 flex-1"
        >
          <Save className="h-3 w-3" />
          Save
        </Button>
      </div>

      {/* Outfit Rating */}
             <OutfitRating
         items={outfit.items}
         onRatingSubmit={async (rating, feedback) => {
           console.log("Outfit rated:", rating, feedback)
           // TODO: Implement rating submission
         }}
       />
    </motion.div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI-Generated Outfits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generate Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || closetItemCount < 3}
            className="gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4" />
                Generate Outfits
              </>
            )}
          </Button>
          
          {closetItemCount < 3 && (
            <p className="text-sm text-gray-500">
              Add at least 3 items to your closet to generate outfits
            </p>
          )}
        </div>

        {/* Generated Outfits */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <OutfitSkeleton />
          ) : generatedOutfits.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {generatedOutfits.map((outfit, index) => (
                <OutfitCard key={outfit.id} outfit={outfit} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500"
            >
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                             <p>Click &quot;Generate Outfits&quot; to get AI-powered recommendations!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
} 