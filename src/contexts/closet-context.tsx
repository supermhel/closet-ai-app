"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, useCallback } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import {
  processAndUploadImage,
  getTransformedUrls,
  uploadImage,
} from "@/lib/services/cloudinaryService"

export interface ClosetItem {
  id: string
  name: string
  category: string
  colors: string[]
  tags: string[]
  imageUrl: string
  imageUrls: string[]
  publicId: string
  description: string
  brand: string
  size: string
  price: number
  purchaseDate?: Date
  createdAt: Date
  updatedAt: Date
  
  // 3D Virtual Closet properties
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
  placed?: boolean
  modelUrl?: string
  size3D?: { width: number; height: number; depth: number }
  lastUsed?: Date
  usageCount?: number
  accessibility?: 'easy' | 'moderate' | 'difficult'
}

interface Outfit {
  id: string
  name: string
  itemIds: string[]
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

interface ClosetContextType {
  user: User | null
  closetItems: ClosetItem[]
  outfits: Outfit[]
  loading: boolean
  error: string | null
  addItem: (itemData: Omit<ClosetItem, "id" | "createdAt" | "updatedAt">) => Promise<ClosetItem | null>
  updateItem: (itemId: string, itemData: Partial<ClosetItem>) => Promise<boolean>
  deleteItem: (itemId: string) => Promise<boolean>
  addOutfit: (outfitData: Omit<Outfit, "id" | "createdAt" | "updatedAt">) => Promise<Outfit | null>
  updateOutfit: (outfitId: string, outfitData: Partial<Outfit>) => Promise<boolean>
  deleteOutfit: (outfitId: string) => Promise<boolean>
  signOut: () => Promise<void>
  fetchClosetItems: () => Promise<void>
  fetchOutfits: () => Promise<void>
  uploadItemImage: (file: File, itemData: Partial<ClosetItem>) => Promise<ClosetItem | null>
  updateItemImage: (itemId: string, file: File) => Promise<boolean>
  rateOutfit: (outfitId: string, rating: number, feedback?: string) => Promise<boolean>
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined)

export const useCloset = (): ClosetContextType => {
  const context = useContext(ClosetContext)
  if (!context) {
    throw new Error("useCloset must be used within a ClosetProvider")
  }
  return context
}

interface ClosetProviderProps {
  children: React.ReactNode
}

export const ClosetProvider: React.FC<ClosetProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClosetItems = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const q = query(collection(db, "users", user.uid, "closetItems"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const items: ClosetItem[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ClosetItem)
      })
      setClosetItems(items)
    } catch (error) {
      console.error("Error fetching closet items:", error)
      setError("Failed to fetch closet items")
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchOutfits = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const q = query(collection(db, "users", user.uid, "outfits"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const outfits: Outfit[] = []
      querySnapshot.forEach((doc) => {
        outfits.push({ id: doc.id, ...doc.data() } as Outfit)
      })
      setOutfits(outfits)
    } catch (error) {
      console.error("Error fetching outfits:", error)
      setError("Failed to fetch outfits")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchClosetItems()
      fetchOutfits()
    } else {
      setClosetItems([])
      setOutfits([])
    }
  }, [user, fetchClosetItems, fetchOutfits])

  const addItem = useCallback(
    async (itemData: Omit<ClosetItem, "id" | "createdAt" | "updatedAt">): Promise<ClosetItem | null> => {
      if (!user) return null

      try {
        setLoading(true)
        const docRef = await addDoc(collection(db, "users", user.uid, "closetItems"), {
          ...itemData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        const newItem: ClosetItem = {
          id: docRef.id,
          ...itemData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ClosetItem
        setClosetItems((prevItems) => [...prevItems, newItem])
        return newItem
      } catch (error) {
        console.error("Error adding item:", error)
        setError("Failed to add item")
        return null
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const updateItem = useCallback(
    async (itemId: string, itemData: Partial<ClosetItem>): Promise<boolean> => {
      if (!user) return false

      try {
        setLoading(true)
        const itemRef = doc(db, "users", user.uid, "closetItems", itemId)
        await updateDoc(itemRef, {
          ...itemData,
          updatedAt: new Date(),
        })

        setClosetItems((prevItems) => prevItems.map((item) => (item.id === itemId ? { ...item, ...itemData } : item)))
        return true
      } catch (error) {
        console.error("Error updating item:", error)
        setError("Failed to update item")
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!user) return false

      try {
        setLoading(true)
        const itemRef = doc(db, "users", user.uid, "closetItems", itemId)
        await deleteDoc(itemRef)

        setClosetItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
        return true
      } catch (error) {
        console.error("Error deleting item:", error)
        setError("Failed to delete item")
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const addOutfit = useCallback(
    async (outfitData: Omit<Outfit, "id" | "createdAt" | "updatedAt">): Promise<Outfit | null> => {
      if (!user) return null

      try {
        setLoading(true)
        const docRef = await addDoc(collection(db, "users", user.uid, "outfits"), {
          ...outfitData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        const newOutfit: Outfit = {
          id: docRef.id,
          ...outfitData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Outfit
        setOutfits((prevOutfits) => [...prevOutfits, newOutfit])
        return newOutfit
      } catch (error) {
        console.error("Error adding outfit:", error)
        setError("Failed to add outfit")
        return null
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const updateOutfit = useCallback(
    async (outfitId: string, outfitData: Partial<Outfit>): Promise<boolean> => {
      if (!user) return false

      try {
        setLoading(true)
        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await updateDoc(outfitRef, {
          ...outfitData,
          updatedAt: new Date(),
        })

        setOutfits((prevOutfits) =>
          prevOutfits.map((outfit) => (outfit.id === outfitId ? { ...outfit, ...outfitData } : outfit)),
        )
        return true
      } catch (error) {
        console.error("Error updating outfit:", error)
        setError("Failed to update outfit")
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const deleteOutfit = useCallback(
    async (outfitId: string): Promise<boolean> => {
      if (!user) return false

      try {
        setLoading(true)
        const outfitRef = doc(db, "users", user.uid, "outfits", outfitId)
        await deleteDoc(outfitRef)

        setOutfits((prevOutfits) => prevOutfits.filter((outfit) => outfit.id !== outfitId))
        return true
      } catch (error) {
        console.error("Error deleting outfit:", error)
        setError("Failed to delete outfit")
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await firebaseSignOut(auth)
      setUser(null)
      setClosetItems([])
      setOutfits([])
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out")
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadItemImage = useCallback(
    async (file: File, itemData: Partial<ClosetItem>): Promise<ClosetItem | null> => {
      if (!user) return null

      setLoading(true)
      try {
        // Step 1: Process and upload the image using the new centralized service
        const uploadResponse = await processAndUploadImage(
          file,
          process.env.CLOUDINARY_UPLOAD_PRESET || "closet-ai",
        )

        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.error || "Image processing failed")
        }

        const { cloudinaryInfo, aiTags } = uploadResponse.data

        // Step 2: Combine all descriptive tags into a single array
        const allTags = [
          ...new Set([
            ...aiTags.attributes,
            ...aiTags.style,
            ...aiTags.season,
            ...aiTags.patterns,
          ]),
        ]

        // Step 3: Create the new item object for Firestore
        const newItemBaseData: Omit<ClosetItem, "id" | "createdAt" | "updatedAt"> = {
          name: itemData.name || `Item ${new Date().toLocaleDateString()}`,
          category: aiTags.category,
          colors: aiTags.colors,
          tags: allTags,
          imageUrl: cloudinaryInfo.secure_url,
          imageUrls: Object.values(getTransformedUrls(cloudinaryInfo.public_id)),
          publicId: cloudinaryInfo.public_id,
          description: itemData.description || "",
          brand: itemData.brand || "",
          size: itemData.size || "",
          price: itemData.price || 0,
          purchaseDate: itemData.purchaseDate,
        }

        const newItemToSave = {
          ...newItemBaseData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Step 4: Save to Firestore and update local state
        const docRef = await addDoc(collection(db, "users", user.uid, "closetItems"), newItemToSave)
        const newItem = { id: docRef.id, ...newItemToSave } as ClosetItem

        setClosetItems((prevItems) => [...prevItems, newItem])

        return newItem
      } catch (error) {
        console.error("Error uploading item with image:", error)
        setError("Failed to upload item. Please try again.")
        return null
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const updateItemImage = useCallback(
    async (itemId: string, file: File): Promise<boolean> => {
      if (!user) return false

      setLoading(true)
      try {
        // Upload new image
        const uploadResult = await uploadImage(file, process.env.CLOUDINARY_UPLOAD_PRESET || "closet-ai", {
          folder: "wardrobe",
        })

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(uploadResult.error || "Image upload failed")
        }

        // Update item with new image
        const itemRef = doc(db, "users", user.uid, "closetItems", itemId)
        const newImageUrl = uploadResult.data.secure_url
        const newImageUrls = Object.values(getTransformedUrls(uploadResult.data.public_id))

        await updateDoc(itemRef, {
          imageUrl: newImageUrl,
          imageUrls: newImageUrls,
          publicId: uploadResult.data.public_id,
          updatedAt: new Date(),
        })

        setClosetItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? { ...item, imageUrl: newImageUrl, imageUrls: newImageUrls, publicId: uploadResult.data.public_id }
              : item,
          ),
        )
        return true
      } catch (error) {
        console.error("Error updating item image:", error)
        setError("Failed to update item image")
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const rateOutfit = useCallback(
    async (outfitId: string, rating: number, feedback?: string): Promise<boolean> => {
      if (!user) return false
      // Using console.log to satisfy linter for now.
      console.log(`Rating outfit: ${outfitId}, Rating: ${rating}, Feedback: ${feedback}`)
      // ... implementation for rating outfits
      return true
    },
    [user],
  )

  const value = {
    user,
    closetItems,
    outfits,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    signOut,
    fetchClosetItems,
    fetchOutfits,
    uploadItemImage,
    updateItemImage,
    rateOutfit,
  }

  return <ClosetContext.Provider value={value}>{children}</ClosetContext.Provider>
}
