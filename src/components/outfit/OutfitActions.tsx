"use client"
import { Shuffle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OutfitActionsProps {
  onGenerateOutfit: () => void
  onSaveOutfit: () => void
  isGeneratingOutfit: boolean
}

export default function OutfitActions({ onGenerateOutfit, onSaveOutfit, isGeneratingOutfit }: OutfitActionsProps) {
  return (
    <div className="flex justify-center mt-4 gap-3">
      <Button onClick={onGenerateOutfit} variant="outline" className="gap-2" disabled={isGeneratingOutfit}>
        <Shuffle size={16} />
        Shuffle
      </Button>
      <Button onClick={onSaveOutfit} className="gap-2">
        <Plus size={16} />
        Add to Calendar
      </Button>
    </div>
  )
}
