"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, Heart, User, Clock } from "lucide-react"
import Link from "next/link"
import OutfitCard from "@/components/outfit/OutfitCard"

export default function SharedOutfitPage() {
  const params = useParams()
  const shareId = params?.shareId as string
  const [outfit, setOutfit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSharedOutfit() {
      try {
        const outfitDoc = await getDoc(doc(db, "sharedOutfits", shareId))

        if (!outfitDoc.exists()) {
          setError("Outfit not found or has expired")
          return
        }

        const outfitData = outfitDoc.data()

        // Check if outfit has expired
        if (outfitData.expiresAt && new Date(outfitData.expiresAt) < new Date()) {
          setError("This shared outfit has expired")
          return
        }

        setOutfit({ id: outfitDoc.id, ...outfitData })
      } catch (err) {
        console.error("Error fetching shared outfit:", err)
        setError("Failed to load outfit")
      } finally {
        setLoading(false)
      }
    }

    if (shareId) {
      fetchSharedOutfit()
    }
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Shared Outfit</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-4">
              <Share2 className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Oops!</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{outfit.name}</h1>
          <p className="text-muted-foreground">Shared outfit from ClosetAI</p>
        </div>

        {/* Outfit Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Shared Outfit
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  Shared by User
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(outfit.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {outfit.items.map((item, index) => (
                <OutfitCard key={item.id} item={item} index={index} />
              ))}
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">Like this outfit? Create your own with ClosetAI!</p>
              <div className="flex gap-2 justify-center">
                <Link href="/signup">
                  <Button>
                    <Heart className="h-4 w-4 mr-2" />
                    Get ClosetAI
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Learn More</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Promotion */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Create Your Own Outfits</h3>
            <p className="text-muted-foreground mb-4">
              Join ClosetAI to organize your wardrobe, get AI-powered outfit suggestions, and share your style with
              friends.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/signup">
                <Button size="lg">Sign Up Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
