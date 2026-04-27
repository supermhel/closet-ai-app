"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, HelpCircle, Check, Info, Lightbulb, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const tutorialSteps = [
  {
    title: "Welcome to Virtual Closet",
    description: "Let's learn how to organize your clothes in 3D space and create stunning outfit combinations.",
    detailedContent:
      "The Virtual Closet lets you visualize your wardrobe in 3D space, helping you plan outfits and organize your clothing items. This tutorial will guide you through the main features.",
    icon: <Sparkles className="text-primary" size={24} />,
    target: null,
    tips: ["You can exit this tutorial at any time", "Your progress will be saved automatically"],
  },
  {
    title: "Browse Your Items",
    description: "Find items in the sidebar and drag them to the canvas to start building your outfit.",
    detailedContent:
      "The sidebar contains all your clothing items organized by category. You can search for specific items or filter by category to find exactly what you're looking for.",
    icon: <Info className="text-info" size={24} />,
    target: ".sidebar-items",
    tips: ["Use the search bar to find specific items", "Filter by category using the tabs above"],
  },
  {
    title: "Position Your Items",
    description: "Drag items in 3D space to arrange them exactly how you want.",
    detailedContent:
      "Click and drag to move items around the canvas. You can also rotate items by using the rotation handles that appear when you select an item. Create layered looks by arranging items in front of or behind each other.",
    icon: <Zap className="text-warning" size={24} />,
    target: ".canvas-container",
    tips: ["Hold Shift while dragging to constrain movement", "Use the scroll wheel to zoom in and out"],
  },
  {
    title: "Customize Your View",
    description: "Change the background, lighting, and camera angle to perfect your outfit visualization.",
    detailedContent:
      "The Virtual Closet offers various customization options to help you visualize your outfits in different settings. Change the background to match different occasions or adjust the lighting to see how colors appear in different environments.",
    icon: <Lightbulb className="text-accent" size={24} />,
    target: ".template-selector",
    tips: ["Try different templates for various occasions", "Lighting affects how colors appear"],
  },
  {
    title: "Save Your Layout",
    description: "Don't forget to save your layout when you're done to access it later.",
    detailedContent:
      "Saving your layout preserves the position of all items and your customization settings. You can create multiple layouts for different outfits and occasions, making it easy to plan your wardrobe in advance.",
    icon: <Check className="text-success" size={24} />,
    target: ".save-button",
    tips: ["Layouts are saved to your account", "You can share layouts with friends"],
  },
]

interface ClosetTutorialProps {
  onComplete: () => void
  isFirstVisit: boolean
}

export default function ClosetTutorial({ onComplete, isFirstVisit }: ClosetTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [show, setShow] = useState(isFirstVisit)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)

  const currentStepData = tutorialSteps[currentStep]

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setCurrentTip(0)
    } else {
      setShow(false)
      if (onComplete) onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setCurrentTip(0)
    }
  }

  const skipTutorial = () => {
    setShow(false)
    if (onComplete) onComplete()
  }

  // Rotate through tips every 5 seconds
  useEffect(() => {
    if (!show || !currentStepData.tips || currentStepData.tips.length <= 1) return

    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % currentStepData.tips.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [show, currentStep, currentStepData.tips])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    {currentStepData.icon || <HelpCircle className="text-primary" size={20} />}
                  </div>
                  <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={skipTutorial}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <p className="text-muted-foreground mb-3">{currentStepData.description}</p>

                {/* Tip carousel */}
                {currentStepData.tips && currentStepData.tips.length > 0 && (
                  <motion.div
                    className="bg-muted rounded-lg p-3 mt-3 flex items-start gap-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`tip-${currentStep}-${currentTip}`}
                  >
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Tip:</p>
                      <p className="text-sm text-muted-foreground">{currentStepData.tips[currentTip]}</p>
                    </div>
                  </motion.div>
                )}

                <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setShowDetailModal(true)}>
                  <Info className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-1.5">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-2 rounded-full cursor-pointer ${
                        index === currentStep ? "bg-primary w-4" : "bg-muted w-2"
                      }`}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setCurrentStep(index)}
                    />
                  ))}
                </div>

                <Button
                  variant={currentStep === tutorialSteps.length - 1 ? "default" : "secondary"}
                  size="sm"
                  onClick={nextStep}
                >
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                  {currentStep < tutorialSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
