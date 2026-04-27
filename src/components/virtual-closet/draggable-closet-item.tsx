"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash, Star, Move, ImageIcon, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClosetItem } from "@/types/virtual-closet"

interface DraggableClosetItemProps {
  item: ClosetItem
  onPlaceItem: (item: ClosetItem, position?: { x: number; y: number; z: number }) => void
  onRemoveItem: (itemId: string) => void
  isPlaced: boolean
}

export default function DraggableClosetItem({ item, onPlaceItem, onRemoveItem, isPlaced }: DraggableClosetItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Start dragging
  const handleDragStart = (e: React.DragEvent) => {
    if (item.imageUrl) {
      const img = new Image()
      img.src = item.imageUrl
      e.dataTransfer.setDragImage(img, 50, 50)
    }

    e.dataTransfer.setData("application/json", JSON.stringify(item))
    e.dataTransfer.effectAllowed = "copy"
    setIsDragging(true)
  }

  // End dragging
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Handle click to place/remove item
  const handleItemClick = () => {
    if (isPlaced) {
      onRemoveItem(item.id)
    } else {
      onPlaceItem(item)
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      tops: "bg-blue-500",
      bottoms: "bg-green-500",
      footwear: "bg-purple-500",
      accessories: "bg-yellow-500",
      outerwear: "bg-red-500",
      dresses: "bg-pink-500",
    }

    return colors[category?.toLowerCase() as keyof typeof colors] || "bg-gray-500"
  }

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 0.92 : 1,
        y: isDragging ? -10 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      whileHover={{ y: -8 }}
      className={cn(
        "bg-background rounded-xl overflow-hidden border cursor-grab touch-manipulation shadow-sm",
        isPlaced ? "ring-2 ring-primary shadow-lg" : "border-border",
        "hover:shadow-md transition-shadow",
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isDragging && (
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl z-[-1]"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
      )}

      <div className="h-32 relative overflow-hidden">
        {item.imageUrl ? (
          <motion.img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center">No image</span>
          </div>
        )}

        {/* Drag indicator */}
        <motion.div
          className="absolute top-1 right-1 bg-background/60 backdrop-blur-sm p-1 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovering ? 1 : 0,
            scale: isHovering ? 1 : 0.8,
          }}
        >
          <Move className="h-3 w-3" />
        </motion.div>

        {/* Status overlay */}
        {isPlaced && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
      </div>

      <div className="p-3">
        <h3 className={cn("text-sm font-medium mb-1 truncate", isPlaced && "text-primary")}>{item.name}</h3>

        <div className="flex justify-between items-center">
          {/* Color indicators */}
          <div className="flex gap-1 items-center">
            {item.colors?.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {(item.colors?.length || 0) > 3 && (
              <span className="text-xs text-muted-foreground">+{(item.colors?.length || 0) - 3}</span>
            )}
          </div>

          {/* Favorite indicator */}
          {item.favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
        </div>

        {/* Action button */}
        <Button
          variant={isPlaced ? "destructive" : "default"}
          size="sm"
          className="w-full mt-3"
          onClick={handleItemClick}
        >
          {isPlaced ? (
            <>
              <Trash className="h-3 w-3 mr-1" />
              Remove
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Add to Closet
            </>
          )}
        </Button>
      </div>

      {/* Drag hint overlay */}
      <AnimatePresence>
        {isHovering && !isDragging && (
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="p-3 rounded-full bg-primary/20 ring-2 ring-primary/30">
                {isPlaced ? (
                  <Trash className="h-6 w-6 text-primary" />
                ) : (
                  <ArrowUpRight className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="text-sm font-medium text-center px-4 py-2 bg-muted/80 backdrop-blur-sm rounded-lg">
                {isPlaced ? "Click to remove" : "Drag to canvas or click to add"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
