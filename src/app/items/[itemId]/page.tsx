"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "@/components/optimized-image"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { ArrowLeft, Edit, Trash2, Calendar, Tag, Package, Sparkles } from "lucide-react"
import Link from "next/link"
import { getColorName } from "@/utils/taxonomy"

interface ItemDetailPageProps {
  params: Promise<{
    itemId: string;
  }>;
}

interface ItemData {
  id: string;
  name: string;
  category: string;
  brand?: string;
  size?: string;
  price?: number;
  description?: string;
  colors?: string[];
  tags?: string[];
  seasons?: string[];
  occasions?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  analysis?: {
    category?: string;
    description?: string;
    tags?: string[];
    colors?: string[];
  };
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { itemId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchItem() {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const itemRef = doc(db, "users", user.uid, "closetItems", itemId)
        const itemSnapshot = await getDoc(itemRef)

        if (!itemSnapshot.exists()) {
          toast.error("Item not found")
          router.push("/items")
          return
        }

        const itemData = {
          id: itemSnapshot.id,
          ...itemSnapshot.data(),
          createdAt: itemSnapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: itemSnapshot.data().updatedAt?.toDate() || new Date(),
        } as ItemData

        setItem(itemData)
      } catch (error) {
        console.error("Error fetching item:", error)
        toast.error("Could not load item details")
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [user, itemId, router])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    if (!user) {
      toast.error("You must be logged in to delete items")
      return
    }

    setDeleting(true)
    try {
      await deleteDoc(doc(db, "users", user.uid, "closetItems", itemId))
      toast.success("Item deleted successfully")
      router.push("/items")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Item Details</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested item could not be found.</p>
          <Button asChild>
            <Link href="/items">Back to Items</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Back Button and Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/items">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{item.name}</h1>
              <p className="text-muted-foreground">
                Added on {item.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/items/${itemId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <Card>
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-md overflow-hidden">
                  {item.imageUrl ? (
                    <OptimizedImage
                      src={item.imageUrl}
                      alt={item.name}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Item Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{item.category}</p>
                    </div>
                    {item.brand && (
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium">{item.brand}</p>
                      </div>
                    )}
                    {item.size && (
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">{item.size}</p>
                      </div>
                    )}
                    {item.price !== undefined && item.price > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{item.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Colors */}
              {item.colors && item.colors.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {item.colors.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm">{getColorName(color)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seasons & Occasions */}
              <div className="grid grid-cols-2 gap-4">
                {item.seasons && item.seasons.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Seasons
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {item.seasons.map((season: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {season}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {item.occasions && item.occasions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Occasions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {item.occasions.map((occasion: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {occasion}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {item.analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.analysis.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Detected Category</p>
                      <p>{item.analysis.category}</p>
                    </div>
                  )}
                  {item.analysis.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">AI Description</p>
                      <p>{item.analysis.description}</p>
                    </div>
                  )}
                </div>

                {item.analysis.tags && item.analysis.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detected Attributes</p>
                    <div className="flex flex-wrap gap-2">
                      {item.analysis.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-primary/10">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.analysis.colors && item.analysis.colors.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detected Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {item.analysis.colors.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </ComponentErrorBoundary>
  )
} 