"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Separator } from "@/components/ui/separator"
import {
  Palette,
  Shirt,
  Star,
  Plus,
  X,
  DollarSign,
  Tag,
  Heart,
  Sparkles,
  User,
  Target
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PreferencesFormProps {
  preferencesData: {
    styles: string[]
    colors: string[]
    sizes: string[]
    budget?: string
    occasions?: string[]
    brands?: string[]
    fits?: string[]
    patterns?: string[]
  }
  onArrayToggle: (field: string, value: string) => void
  isEditing: boolean
  styleOptions: string[]
  colorOptions: string[]
  sizeOptions: string[]
  onInputChange?: (field: string, value: string) => void
}

// Extended preference options
const OCCASION_OPTIONS = [
  "Work/Business",
  "Casual Daily",
  "Evening Out",
  "Formal Events",
  "Workout/Active",
  "Travel",
  "Date Night",
  "Weekend Relaxed",
  "Special Occasions",
  "Outdoor Activities"
]

const FIT_PREFERENCES = [
  "Slim Fit",
  "Regular Fit",
  "Relaxed Fit",
  "Oversized",
  "Tailored",
  "Loose Fit",
  "Athletic Fit",
  "Cropped",
  "High-waisted",
  "Low-waisted"
]

const PATTERN_OPTIONS = [
  "Solid Colors",
  "Stripes",
  "Polka Dots",
  "Floral",
  "Geometric",
  "Animal Print",
  "Plaid/Checkered",
  "Abstract",
  "Paisley",
  "Chevron",
  "Tie-dye",
  "Minimal Patterns"
]

const POPULAR_BRANDS = [
  "Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Gap", "Levi's", 
  "Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Forever 21", 
  "Old Navy", "Target", "Banana Republic", "J.Crew", "Mango",
  "COS", "Everlane", "Reformation", "Patagonia"
]

const BUDGET_RANGES = [
  { value: "budget", label: "Budget-Friendly ($0-50)", min: 0, max: 50 },
  { value: "mid-range", label: "Mid-Range ($50-150)", min: 50, max: 150 },
  { value: "premium", label: "Premium ($150-500)", min: 150, max: 500 },
  { value: "luxury", label: "Luxury ($500+)", min: 500, max: 1000 },
  { value: "no-limit", label: "No Budget Limit", min: 0, max: 0 }
]

export default function PreferencesForm({ 
  preferencesData, 
  onArrayToggle, 
  isEditing, 
  styleOptions, 
  colorOptions, 
  sizeOptions,
  onInputChange
}: PreferencesFormProps) {
  const [customBrand, setCustomBrand] = useState("")
  const [showAllBrands, setShowAllBrands] = useState(false)

  const handleAddCustomBrand = () => {
    if (customBrand.trim() && onArrayToggle) {
      onArrayToggle("preferences.brands", customBrand.trim())
      setCustomBrand("")
    }
  }

  const handleRemoveBrand = (brand: string) => {
    if (onArrayToggle) {
      onArrayToggle("preferences.brands", brand)
    }
  }

  const selectedBudget = BUDGET_RANGES.find(range => range.value === preferencesData.budget)

  return (
    <div className="space-y-6">
      {/* Style Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            Style Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => (
              <motion.div
                key={style}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant={preferencesData.styles.includes(style) ? "default" : "secondary"}
                  onClick={() => isEditing && onArrayToggle("preferences.styles", style)}
                  className={`cursor-pointer transition-all ${
                    isEditing 
                      ? "hover:shadow-md" 
                      : "cursor-default opacity-75"
                  }`}
                >
                  {preferencesData.styles.includes(style) && (
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                  )}
                  {style}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Favorite Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {colorOptions.map((color) => (
              <motion.div
                key={color}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 cursor-pointer transition-all ${
                    preferencesData.colors.includes(color)
                      ? "border-primary shadow-lg scale-110"
                      : "border-gray-300 hover:border-gray-400"
                  } ${!isEditing ? "cursor-default" : ""}`}
                  style={{ 
                    backgroundColor: color.toLowerCase() === 'white' 
                      ? '#ffffff' 
                      : color.toLowerCase() === 'black' 
                      ? '#000000'
                      : color.toLowerCase()
                  }}
                  onClick={() => isEditing && onArrayToggle("preferences.colors", color)}
                >
                  {preferencesData.colors.includes(color) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white drop-shadow-lg" fill="currentColor" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-center">{color}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Size Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Sizes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <Badge
                key={size}
                variant={preferencesData.sizes.includes(size) ? "default" : "secondary"}
                onClick={() => isEditing && onArrayToggle("preferences.sizes", size)}
                className={`cursor-pointer transition-all ${
                  isEditing 
                    ? "hover:bg-primary/80" 
                    : "cursor-default opacity-75"
                }`}
              >
                {size}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Price Range</Label>
            <Select
              value={preferencesData.budget || "mid-range"}
              onValueChange={(value) => onInputChange && onInputChange("preferences.budget", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedBudget && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {selectedBudget.label}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This helps us recommend items within your preferred price range.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occasion Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Occasions You Dress For
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {OCCASION_OPTIONS.map((occasion) => (
              <Badge
                key={occasion}
                variant={preferencesData.occasions?.includes(occasion) ? "default" : "outline"}
                onClick={() => isEditing && onArrayToggle("preferences.occasions", occasion)}
                className={`justify-center p-2 cursor-pointer transition-all ${
                  isEditing 
                    ? "hover:shadow-md" 
                    : "cursor-default opacity-75"
                }`}
              >
                {occasion}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fit Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Fit Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FIT_PREFERENCES.map((fit) => (
              <Badge
                key={fit}
                variant={preferencesData.fits?.includes(fit) ? "default" : "secondary"}
                onClick={() => isEditing && onArrayToggle("preferences.fits", fit)}
                className={`cursor-pointer transition-all ${
                  isEditing 
                    ? "hover:bg-primary/80" 
                    : "cursor-default opacity-75"
                }`}
              >
                {fit}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Pattern Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PATTERN_OPTIONS.map((pattern) => (
              <Badge
                key={pattern}
                variant={preferencesData.patterns?.includes(pattern) ? "default" : "secondary"}
                onClick={() => isEditing && onArrayToggle("preferences.patterns", pattern)}
                className={`cursor-pointer transition-all ${
                  isEditing 
                    ? "hover:bg-primary/80" 
                    : "cursor-default opacity-75"
                }`}
              >
                {pattern}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favorite Brands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Favorite Brands */}
          {preferencesData.brands && preferencesData.brands.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Your Favorite Brands</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <AnimatePresence>
                  {preferencesData.brands.map((brand) => (
                    <motion.div
                      key={brand}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge 
                        variant="default" 
                        className="gap-1 pr-1"
                      >
                        {brand}
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => handleRemoveBrand(brand)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <Separator className="my-4" />
            </div>
          )}

          {/* Add Custom Brand */}
          {isEditing && (
            <div className="space-y-3">
              <Label>Add Custom Brand</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter brand name..."
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomBrand()}
                />
                <Button 
                  onClick={handleAddCustomBrand}
                  disabled={!customBrand.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Popular Brands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Popular Brands</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllBrands(!showAllBrands)}
              >
                {showAllBrands ? "Show Less" : "Show All"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllBrands ? POPULAR_BRANDS : POPULAR_BRANDS.slice(0, 10)).map((brand) => (
                <Badge
                  key={brand}
                  variant={preferencesData.brands?.includes(brand) ? "default" : "outline"}
                  onClick={() => isEditing && onArrayToggle("preferences.brands", brand)}
                  className={`cursor-pointer transition-all ${
                    isEditing 
                      ? "hover:shadow-md" 
                      : "cursor-default opacity-75"
                  }`}
                >
                  {brand}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
