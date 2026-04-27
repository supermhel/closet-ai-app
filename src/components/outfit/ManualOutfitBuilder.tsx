"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Save, RefreshCw, Sparkles, ShoppingBag } from "lucide-react"
import { ClosetItem } from "@/contexts/closet-context"
import { ManualOutfitSelection, OutfitCompatibilityResult } from "@/types/outfit"
import OutfitCompatibilityChecker from "./OutfitCompatibilityChecker"
import logger from "@/utils/logger"

interface ManualOutfitBuilderProps {
  isOpen: boolean
  onClose: () => void
  closetItems: ClosetItem[]
  onSave: (items: ClosetItem[], date: Date, name: string) => void
}

export default function ManualOutfitBuilder({ 
  isOpen, 
  onClose, 
  closetItems, 
  onSave 
}: ManualOutfitBuilderProps) {
  const [activeCategory, setActiveCategory] = useState("tops")
  const [selected, setSelected] = useState<ManualOutfitSelection>({
    tops: null,
    bottoms: null,
    shoes: null,
    accessories: []
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [outfitName, setOutfitName] = useState("")
  const [compatibilityResult, setCompatibilityResult] = useState<OutfitCompatibilityResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const categories = [
    { key: "tops", label: "Tops" },
    { key: "bottoms", label: "Bottoms" },
    { key: "shoes", label: "Shoes" },
    { key: "accessories", label: "Accessories" },
  ]

  const handleSelect = (item: ClosetItem) => {
    if (activeCategory === "accessories") {
      setSelected((prev) => {
        const exists = prev.accessories.find((a) => a.id === item.id)
        return {
          ...prev,
          accessories: exists 
            ? prev.accessories.filter((a) => a.id !== item.id) 
            : [...prev.accessories, item],
        }
      })
    } else {
      setSelected((prev) => ({ 
        ...prev, 
        [activeCategory]: prev[activeCategory as keyof ManualOutfitSelection] === item ? null : item 
      }))
    }
  }

  const getSelectedItems = (): ClosetItem[] => {
    return [selected.tops, selected.bottoms, selected.shoes, ...selected.accessories]
      .filter(Boolean) as ClosetItem[]
  }

  const handleSave = () => {
    const items = getSelectedItems()
    if (items.length < 2) return
    
    onSave(items, selectedDate, outfitName || `Outfit for ${selectedDate.toLocaleDateString()}`)
    
    // Reset form
    setSelected({ tops: null, bottoms: null, shoes: null, accessories: [] })
    setSelectedDate(new Date())
    setOutfitName("")
    setCompatibilityResult(null)
    onClose()
  }

  const handleCheckCompatibility = async () => {
    const items = getSelectedItems()
    if (items.length < 2) return

    setIsChecking(true)
    setCompatibilityResult(null)
    
    try {
      const response = await fetch("/api/outfit/check-compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to check compatibility")
      }
      
      const result = await response.json()
      setCompatibilityResult(result.result)
      
      logger.info("Manual outfit compatibility check completed", {
        itemCount: items.length,
        compatible: result.result.compatible,
        score: result.result.score
      })
    } catch (error) {
      const err = error as Error
      logger.error("Error checking manual outfit compatibility:", err.message)
      setCompatibilityResult({
        compatible: false,
        score: 0,
        analysis: [{ type: 'error', text: 'Failed to check compatibility. Please try again.' }],
        suggestions: ['Check your internet connection and try again.']
      })
    } finally {
      setIsChecking(false)
    }
  }

  const isItemSelected = (item: ClosetItem): boolean => {
    if (activeCategory === "accessories") {
      return selected.accessories.some((a) => a.id === item.id)
    } else {
      return (selected[activeCategory as keyof ManualOutfitSelection] as ClosetItem)?.id === item.id
    }
  }

  const getFilteredItems = (): ClosetItem[] => {
    return closetItems.filter((item) => {
      const category = item.category?.toLowerCase() || ''
      
      switch (activeCategory) {
        case "tops":
          return ['top', 'shirt', 'blouse', 'sweater', 't-shirt', 'tank'].some(cat => 
            category.includes(cat)
          )
        case "bottoms":
          return ['bottom', 'pants', 'jeans', 'skirt', 'shorts'].some(cat => 
            category.includes(cat)
          )
        case "shoes":
          return ['shoes', 'sneakers', 'boots', 'sandals', 'heels'].some(cat => 
            category.includes(cat)
          )
        case "accessories":
          return ['accessory', 'bag', 'jewelry', 'hat', 'scarf'].some(cat => 
            category.includes(cat)
          )
        default:
          return false
      }
    })
  }

  if (!isOpen) return null

  const selectedItems = getSelectedItems()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50">
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute top-3 right-3" 
          onClick={onClose}
        >
          <X size={18} />
        </Button>

        <h2 className="text-2xl font-bold mb-4">Build Your Own Outfit</h2>

        {/* Outfit Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Outfit Name</label>
          <input
            type="text"
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
            placeholder="Enter outfit name..."
            className="w-full p-2 border border-border rounded-md bg-background"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant={activeCategory === cat.key ? "default" : "outline"}
              onClick={() => setActiveCategory(cat.key)}
              className="whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-64 overflow-y-auto">
          {getFilteredItems().map((item) => {
            const isSelected = isItemSelected(item)

            return (
              <div
                key={item.id}
                className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleSelect(item)}
              >
                <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs font-medium truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.category}</div>
              </div>
            )
          })}
        </div>

        {/* Selected Items Display */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Selected Items:</h3>
          <div className="flex gap-2 flex-wrap">
            {[selected.tops, selected.bottoms, selected.shoes].map((item) =>
              item ? (
                <Badge key={item.id} variant="default">
                  {item.name}
                </Badge>
              ) : null
            )}
            {selected.accessories.map((acc) => (
              <Badge key={acc.id} variant="secondary">
                {acc.name}
              </Badge>
            ))}
            {selectedItems.length === 0 && (
              <span className="text-sm text-muted-foreground">No items selected</span>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Date:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full p-2 border border-border rounded-md bg-background"
          />
        </div>

        {/* Compatibility Results */}
        {compatibilityResult && (
          <div className="my-4">
            <OutfitCompatibilityChecker result={compatibilityResult} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleCheckCompatibility}
            disabled={isChecking || selectedItems.length < 2}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Check Compatibility
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedItems.length < 2}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Outfit
          </Button>
        </div>
      </div>
    </div>
  )
} 