"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Save, RefreshCw, Camera, Grid, Layers, Lock, Unlock, Search, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import DraggableClosetItem from "./draggable-closet-item"

interface VirtualClosetLayoutProps {
  items: any[]
  placedItems: any[]
  filteredItems: any[]
  templateOptions: any[]
  selectedTemplate: string
  analytics: any
  isLoading: boolean
  isLocked: boolean
  onTemplateChange: (templateId: string) => void
  onSearchChange: (query: string) => void
  onPlaceItem: (item: any, position?: any) => void
  onRemoveItem: (itemId: string) => void
  onSaveLayout: () => void
  onResetLayout: () => void
  onCaptureSnapshot: () => void
  onToggleLock: () => void
  children: React.ReactNode
}

export default function VirtualClosetLayout({
  items,
  placedItems,
  filteredItems,
  templateOptions,
  selectedTemplate,
  analytics: _analytics,
  isLoading,
  isLocked,
  onTemplateChange,
  onSearchChange,
  onPlaceItem,
  onRemoveItem,
  onSaveLayout,
  onResetLayout,
  onCaptureSnapshot,
  onToggleLock,
  children,
}: VirtualClosetLayoutProps) {
  // Suppress unused parameter warning
  void _analytics
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Get categories from items
  const categories = ["all", ...new Set((items || []).map((item) => item.category))].filter(Boolean)

  // Filter items for sidebar
  const sidebarItems = useMemo(() => {
    const safeFilteredItems = filteredItems || []
    
    if (!searchQuery && activeCategory === "all") {
      return safeFilteredItems
    }

    return safeFilteredItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory
      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [filteredItems, searchQuery, activeCategory])

  // Check if we should show empty state
  useEffect(() => {
    setShowEmptyState((placedItems || []).length === 0)
  }, [placedItems])

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearchChange(value)
  }

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery("")
    onSearchChange("")
  }

  // Handle category filter
  const handleCategoryFilter = (category: string) => {
    setActiveCategory(category)
  }

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }, [])

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }, [])

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDraggingOver(false)

      try {
        const itemData = JSON.parse(e.dataTransfer.getData("application/json"))
        const item = (items || []).find((i) => i.id === itemData.id)

        if (item) {
          // Calculate drop position based on mouse coordinates
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const x = ((e.clientX - rect.left) / rect.width) * 10 - 5
            const z = ((e.clientY - rect.top) / rect.height) * 10 - 5
            onPlaceItem(item, { x, y: 0, z })
          } else {
            onPlaceItem(item)
          }
        }
      } catch (error) {
        console.error("Error handling drop:", error)
      }
    },
    [items, onPlaceItem],
  )

  return (
    <motion.div
      className="h-full flex flex-col bg-background rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Virtual Closet</h1>
            <p className="text-sm text-muted-foreground">Create and visualize outfit combinations</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector */}
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="appearance-none bg-background border rounded-md px-3 py-2 pr-8 text-sm"
              >
                {(templateOptions || []).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Layers className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>

            <Button variant="outline" size="sm" onClick={onToggleLock}>
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="sm" onClick={onCaptureSnapshot}>
              <Camera className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={onSaveLayout}>
              <Save className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={onResetLayout}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button variant="default" size="sm" className="lg:hidden" onClick={() => setIsMobileSidebarOpen(true)}>
              Show Items
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          <motion.div
            className={cn(
              "bg-background border-r flex flex-col overflow-hidden transition-all",
              "lg:relative lg:w-80",
              isMobileSidebarOpen ? "fixed inset-y-0 left-0 w-full md:w-80 z-40" : "hidden lg:flex",
            )}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
          >
            {/* Search */}
            <div className="p-3 border-b flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {searchQuery && (
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={handleClearSearch}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="lg:hidden">
                <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category filters */}
            <div className="p-2 border-b overflow-x-auto">
              <div className="flex gap-1 pb-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "ghost"}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-2">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading items...</p>
                  </div>
                ) : sidebarItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="font-medium">No items found</div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">Try adjusting your search or filters</p>
                    {searchQuery && (
                      <Button variant="ghost" size="sm" className="mt-3" onClick={handleClearSearch}>
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {sidebarItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.05 },
                        }}
                      >
                        <DraggableClosetItem
                          item={item}
                          onPlaceItem={onPlaceItem}
                          isPlaced={item.placed}
                          onRemoveItem={onRemoveItem}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Status */}
            <div className="p-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {(placedItems || []).length} / {(items || []).length} items placed
                </span>
                <span>{sidebarItems.length} items filtered</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 3D Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 bg-muted/30 relative transition-all duration-300 flex items-center justify-center",
            isDraggingOver && "bg-primary/10 border-2 border-dashed border-primary",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children}

          {/* Empty state - Compact notification */}
          <AnimatePresence>
            {showEmptyState && (
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="max-w-sm shadow-lg border-2 border-dashed border-primary/20">
                  <CardContent className="p-4 text-center relative">
                    {/* Dismiss button */}
                    <button
                      onClick={() => setShowEmptyState(false)}
                      className="absolute top-1 right-1 p-1 hover:bg-muted rounded-full transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Grid className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Virtual closet is empty</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Drag items from the sidebar to arrange your closet
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveCategory("all")
                        setIsMobileSidebarOpen(true)
                      }}
                      className="text-xs px-3 py-1 h-7"
                    >
                      Browse items
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lock indicator */}
          {isLocked && (
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm border">
              <Lock className="h-3 w-3" />
              <span>Canvas Locked</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
