"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { toast } from "@/hooks/use-toast"
import logger from "@/utils/logger"
import ItemForm, { ItemFormData } from "@/components/items/ItemForm"

export default function AddItemPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (formData: ItemFormData) => {
    if (!user) {
      toast.error("You must be logged in to add items")
      router.push("/login")
      return
    }

    setProcessing(true)
    
    try {
      // Create a new item document in Firestore
      const itemData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "users", user.uid, "closetItems"), itemData)

      toast.success("Item added successfully")
      router.push(`/items/${docRef.id}`)
    } catch (error) {
      logger.error("Error adding item:", error)
      toast.error("Failed to add item")
      setProcessing(false)
    }
  }

  return (
    <ComponentErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <ItemForm 
          onSubmit={handleSubmit}
          isProcessing={processing}
        />
      </div>
    </ComponentErrorBoundary>
  )
}
