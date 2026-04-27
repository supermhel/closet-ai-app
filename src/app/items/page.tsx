"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Grid3X3, List, Eye, Edit, Trash2, Filter, SortAsc, Package } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { OptimizedImage } from "@/components/optimized-image"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
}

// Item Card Component
function ItemCard({ item, viewMode, onView, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return

    setIsDeleting(true)
    try {
      await onDelete(item.id)
    } finally {
      setIsDeleting(false)
    }
  }

  if (viewMode === "list") {
    return (
      <motion.div
        variants={itemVariants}
        className="flex items-center space-x-4 p-4 bg-background border rounded-lg hover:shadow-md transition-all duration-200"
      >
        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <OptimizedImage
              src={item.imageUrl}
              alt={item.name}
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.category}</p>
          <div className="flex items-center space-x-2 mt-1">
            {item.colors && item.colors.length > 0 && (
              <div className="flex items-center space-x-1">
                {item.colors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {item.colors.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{item.colors.length - 3}</span>
                )}
              </div>
            )}
            {item.brand && (
              <Badge variant="outline" className="text-xs">
                {item.brand}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={itemVariants}
      className="group bg-background border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {item.imageUrl ? (
          <OptimizedImage
            src={item.imageUrl}
            alt={item.name}
            width={400}
            height={400}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <Button size="sm" variant="secondary" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.category}</p>
        <div className="flex items-center justify-between mt-2">
          {item.colors && item.colors.length > 0 && (
            <div className="flex items-center space-x-1">
              {item.colors.slice(0, 2).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
              {item.colors.length > 2 && (
                <span className="text-xs text-muted-foreground">+{item.colors.length - 2}</span>
              )}
            </div>
          )}
          {item.brand && (
            <Badge variant="outline" className="text-xs">
              {item.brand}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Filter Panel Component
function FilterPanel({ categories, colors, brands, filters, onFilterChange, onClearFilters }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </h3>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        </div>

        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={filters.category} onValueChange={(value) => onFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Brand</label>
            <Select value={filters.brand} onValueChange={(value) => onFilterChange("brand", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Colors</label>
            <div className="grid grid-cols-4 gap-2">
              {colors.slice(0, 8).map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${
                    filters.colors.includes(color) ? "border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    const newColors = filters.colors.includes(color)
                      ? filters.colors.filter((c) => c !== color)
                      : [...filters.colors, color]
                    onFilterChange("colors", newColors)
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ItemsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [sortBy, setSortBy] = useState("newest")
  const [filters, setFilters] = useState({
    category: "all",
    brand: "all",
    colors: [],
  })

  // Fetch items
  useEffect(() => {
    async function fetchItems() {
      if (!user) return

      try {
        const itemsRef = collection(db, "users", user.uid, "closetItems")
        const q = query(itemsRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)

        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))

        setItems(itemsData)
        setFilteredItems(itemsData)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast.error("Failed to load your items")
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [user, toast])

  // Filter and sort items
  useEffect(() => {
    let filtered = items

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((item) => item.category === filters.category)
    }

    // Brand filter
    if (filters.brand !== "all") {
      filtered = filtered.filter((item) => item.brand === filters.brand)
    }

    // Color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter((item) => item.colors && item.colors.some((color) => filters.colors.includes(color)))
    }

    // Sort items
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case "oldest":
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "category":
        filtered.sort((a, b) => a.category.localeCompare(b.category))
        break
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, filters, sortBy])

  // Get unique values for filters
  const categories = [...new Set(items.map((item) => item.category))].filter(Boolean)
  const brands = [...new Set(items.map((item) => item.brand))].filter(Boolean)
  const colors = [...new Set(items.flatMap((item) => item.colors || []))].filter(Boolean)

  const handleView = (item) => {
    router.push(`/items/${item.id}`)
  }

  const handleEdit = (item) => {
    router.push(`/items/${item.id}/edit`)
  }

  const handleDelete = async (itemId) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "closetItems", itemId))
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success("Item deleted successfully")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: "all",
      brand: "all",
      colors: [],
    })
    setSearchTerm("")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Your Items</h2>
          <p className="text-muted-foreground">Organizing your wardrobe...</p>
        </div>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-8">
            <motion.div variants={itemVariants}>
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center">
                    <Package className="h-8 w-8 mr-3" />
                    My Items
                  </h1>
                  <p className="text-muted-foreground text-lg">Manage and organize your wardrobe collection</p>
                </div>
                <Button asChild className="gap-2 mt-4 md:mt-0">
                  <Link href="/items/add">
                    <Plus className="h-4 w-4" />
                    Add New Item
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Search and Controls */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items by name, category, brand..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <FilterPanel
                categories={categories}
                colors={colors}
                brands={brands}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />

              {/* Stats */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Collection Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories:</span>
                      <span className="font-medium">{categories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brands:</span>
                      <span className="font-medium">{brands.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filtered:</span>
                      <span className="font-medium">{filteredItems.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Items Grid/List */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              {filteredItems.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-4"
                    }
                  >
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {items.length === 0 ? "No items in your closet yet" : "No items match your filters"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {items.length === 0
                        ? "Start building your digital wardrobe by adding your first item"
                        : "Try adjusting your search or filter criteria"}
                    </p>
                    {items.length === 0 ? (
                      <Button asChild>
                        <Link href="/items/add">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Item
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}
