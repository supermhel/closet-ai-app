"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Heart, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion } from "framer-motion"

interface OutfitRatingProps {
  outfitId: string
  outfitName: string
  initialRating?: number
  initialFeedback?: string
  onRatingSubmit: (rating: number, feedback: string) => Promise<void>
  className?: string
}

export function OutfitRating({
  outfitId,
  outfitName,
  initialRating = 0,
  initialFeedback = "",
  onRatingSubmit,
  className = "",
}: OutfitRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return

    setSubmitting(true)
    try {
      await onRatingSubmit(rating, feedback)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    } catch (error) {
      console.error("Failed to submit rating:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (value: number) => {
    const texts = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    }
    return texts[value as keyof typeof texts] || ""
  }

  const getRatingColor = (value: number) => {
    if (value <= 2) return "text-red-500"
    if (value === 3) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Rate This Outfit
        </CardTitle>
        <p className="text-sm text-muted-foreground">{outfitName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Overall Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            ))}
            {(hoverRating || rating) > 0 && (
              <span className={`ml-2 text-sm font-medium ${getRatingColor(hoverRating || rating)}`}>
                {getRatingText(hoverRating || rating)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Rating Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Rating</label>
          <div className="flex gap-2">
            <Button
              variant={rating === 5 ? "default" : "outline"}
              size="sm"
              onClick={() => setRating(5)}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="h-4 w-4" />
              Love It
            </Button>
            <Button
              variant={rating === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => setRating(3)}
              className="flex items-center gap-1"
            >
              <Heart className="h-4 w-4" />
              It's OK
            </Button>
            <Button
              variant={rating === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setRating(1)}
              className="flex items-center gap-1"
            >
              <ThumbsDown className="h-4 w-4" />
              Not For Me
            </Button>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Feedback (Optional)</label>
          <Textarea
            placeholder="What did you like or dislike about this outfit? Your feedback helps improve future recommendations."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={rating === 0 || submitting || submitted} className="w-full">
          {submitting ? "Submitting..." : submitted ? "Rating Submitted!" : "Submit Rating"}
        </Button>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-green-600"
          >
            Thank you for your feedback! This helps us improve your recommendations.
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
