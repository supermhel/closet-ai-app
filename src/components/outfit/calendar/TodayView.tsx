"use client"
import { motion } from "framer-motion"
import {
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  Wind,
  Umbrella,
  ThermometerSun,
  ThermometerSnowflake,
  Calendar,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface TodayViewProps {
  selectedDate: Date
  weather: any
}

export default function TodayView({ selectedDate, weather }: TodayViewProps) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const getWeatherIcon = () => {
    if (!weather?.current?.condition?.text) return <CloudSun size={24} className="text-primary" />

    const condition = weather.current.condition.text.toLowerCase()
    const temp = weather.current.temp_c

    if (condition.includes("rain") || condition.includes("drizzle")) {
      return <CloudRain size={24} className="text-blue-500" />
    } else if (condition.includes("snow")) {
      return <Snowflake size={24} className="text-blue-300" />
    } else if (condition.includes("sun") || condition.includes("clear")) {
      return <Sun size={24} className="text-yellow-400" />
    } else if (condition.includes("wind")) {
      return <Wind size={24} className="text-gray-400" />
    } else if (condition.includes("thunder") || condition.includes("storm")) {
      return <Umbrella size={24} className="text-purple-500" />
    } else if (temp > 25) {
      return <ThermometerSun size={24} className="text-orange-500" />
    } else if (temp < 5) {
      return <ThermometerSnowflake size={24} className="text-blue-400" />
    } else {
      return <CloudSun size={24} className="text-primary" />
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="relative" variants={containerVariants} initial="hidden" animate="visible">
      <Card className="bg-background/90 backdrop-blur-md shadow-md border overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />

        <CardContent className="p-5">
          {/* Header with date and weather */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar size={20} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Today: {formattedDate}
              </h3>
            </div>

            {weather && (
              <motion.div
                className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm py-1.5 px-3 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
              >
                {weather.current.condition?.icon ? (
                  <img
                    src={weather.current.condition.icon || "/placeholder.svg"}
                    alt={weather.current.condition.text}
                    className="w-8 h-8"
                  />
                ) : (
                  getWeatherIcon()
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">{Math.round(weather.current.temp_c)}°C</span>
                  <span className="text-xs text-muted-foreground leading-tight">{weather.current.condition.text}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Weather suggestion alert */}
          {weather && (
            <motion.div variants={itemVariants}>
              <Alert
                className={cn(
                  "rounded-xl p-4 mb-4 border shadow-sm",
                  weather.current.temp_c < 10
                    ? "bg-blue-500/10 border-blue-500/20"
                    : weather.current.temp_c < 20
                      ? "bg-primary/10 border-primary/20"
                      : "bg-orange-500/10 border-orange-500/20",
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {weather.current.temp_c < 10 ? (
                      <ThermometerSnowflake className="h-10 w-10 text-blue-500" />
                    ) : weather.current.temp_c < 20 ? (
                      <CloudSun className="h-10 w-10 text-primary" />
                    ) : (
                      <ThermometerSun className="h-10 w-10 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <AlertDescription className="font-bold mb-1">
                      {weather.current.temp_c < 10
                        ? "It's cold today - add a coat to your outfit."
                        : weather.current.temp_c < 20
                          ? "Mild weather today - light jacket recommended."
                          : "It's warm today - no need for heavy jackets!"}
                    </AlertDescription>
                    <motion.div
                      className="text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span className="font-medium">Extra tip: </span>
                      {weather.current.condition.text.toLowerCase().includes("rain")
                        ? "Don't forget your umbrella and waterproof shoes!"
                        : weather.current.condition.text.toLowerCase().includes("snow")
                          ? "Wear insulated boots and bring gloves."
                          : weather.current.condition.text.toLowerCase().includes("wind")
                            ? "Consider a windbreaker or scarf today."
                            : "Dress in layers to adjust throughout the day."}
                    </motion.div>

                    {weather.location?.name && (
                      <motion.div
                        className="mt-2 text-xs flex items-center gap-1.5 bg-background/50 backdrop-blur-sm py-1 px-2 rounded-md w-fit"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>
                          Location: {weather.location.name}, {weather.location.country}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
