"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

interface WeekViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  scheduledOutfits: any[]
}

export default function WeekView({ selectedDate, onDateSelect, scheduledOutfits }: WeekViewProps) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2 text-center mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="font-medium text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => {
            const day = new Date(startOfWeek)
            day.setDate(startOfWeek.getDate() + index)
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = day.toDateString() === selectedDate.toDateString()
            const hasOutfit = scheduledOutfits.some((outfit) => {
              const outfitDate = new Date(outfit.date)
              return outfitDate.toDateString() === day.toDateString()
            })

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[80px] ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-primary/20 text-primary"
                      : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-sm font-medium">{day.getDate()}</div>
                {hasOutfit && <div className="text-lg mt-1">👚</div>}
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
