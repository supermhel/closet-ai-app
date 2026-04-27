"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Mail, Twitter, Facebook, Instagram, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { nanoid } from "nanoid"
import logger from "@/utils/logger"

interface OutfitShareModalProps {
  isOpen: boolean
  onClose: () => void
  outfit: any[]
  outfitId?: string
  outfitName?: string
}

export default function OutfitShareModal({
  isOpen,
  onClose,
  outfit,
  outfitId = null,
  outfitName = "My Outfit",
}: OutfitShareModalProps) {
  const { user } = useAuth()
  const [shareUrl, setShareUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && outfit) {
      generateShareableLink()
    }
  }, [isOpen, outfit])

  const generateShareableLink = async () => {
    if (!outfit || !user) return

    try {
      setIsGenerating(true)

      const shareId = outfitId || nanoid(10)

      const shareableOutfit = {
        id: shareId,
        name: outfitName,
        items: outfit.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          imageUrl: item.imageUrl,
          colors: item.colors || [],
          description: item.description || "",
        })),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      await setDoc(doc(db, "sharedOutfits", shareId), shareableOutfit)

      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/shared-outfit/${shareId}`
      setShareUrl(shareUrl)

      logger.info("Generated shareable outfit link", { shareId })
    } catch (error) {
      logger.error("Failed to generate shareable link", { error: error.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error("Failed to copy to clipboard", { error: error.message })
    }
  }

  const shareViaEmail = () => {
    if (!emailRecipient) return

    const subject = encodeURIComponent(`Check out my outfit: ${outfitName}`)
    const body = encodeURIComponent(`I wanted to share this outfit with you: ${shareUrl}`)
    window.open(`mailto:${emailRecipient}?subject=${subject}&body=${body}`)
  }

  const shareViaSocial = (platform: string) => {
    let shareLink
    const text = encodeURIComponent(`Check out my outfit: ${outfitName}`)

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`
        break
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "instagram":
        copyToClipboard()
        return
      default:
        return
    }

    window.open(shareLink, "_blank")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50">
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <Button variant="ghost" size="sm" className="absolute top-3 right-3" onClick={onClose}>
          <X size={18} />
        </Button>

        <h2 className="text-2xl font-bold mb-4">Share Your Outfit</h2>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" placeholder="Generating link..." />
              <Button onClick={copyToClipboard} disabled={!shareUrl || isGenerating} variant="outline">
                {copied ? "Copied!" : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">This link will expire in 30 days</p>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Input
              type="email"
              placeholder="Recipient's email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
            />
            <Button onClick={shareViaEmail} disabled={!shareUrl || isGenerating || !emailRecipient} className="w-full">
              <Mail size={16} className="mr-2" />
              Send Email
            </Button>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => shareViaSocial("twitter")}
                disabled={!shareUrl || isGenerating}
                variant="outline"
                className="flex flex-col items-center py-4"
              >
                <Twitter size={24} className="mb-2" />
                <span>Twitter</span>
              </Button>
              <Button
                onClick={() => shareViaSocial("facebook")}
                disabled={!shareUrl || isGenerating}
                variant="outline"
                className="flex flex-col items-center py-4"
              >
                <Facebook size={24} className="mb-2" />
                <span>Facebook</span>
              </Button>
              <Button
                onClick={() => shareViaSocial("instagram")}
                disabled={!shareUrl || isGenerating}
                variant="outline"
                className="flex flex-col items-center py-4"
              >
                <Instagram size={24} className="mb-2" />
                <span>Instagram</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
