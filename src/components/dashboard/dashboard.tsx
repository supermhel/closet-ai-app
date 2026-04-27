"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import Link from "next/link"

import {
  Users,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
  Bell,
  Search,
  LogOut,
  User,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Zap,
  Star,
} from "lucide-react"

import { useDashboardData } from "@/hooks/use-dashboard"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface WeatherData {
  location: {
    name: string
    country: string
  }
  current: {
    condition: {
      text: string
    }
    temp_c: number
    humidity: number
    wind_kph: number
  }
}

// Weather component
interface WeatherWidgetProps {
  data: WeatherData | null
}

function WeatherWidget({ data }: WeatherWidgetProps) {
  const [loading, setLoading] = useState(false)

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("Sunny") || condition.includes("Clear")) {
      return <Sun className="h-8 w-8 text-yellow-500" />
    } else if (condition.includes("Rain")) {
      return <CloudRain className="h-8 w-8 text-blue-500" />
    } else {
      return <Cloud className="h-8 w-8 text-gray-500" />
    }
  }

  if (!data) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{data.location.name}, {data.location.country}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLoading(!loading)}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getWeatherIcon(data.current.condition.text)}
            <div>
              <p className="text-2xl font-bold">{data.current.temp_c}°C</p>
              <p className="text-sm text-muted-foreground">{data.current.condition.text}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <Droplets className="h-3 w-3" />
              <span>{data.current.humidity}%</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Wind className="h-3 w-3" />
              <span>{data.current.wind_kph} km/h</span>
            </div>
          </div>
        </div>
        <Alert className="mt-4">
          <Zap className="h-4 w-4" />
          <AlertDescription>Perfect weather for outdoor activities! Consider light layers.</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// Recent Activity Component
interface Activity {
  id: number
  type: "outfit" | "item" | "rating"
  description: string
  time: string
}

function RecentActivity() {
  const activities: Activity[] = [
    {
      id: 1,
      type: "outfit",
      description: "Created new outfit: Casual Friday",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "item",
      description: "Added new item: Blue Denim Jeans",
      time: "1 day ago",
    },
    {
      id: 3,
      type: "rating",
      description: "Rated outfit: Business Casual",
      time: "3 days ago",
    },
  ]

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "outfit":
        return "bg-blue-500"
      case "item":
        return "bg-green-500"
      case "rating":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "outfit":
        return <BarChart3 className="h-4 w-4" />
      case "item":
        return <User className="h-4 w-4" />
      case "rating":
        return <Star className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4" asChild>
          <Link href="/activity">
            View All Activity
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


export function Dashboard() {
  const { user, userProfile, signOut } = useAuth()
  const { weather, analytics, recentOutfits, isLoading } = useDashboardData()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FirebaseApp</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback>{userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{userProfile?.displayName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold mb-2">
                    {getGreeting()}, {userProfile?.displayName || "there"}!
                  </h1>
                  <p className="text-muted-foreground text-lg mb-4">
                    Welcome back to your dashboard. Here&apos;s what&apos;s happening today.
                  </p>
                  {userProfile?.location && (
                    <div className="flex items-center justify-center md:justify-start text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {userProfile.location.city}, {userProfile.location.country}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="text-2xl">
                      {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.usageStatistics?.totalItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{analytics?.usageStatistics?.itemsAddedThisMonth || 0}</span> items added this month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outfits Created</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.usageStatistics?.totalOutfits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{analytics?.usageStatistics?.outfitsThisMonth || 0}</span> outfits created this month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.usageStatistics?.averageRating || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{analytics?.usageStatistics?.averageRating || 0}</span> average rating
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Worn Category</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{analytics?.wearFrequency?.[0]?.wearCount || 0}</span> wears this month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Weather Widget */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <WeatherWidget data={weather} />
          </motion.div>

          {/* Recent Outfits */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Outfits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOutfits?.map((outfit) => (
                    <div key={outfit.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{outfit.name}</p>
                        <p className="text-sm text-muted-foreground">{outfit.createdAt.toDate().toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{outfit.rating}%</span>
                        <Zap className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <RecentActivity />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
