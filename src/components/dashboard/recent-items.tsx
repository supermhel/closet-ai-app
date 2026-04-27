"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shirt, Plus, ArrowRight, Box } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

// Type definitions
interface ClosetItem {
  id: string
  name: string
  category: string
  imageUrl?: string
  createdAt: Date
}

export default function RecentItems() {
  const { user } = useAuth()
  const [items, setItems] = useState<ClosetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function fetchRecentItems() {
      if (!user) return

      try {
        const itemsRef = collection(db, "users", user.uid, "closetItems")
        const q = query(itemsRef, orderBy("createdAt", "desc"), limit(9))
        const snapshot = await getDocs(q)

        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ClosetItem[]

        setItems(itemsData)
      } catch (error) {
        console.error("Error fetching recent items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentItems()
  }, [user])

  // Filter items by category based on active tab
  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true
    return item.category.toLowerCase() === activeTab.toLowerCase()
  })

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <CardContent className="p-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tops">Tops</TabsTrigger>
          <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
          <TabsTrigger value="shoes">Shoes</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {filteredItems.map((item) => (
                <Link href={`/closet/${item.id}`} key={item.id} className="group">
                  <Card className="overflow-hidden transition-all hover:ring-2 hover:ring-primary">
                    <div className="aspect-square bg-gray-100 relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "all"
                  ? "Add items to your closet to see them here"
                  : `No ${activeTab} found in your closet`}
              </p>
              <Button asChild>
                <Link href="/closet/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/closet">
            View Full Closet
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
