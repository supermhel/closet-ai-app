"use client"

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import * as virtualClosetService from "@/lib/services/virtualClosetService"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, BarChart2, ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { VirtualClosetLoading } from "@/components/page-loading"
import logger from "@/utils/logger"

import { ClosetItem, VirtualClosetLayout, ClosetStats } from "@/types/virtual-closet"

// Lazy load heavy 3D components
const ClosetLayoutComponent = lazy(() => import("@/components/virtual-closet/virtual-closet-layout"))
const DynamicClosetViewer = lazy(() => import("@/components/virtual-closet/dynamic-closet-viewer"))
const ClosetAnalyticsPanel = lazy(() => import("@/components/virtual-closet/closet-analytics-panel"))

// Type definition for filters
interface ActiveFilters {
  categories: string[]
  colors: string[]
  seasons: string[]
  favorites: boolean
}

// The main component for the Virtual Closet page
export default function VirtualClosetPage() {
  const { user } = useAuth()

  // Core state
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("closet-template1")
  const [savedLayouts, setSavedLayouts] = useState<VirtualClosetLayout[]>([])

  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // Filtering and Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    categories: [],
    colors: [],
    seasons: [],
    favorites: false,
  })

  // Data state
  const [closetStats, setClosetStats] = useState<ClosetStats | null>(null)

  // Template options
  const templateOptions = useMemo(
    () => [
      { id: "closet-template", name: "Modern Room", type: "Standard" },
      { id: "closet-template1", name: "Walk-in Closet", type: "Spacious", isNew: true },
      { id: "closet-template2", name: "Compact Closet", type: "Efficient" },
      { id: "closet-template3", name: "Boutique Style", type: "Elegant" },
      { id: "closet-template4", name: "Minimalist Wardrobe", type: "Sleek" },
      { id: "closet-template5", name: "Open Concept", type: "Airy" },
      { id: "closet-template6", name: "Luxury Dressing Room", type: "Grand", isNew: true },
      { id: "closet-template7", name: "Vintage Armoire", type: "Classic" },
    ],
    [],
  )

  // Calculate closet statistics
  const calculateClosetStats = useCallback((items: ClosetItem[]): ClosetStats => {
    const placedItems = items.filter((item) => item.placed)

    const categoryDistribution = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colorDistribution = items.reduce(
      (acc, item) => {
        item.colors?.forEach((color) => {
          acc[color] = (acc[color] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const seasonalDistribution = items.reduce(
      (acc, item) => {
        item.seasons?.forEach((season) => {
          acc[season] = (acc[season] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const mostCommonCategory =
      Object.entries(categoryDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    const mostCommonColor =
      Object.entries(colorDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    return {
      totalItems: items.length,
      placedItems: placedItems.length,
      mostCommonColor,
      mostCommonCategory,
      categoryDistribution,
      colorDistribution,
      seasonalDistribution,
    }
  }, [])

  // Load closet items from Firebase
  useEffect(() => {
    if (!user) {
      setClosetItems([])
      return
    }

    setIsLoading(true)
    const unsubscribe = virtualClosetService.listenToClosetItems(user.uid, (items) => {
      // Transform items for 3D environment with default positions and models
      const itemsWithDefaults = virtualClosetService.transformItemsFor3D(items)
      setClosetItems(itemsWithDefaults)
      setClosetStats(calculateClosetStats(itemsWithDefaults))
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user, calculateClosetStats])

  // Load saved layouts from Firebase
  useEffect(() => {
    if (!user) {
      setSavedLayouts([])
      return
    }

    const unsubscribe = virtualClosetService.listenToVirtualClosetLayouts(user.uid, (layouts) => {
      setSavedLayouts(layouts)
    })

    return () => unsubscribe()
  }, [user])

  // Memoized derived state for placed items
  const placedItems = useMemo(() => {
    return closetItems.filter((item) => item.placed)
  }, [closetItems])

  // Memoized filtered items for sidebar (only unplaced items)
  const filteredItems = useMemo(() => {
    return closetItems.filter((item) => {
      // Only show unplaced items in sidebar
      if (item.placed) return false

      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        activeFilters.categories.length === 0 || activeFilters.categories.includes(item.category)

      const matchesColor =
        activeFilters.colors.length === 0 ||
        (item.colors && activeFilters.colors.some((color) => item.colors!.includes(color)))

      const matchesSeason =
        activeFilters.seasons.length === 0 ||
        (item.seasons && activeFilters.seasons.some((season) => item.seasons!.includes(season)))

      return matchesSearch && matchesCategory && matchesColor && matchesSeason
    })
  }, [closetItems, searchQuery, activeFilters])

  // Handle placing an item
  const handlePlaceItem = useCallback(
    async (item: ClosetItem, position?: { x: number; y: number; z: number }) => {
      if (!user || isLocked) return
      
      const finalPosition = position || virtualClosetService.getDefaultPosition(closetItems.length)
      
      try {
        await virtualClosetService.updateItemPosition(
          user.uid, 
          item.id, 
          finalPosition,
          { x: 0, y: 0, z: 0 }, // default rotation
          { x: 1, y: 1, z: 1 }  // default scale
        )
        toast.success(`${item.name} has been placed in the closet.`)
      } catch (error) {
        logger.error("Error placing item:", { error })
        toast.error("Could not place item. Please try again.")
      }
    },
    [user, isLocked, toast, closetItems.length],
  )

  // Handle removing an item
  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      if (!user || isLocked) return

      try {
        await virtualClosetService.toggleItemPlacement(user.uid, itemId, false)
        if (selectedItem?.id === itemId) {
          setSelectedItem(null)
        }
        toast.success("The item has been returned to your inventory.")
      } catch (error) {
        logger.error("Error removing item:", { error })
        toast.error("Could not remove item. Please try again.")
      }
    },
    [user, isLocked, toast, selectedItem],
  )

  // Handle updating an item's properties (e.g., position, rotation)
  const handleItemUpdate = useCallback(
    async (itemId: string, updates: Partial<ClosetItem>) => {
      if (!user || isLocked) return
      try {
        await virtualClosetService.updateClosetItem(user.uid, itemId, updates)
      } catch (error) {
        logger.error("Error updating item:", { error })
        toast.error("Could not update item properties. Please try again.")
      }
    },
    [user, isLocked, toast],
  )

  // Handle saving the current layout
  const handleSaveLayout = useCallback(async () => {
    if (!user) return
    const name = prompt("Enter a name for your layout:")
    if (!name) {
      toast.error("You must provide a name to save the layout.")
      return
    }

    setIsSaving(true)
    try {
      const layoutData = {
        name,
        templateId: selectedTemplate,
        createdAt: new Date(),
        itemPositions: placedItems.map((item) => ({
          itemId: item.id,
          position: item.position!,
          rotation: item.rotation!,
          scale: item.scale!,
        })),
      }
      await virtualClosetService.saveVirtualClosetLayout(user.uid, layoutData)
      toast.success(`Your layout "${name}" has been saved successfully.`)
    } catch (error) {
      logger.error("Error saving layout:", { error })
      toast.error("Failed to save layout. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [user, selectedTemplate, placedItems, toast])

  // Handle resetting the layout
  const handleResetLayout = useCallback(async () => {
    if (!user || isLocked) return
    try {
      await virtualClosetService.resetVirtualClosetLayout(user.uid)
      toast.success("All items have been returned to your inventory.")
    } catch (error) {
      logger.error("Error resetting layout:", { error })
      toast.error("Could not reset layout. Please try again.")
    }
  }, [user, isLocked, toast])

  // Handle template selection
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      const template = templateOptions.find((t) => t.id === templateId)
      setSelectedTemplate(templateId)
      toast.success(`Switched to ${template?.name || templateId}`)
    },
    [templateOptions, toast],
  )

  // Handle capturing a snapshot of the closet
  const handleCaptureSnapshot = useCallback(() => {
    const event = new CustomEvent("capture-snapshot")
    window.dispatchEvent(event)
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">You must be logged in to view your Virtual Closet.</p>
            <div className="flex justify-center gap-4">
              <Link href="/login" passHref>
                <Button>Login</Button>
              </Link>
              <Link href="/signup" passHref>
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Package />
                  Virtual Closet
                </h1>
                <p className="text-sm text-muted-foreground">
                  Design your space. Curate your style.
                  {isLocked && <Badge className="ml-2">Locked</Badge>}
                  {isSaving && <Badge variant="secondary" className="ml-2">Saving...</Badge>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={handleCaptureSnapshot}>Capture</Button>
              <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)}>
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button onClick={() => setIsLocked(!isLocked)}>{isLocked ? "Unlock" : "Lock"}</Button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <Suspense fallback={<VirtualClosetLoading />}>
              <ClosetLayoutComponent
                filteredItems={filteredItems}
                templateOptions={templateOptions}
                selectedTemplate={selectedTemplate}
                onTemplateChange={handleTemplateChange}
                onSaveLayout={handleSaveLayout}
                onResetLayout={handleResetLayout}
                isLoading={isLoading || isSaving}
                isLocked={isLocked}
                onToggleLock={() => setIsLocked(!isLocked)}
                onFilterChange={setActiveFilters}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }
                >
                  <DynamicClosetViewer
                    items={placedItems}
                    template={selectedTemplate}
                    isLocked={isLocked}
                    onItemUpdate={handleItemUpdate}
                    onItemSelect={setSelectedItem}
                    onItemRemove={handleRemoveItem}
                  />
                </Suspense>
              </ClosetLayoutComponent>
            </Suspense>
          </main>
        </div>

        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-96 border-l bg-background p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Closet Analytics</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAnalytics(false)}>X</Button>
              </div>

              {closetStats ? (
                <ClosetAnalyticsPanel stats={closetStats} items={closetItems} />
              ) : (
                <p>No stats to display.</p>
              )}

              <hr className="my-4" />

              <h3 className="text-md font-semibold mb-2">Saved Layouts</h3>
              {savedLayouts.length > 0 ? (
                <ul>
                  {savedLayouts.map((layout) => (
                    <li key={layout.id} className="text-sm">{layout.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No saved layouts yet.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div className="bg-background p-8 rounded-lg">
                <h2 className="text-lg font-semibold">Welcome to the Virtual Closet!</h2>
                <Button onClick={() => setShowTutorial(false)}>Got it!</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ComponentErrorBoundary>
  )
}
