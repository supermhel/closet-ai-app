"use client"
import Image from "next/image"
import { motion } from "framer-motion"
import { Eye, ShoppingBag, TagIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface OutfitCardProps {
  item: any
  index: number
  onViewDetails?: (item: any) => void
  onRemove?: (item: any, index: number) => void
  isSelected?: boolean
}

export default function OutfitCard({ item, index, onViewDetails, onRemove, isSelected = false }: OutfitCardProps) {
  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    hover: {
      y: -5,
      scale: 1.03,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    tap: { scale: 0.97 },
  }

  const getRandomDelay = () => Math.random() * 0.3

  return (
    <motion.div
      className={cn(
        "bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border group",
        isSelected ? "border-primary/50 ring-1 ring-primary/40" : "border-border",
        "flex flex-col h-full transition-all",
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      transition={{ delay: getRandomDelay() }}
      layout
    >
      <div className="relative aspect-square w-full bg-muted/50 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.name || `Item ${index + 1}`}
            fill
            className={cn(
              "object-contain p-2 w-full h-full transition-transform duration-300",
              "group-hover:scale-105",
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}

        {/* Hover action buttons */}
        <motion.div
          className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <div className="flex gap-2">
            {onViewDetails && (
              <motion.button
                className="h-8 w-8 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(item)
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Eye size={14} />
              </motion.button>
            )}

            {onRemove && (
              <motion.button
                className="h-8 w-8 rounded-full bg-background/90 hover:bg-muted text-foreground flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(item, index)
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm truncate">{item.name || `Item ${index + 1}`}</h3>

        <div className="mt-1 flex items-center gap-1">
          <div
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
              item.category === "top" && "bg-blue-100 text-blue-800",
              item.category === "bottom" && "bg-green-100 text-green-800",
              item.category === "shoes" && "bg-purple-100 text-purple-800",
              item.category === "outerwear" && "bg-orange-100 text-orange-800",
              item.category === "accessories" && "bg-pink-100 text-pink-800",
              (!item.category || item.category === "other") && "bg-gray-100 text-gray-800",
            )}
          >
            <TagIcon size={10} className="mr-1" />
            {item.category || "Other"}
          </div>

          {item.color && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full border border-border" style={{ backgroundColor: item.color }} />
              <span className="text-xs">{item.color}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
