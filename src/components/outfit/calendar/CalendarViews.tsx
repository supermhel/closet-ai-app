"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import WeekView from "./WeekView"
import MonthView from "./MonthView"
import TodayView from "./TodayView"

interface CalendarViewsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedDate: Date
  onDateSelect: (date: Date) => void
  scheduledOutfits: any[]
  weather: any
}

export default function CalendarViews({
  activeTab,
  onTabChange,
  selectedDate,
  onDateSelect,
  scheduledOutfits,
  weather,
}: CalendarViewsProps) {
  return (
    <>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "week", label: "Week" },
          { key: "month", label: "Month" },
          { key: "today", label: "Today" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Calendar Views */}
      <AnimatePresence mode="wait">
        {activeTab === "week" && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WeekView selectedDate={selectedDate} onDateSelect={onDateSelect} scheduledOutfits={scheduledOutfits} />
          </motion.div>
        )}

        {activeTab === "month" && (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MonthView selectedDate={selectedDate} onDateSelect={onDateSelect} scheduledOutfits={scheduledOutfits} />
          </motion.div>
        )}

        {activeTab === "today" && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TodayView selectedDate={selectedDate} weather={weather} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
