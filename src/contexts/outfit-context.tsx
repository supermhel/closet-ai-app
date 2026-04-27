"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { collection, addDoc, deleteDoc, doc, query, onSnapshot, updateDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import type { ClosetItem } from "@/contexts/closet-context"

// Define types for our context
export interface Outfit {
  id: string
  name: string
  items: string[] // Array of item IDs
  itemsData?: ClosetItem[] // Optional full item data
  date?: Date
  occasion?: string
  weather?: string
  isFavorite?: boolean
  rating?: number
  createdAt: Date
  updatedAt?: Date
}

interface OutfitContextType {
  outfits: Outfit[]
  favoriteOutfits: Outfit[]
  loading: boolean
  error: string | null
  saveOutfit: (outfitData: Partial<Outfit>) => Promise<Outfit | null>
  updateOutfit: (outfitId: string, outfitData: Partial<Outfit>) => Promise<boolean>
  deleteOutfit: (outfitId: string) => Promise<boolean>
  toggleFavorite: (outfitId: string) => Promise<boolean>
  rateOutfit: (outfitId: string, rating: number) => Promise<boolean>
}

// Create the context
const OutfitContext = createContext<OutfitContextType | undefined>(undefined)

// Custom hook to use the context
export const useOutfit = () => {
  const context = useContext(OutfitContext)
  if (context === undefined) {
    throw new Error("useOutfit must be used within an OutfitProvider")
  }
  return context
}

// Provider component
export const OutfitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load outfits when user changes
  useEffect(() => {
    if (!user) {
      setOutfits([])
      setLoading(false)
      return
    }

    setLoading(true)
    const outfitsRef = collection(db, "users", user.uid, "outfits")
    const q = query(outfitsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const outfitData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate(),
          date: doc.data().date?.toDate(),
        })) as Outfit[]
        setOutfits(outfitData)
        setLoading(false)
      },
      (err) => {
        console.error("Error loading outfits:", err)
        setError("Failed to load outfits")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  // Save a new outfit
  const saveOutfit = useCallback(
    async (outfitData: Partial<Outfit>): Promise<Outfit | null> => {
      if (!user) return null

      try {
        const newOutfit = {
          name: outfitData.name || `Outfit ${new Date().toLocaleDateString()}`,
          items: outfitData.items || [],
          itemsData: outfitData.itemsData || [],
          date: outfitData.date,
          occasion: outfitData.occasion || "casual",
          weather: outfitData.weather,
          isFavorite: outfitData.isFavorite || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const docRef = await addDoc(collection(db, "users", user.uid, "outfits"), newOutfit)
        return { id: docRef.id, ...newOutfit }
      } catch (err) {
        console.error("Error saving outfit:", err)
        setError("Failed to save outfit")
        return null
      }
    },
    [user],
  )

  // Update an existing outfit
  const updateOutfit = useCallback(
    async (outfitId: string, outfitData: Partial<Outfit>): Promise<boolean> => {
      if (!user) return false

      try {
        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await updateDoc(outfitRef, {
          ...outfitData,
          updatedAt: new Date(),
        })
        return true
      } catch (err) {
        console.error("Error updating outfit:", err)
        setError("Failed to update outfit")
        return false
      }
    },
    [user],
  )

  // Delete an outfit
  const deleteOutfit = useCallback(
    async (outfitId: string): Promise<boolean> => {
      if (!user) return false

      try {
        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await deleteDoc(outfitRef)
        return true
      } catch (err) {
        console.error("Error deleting outfit:", err)
        setError("Failed to delete outfit")
        return false
      }
    },
    [user],
  )

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (outfitId: string): Promise<boolean> => {
      if (!user) return false

      try {
        const outfit = outfits.find((o) => o.id === outfitId)
        if (!outfit) return false

        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await updateDoc(outfitRef, {
          isFavorite: !outfit.isFavorite,
          updatedAt: new Date(),
        })
        return true
      } catch (err) {
        console.error("Error toggling favorite:", err)
        setError("Failed to update favorite status")
        return false
      }
    },
    [user, outfits],
  )

  // Rate an outfit
  const rateOutfit = useCallback(
    async (outfitId: string, rating: number): Promise<boolean> => {
      if (!user) return false
      if (rating < 1 || rating > 5) return false

      try {
        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await updateDoc(outfitRef, {
          rating,
          updatedAt: new Date(),
        })
        return true
      } catch (err) {
        console.error("Error rating outfit:", err)
        setError("Failed to rate outfit")
        return false
      }
    },
    [user],
  )

  // Compute favorite outfits
  const favoriteOutfits = outfits.filter((outfit) => outfit.isFavorite)

  const value = {
    outfits,
    favoriteOutfits,
    loading,
    error,
    saveOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    rateOutfit,
  }

  return <OutfitContext.Provider value={value}>{children}</OutfitContext.Provider>
}
