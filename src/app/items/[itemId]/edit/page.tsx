"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { toast } from "@/hooks/use-toast"
import ItemForm from "@/components/items/ItemForm"
import { ItemFormData } from "@/utils/types"

interface ItemEditPageProps {
  params: Promise<{
    itemId: string;
  }>;
}

export default function ItemEditPage({ params }: ItemEditPageProps) {
  // Unwrap params using React.use()
  const { itemId } = use(params);
  
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialData, setInitialData] = useState<ItemFormData | null>(null)

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

        const itemData = itemSnapshot.data();
        
        // Initialize form data with item data
        setInitialData({
          name: itemData.name || "",
          category: itemData.category || "",
          brand: itemData.brand || "",
          size: itemData.size || "",
          price: itemData.price ? String(itemData.price) : "",
          description: itemData.description || "",
          colors: itemData.colors || [],
          tags: itemData.tags || [],
          seasons: itemData.seasons || [],
          occasions: itemData.occasions || [],
          fit: itemData.fit || "Regular", // Add the fit property
          imageUrl: itemData.imageUrl || ""
        })
      } catch (error) {
        console.error("Error fetching item:", error)
        toast.error("Could not load item details")
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [user, itemId, router])

  const handleSubmit = async (formData: ItemFormData) => {
    if (!user) {
      toast.error("You must be logged in to edit items")
      router.push("/login")
      return
    }

    setSaving(true)
    
    try {
      const itemRef = doc(db, "users", user.uid, "closetItems", itemId)
      
      // Update the item in Firestore
      await updateDoc(itemRef, {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        updatedAt: new Date()
      })
      
      toast.success("Item updated successfully")
      router.push(`/items/${itemId}`)
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error("Failed to update item")
      setSaving(false)
    }
  }

  if (loading || !initialData) {
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

  return (
    <ComponentErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <ItemForm 
          initialData={initialData}
          onSubmit={handleSubmit}
          isEdit={true}
          isProcessing={saving}
        />
      </div>
    </ComponentErrorBoundary>
  )
} 