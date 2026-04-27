"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Transition } from "framer-motion"
import { toast } from "sonner"
import type { StylePreferences } from "@/contexts/profile-context"
import { 
  STYLES,
  COLORS, 
  PATTERNS, 
  OCCASIONS, 
  BRANDS, 
  SIZES,
  MATERIALS,
  FITS,
} from "@/utils/taxonomy"

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
}

const pageTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
}

interface StyleOption {
  id: string
  label: string
  description: string
  color?: string
}

// Helper to convert string array to StyleOption array
const toStyleOptions = (items: string[], descriptionPrefix = ""): StyleOption[] => {
  return items.map(item => ({
    id: item.toLowerCase().replace(/\\s+/g, ''),
    label: item,
    description: `${descriptionPrefix} ${item}`.trim()
  }));
};

interface StyleQuizSection {
  title: string
  questions: {
    key: keyof StylePreferences
    question: string
    description: string
    options: StyleOption[]
    multiSelect: boolean
  }[]
}

// Restructured quiz sections
const QUIZ_SECTIONS: StyleQuizSection[] = [
  {
    title: "Style & Colors",
    questions: [
      {
        key: "personalStyle",
        question: "What's your personal style?",
        description: "Choose the styles that best describe your fashion preferences",
        options: toStyleOptions(STYLES, "Style:"),
        multiSelect: true
      },
      {
        key: "colorPreferences",
        question: "What colors do you prefer?",
        description: "Select your favorite color palettes",
        options: toStyleOptions(COLORS, "Color:"),
        multiSelect: true
      }
    ]
  },
  {
    title: "Patterns & Fabrics",
    questions: [
      {
        key: "patterns",
        question: "What patterns do you like?",
        description: "Select your preferred patterns",
        options: toStyleOptions(PATTERNS, "Pattern:"),
        multiSelect: true
      },
      {
        key: "fabricPreferences",
        question: "What fabrics do you prefer?",
        description: "Choose your favorite materials",
        options: toStyleOptions(MATERIALS, "Fabric:"),
        multiSelect: true
      }
    ]
  },
  {
    title: "Brands & Occasions",
    questions: [
      {
        key: "favoriteBrands",
        question: "What brands do you prefer?",
        description: "Select your favorite clothing brands",
        options: toStyleOptions(BRANDS.slice(1), "Brand:"), // Exclude "No Brand"
        multiSelect: true
      },
      {
        key: "occasionWear",
        question: "What's your occasion style?",
        description: "Choose your preferred special occasion wear",
        options: toStyleOptions(OCCASIONS, "Occasion:"),
        multiSelect: true
      }
    ]
  },
  {
    title: "Size & Fit",
    questions: [
      {
        key: "sizePreference",
        question: "What's your typical size?",
        description: "Select your usual clothing size",
        options: toStyleOptions(SIZES, "Size:"),
        multiSelect: false
      },
      {
        key: "fitPreferences",
        question: "How do you like your clothes to fit?",
        description: "Choose your preferred fit style",
        options: toStyleOptions(FITS, "Fit:"),
        multiSelect: false
      }
    ]
  }
]

interface StyleQuizStepProps {
  data?: Partial<StylePreferences>
  onComplete: (stylePreferences: Partial<StylePreferences>) => void
  onPrevious: () => void
}

export function StyleQuizStep({ data, onComplete, onPrevious }: StyleQuizStepProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [selections, setSelections] = useState<Partial<StylePreferences>>(data || {})

  const progress = ((currentSection + 1) / QUIZ_SECTIONS.length) * 100

  const handleNext = () => {
    if (currentSection < QUIZ_SECTIONS.length - 1) {
      setCurrentSection(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
      window.scrollTo(0, 0)
    } else {
      onPrevious()
    }
  }

  const handleSkip = () => {
    toast.info("You can always update your style preferences later in your profile settings")
    onComplete({})
  }

  const toggleOption = (questionKey: keyof StylePreferences, optionId: string, multiSelect: boolean) => {
    setSelections(prev => {
      const current = prev[questionKey] as string[] || []
      let updated: string[]

      if (multiSelect) {
        updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      } else {
        updated = [optionId]
      }

      return {
        ...prev,
        [questionKey]: updated
      }
    })
  }

  const isOptionSelected = (questionKey: keyof StylePreferences, optionId: string): boolean => {
    const selected = selections[questionKey] as string[] || []
    return selected.includes(optionId)
  }

  const handleSubmit = async () => {
    toast.success("Style preferences saved!")
    onComplete(selections)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Your Style Profile</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Help us understand your fashion preferences to provide personalized recommendations.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Section {currentSection + 1} of {QUIZ_SECTIONS.length}</span>
          <span>{QUIZ_SECTIONS[currentSection].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="space-y-8"
        >
          {QUIZ_SECTIONS[currentSection].questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
                <CardDescription>{question.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`
                        p-4 rounded-md border-2 cursor-pointer transition-all
                        ${
                          isOptionSelected(question.key, option.label)
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }
                      `}
                      onClick={() => toggleOption(question.key, option.label, question.multiSelect)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {isOptionSelected(question.key, option.label) && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
        <Button variant="ghost" onClick={handleSkip}>
          Skip for now
        </Button>
        <Button onClick={handleNext}>
          {currentSection < QUIZ_SECTIONS.length - 1 ? "Next" : "Complete"}
        </Button>
      </div>
    </div>
  )
}
