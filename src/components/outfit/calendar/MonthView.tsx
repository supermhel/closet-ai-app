"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MonthViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  scheduledOutfits: any[]
}

export default function MonthView({ selectedDate, onDateSelect, scheduledOutfits }: MonthViewProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  const days = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    days.push(day)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg">
            {currentMonth.toLocaleDateString("default", { month: "long", year: "numeric" })}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="font-medium text-sm p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSameMonth = day.getMonth() === currentMonth.getMonth()
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = day.toDateString() === selectedDate.toDateString()
            const hasOutfit = scheduledOutfits.some((outfit) => {
              const outfitDate = new Date(outfit.date)
              return outfitDate.toDateString() === day.toDateString()
            })

            return (
              <motion.div
                key={index}
                whileHover={isSameMonth ? { scale: 1.05 } : {}}
                className={`p-2 h-12 rounded-lg flex flex-col items-center justify-center text-sm ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-primary/20 text-primary"
                      : isSameMonth
                        ? "bg-muted hover:bg-muted/80 cursor-pointer"
                        : "text-muted-foreground"
                }`}
                onClick={() => isSameMonth && onDateSelect(day)}
              >
                <div>{day.getDate()}</div>
                {hasOutfit && isSameMonth && <div className="text-xs">👚</div>}
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
