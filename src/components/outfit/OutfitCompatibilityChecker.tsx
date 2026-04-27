"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
// Replace the predictOutfitCompatibility import with a direct import from the real AI service
import { predictOutfitCompatibility } from "@/lib/services/aiService"
import logger from "@/utils/logger"

interface OutfitCompatibilityCheckerProps {
  selectedItems: any[]
  onCompatibilityResult?: (result: any) => void
}

export default function OutfitCompatibilityChecker({
  selectedItems = [],
  onCompatibilityResult,
}: OutfitCompatibilityCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Check compatibility when selected items change
  useEffect(() => {
    setResult(null)
    setError(null)

    if (selectedItems.length >= 2) {
      checkCompatibility()
    }
  }, [selectedItems])

  // Replace the checkCompatibility function with this implementation that uses real AI:
  const checkCompatibility = async () => {
    if (isChecking || selectedItems.length < 2) return

    setIsChecking(true)
    setError(null)

    try {
      logger.info("Starting outfit compatibility check", {
        itemCount: selectedItems.length,
        itemIds: selectedItems.map((item) => item.id),
      })

      // Extract image URLs
      const imageUrls = selectedItems.map((item) => item.imageUrl || item.image || item.secure_url).filter(Boolean)

      if (imageUrls.length < 2) {
        throw new Error("Not enough valid images to check compatibility")
      }

      // Use real AI service instead of mock service
      const compatibilityResult = await predictOutfitCompatibility(imageUrls)

      setResult(compatibilityResult)

      if (onCompatibilityResult) {
        onCompatibilityResult(compatibilityResult)
      }

      logger.info("Outfit compatibility check complete", {
        compatible: compatibilityResult.compatible,
        score: compatibilityResult.score,
      })
    } catch (err: any) {
      logger.error("Error checking outfit compatibility", { error: err.message })
      setError(err.message || "Unable to check outfit compatibility")
    } finally {
      setIsChecking(false)
    }
  }

  if (selectedItems.length < 2) {
    return (
      <Card className="border border-dashed border-muted">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium">Compatibility Check</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select at least 2 items from your outfit to check their style compatibility
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-medium mb-1">Analyzing Outfit</h3>
              <p className="text-sm text-muted-foreground">Checking style, color, and pattern compatibility...</p>
            </div>

            <motion.div
              className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "5%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 10, ease: "linear" }}
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-t-4 border-t-destructive">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-destructive/10 p-2 rounded-full">
              <AlertTriangle size={18} className="text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-destructive mb-1">Compatibility Check Failed</h3>
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button onClick={checkCompatibility} variant="outline" size="sm" className="gap-2">
                <RefreshCw size={14} />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    const isCompatible = result.compatible
    const score = Math.round(result.score * 100)

    let compatibilityLevel = "low"
    if (score >= 80) compatibilityLevel = "high"
    else if (score >= 60) compatibilityLevel = "medium"

    const getColorClass = (level: string) => {
      switch (level) {
        case "high":
          return "text-green-600"
        case "medium":
          return "text-yellow-600"
        default:
          return "text-red-600"
      }
    }

    const getBgClass = (level: string) => {
      switch (level) {
        case "high":
          return "bg-green-500"
        case "medium":
          return "bg-yellow-500"
        default:
          return "bg-red-500"
      }
    }

    return (
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {isCompatible ? (
                <Check className={`${getColorClass(compatibilityLevel)} mr-2`} size={20} />
              ) : (
                <AlertTriangle className={`${getColorClass(compatibilityLevel)} mr-2`} size={20} />
              )}
              <h3 className={`font-medium ${getColorClass(compatibilityLevel)}`}>
                {score >= 80 ? "Great Match!" : score >= 60 ? "Good Match" : "Could Be Better"}
              </h3>
            </div>

            <Button onClick={checkCompatibility} size="sm" variant="ghost" className="h-8 w-8 p-0">
              <RefreshCw size={16} />
            </Button>
          </div>

          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${getBgClass(compatibilityLevel)}`} style={{ width: `${score}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Compatibility Score</span>
              <span className={`font-medium ${getColorClass(compatibilityLevel)}`}>{score}%</span>
            </div>
          </div>

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {result.analysis && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium">Analysis</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {result.analysis.map((item: any, index: number) => (
                      <div key={index} className="flex items-start">
                        <div className="mt-1 mr-2">
                          {item.type === "positive" ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <AlertTriangle size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-muted">
                  <h4 className="text-sm font-medium flex items-center">
                    <Info size={14} className="mr-1" />
                    Suggestions
                  </h4>
                  <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {result.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-muted hover:border-primary transition-colors">
      <CardContent className="p-5">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
              />
              <Check size={28} className="text-primary" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-medium mb-1">Style Compatibility</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Our AI will analyze your outfit for style, color, and pattern compatibility
            </p>

            <Button onClick={checkCompatibility} disabled={selectedItems.length < 2} className="gap-2">
              <RefreshCw size={16} />
              Analyze Outfit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
