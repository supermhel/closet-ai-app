"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useProfile } from "@/contexts/profile-context"
import { useCloset } from "@/contexts/closet-context"
import { useOutfit } from "@/contexts/outfit-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Activity,
  MapPin,
  Plus,
  ArrowRight,
  Heart,
  Shirt,
  Box,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Layers,
  Calendar,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { getUserAnalytics } from "@/lib/services/analyticsService"

// Lazy load heavy analytics component
const AnalyticsCharts = lazy(() => import("@/components/dashboard/analytics-charts").then(module => ({ default: module.AnalyticsCharts })))
import { WeatherWidget } from "@/components/dashboard/weather-widget"

// Color theme interface
interface ThemeColors {
  blue: string
  green: string
  purple: string
  orange: string
  pink: string
}

// Dashboard item interface
interface DashboardItem {
  title: string
  value: string | number
  icon: React.ReactNode
  color: keyof ThemeColors
}

// KPI Card Interface
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: keyof ThemeColors;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
}

// Enhanced KPI Card Component
function KPICard({ title, value, icon, color = "blue" }: KPICardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold">{value}</p>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color]} text-white`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Welcome Card
function WelcomeCard() {
  const { profile } = useProfile()
  const currentHour = new Date().getHours()

  let greeting = "Welcome"
  if (currentHour < 12) greeting = "Good morning"
  else if (currentHour < 18) greeting = "Good afternoon"
  else greeting = "Good evening"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={profile?.photoURL || "/placeholder.svg?height=64&width=64"}
                  alt="Profile"
                  className="h-16 w-16 rounded-full ring-2 ring-primary/20 ring-offset-2"
                />
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {greeting}, {profile?.displayName?.split(" ")[0] || "there"}!
                  </h1>
                  <p className="text-muted-foreground">Ready to create amazing outfits today?</p>
                  {profile?.location && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location.city}, {profile.location.country}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 min-w-[200px] w-full lg:w-auto">
              <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
                <Link href="/outfit">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan Today's Outfit
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/virtual-closet">
                  <Layers className="h-4 w-4 mr-2" />
                  Virtual Closet
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Quick Navigation Component
function QuickNavigation() {
  const navItems = [
    {
      title: "My Closet",
      description: "Manage your wardrobe",
      href: "/items",
      icon: <Box className="h-6 w-6" />,
      color: "bg-blue-500",
    },
    {
      title: "Outfit Planner",
      description: "Create new outfits",
      href: "/outfit",
      icon: <Shirt className="h-6 w-6" />,
      color: "bg-purple-500",
    },
    {
      title: "Virtual Closet",
      description: "3D visualization",
      href: "/virtual-closet",
      icon: <Layers className="h-6 w-6" />,
      color: "bg-green-500",
    },
    {
      title: "Style Profile",
      description: "Your preferences",
      href: "/profile",
      icon: <Heart className="h-6 w-6" />,
      color: "bg-pink-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {navItems.map((item) => (
        <Link key={item.title} href={item.href} className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${item.color} p-3 rounded-lg text-white`}>{item.icon}</div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// Activity and Goals Panel
function ActivityPanel() {
  const { closetItems } = useCloset()
  const { outfits } = useOutfit()

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Activity & Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">Build Your Closet</span>
            </div>
            <span className="text-sm font-medium">{closetItems.length}/50 items</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min((closetItems.length / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-purple-500" />
              <span className="text-sm font-medium">Create Outfits</span>
            </div>
            <span className="text-sm font-medium">{outfits.length}/10 outfits</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${Math.min((outfits.length / 10) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/items">
              <Plus className="h-4 w-4 mr-2" />
              Add New Items
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Weather and Outfit Recommendations
function WeatherAndOutfitRecommendations() {
  return <WeatherWidget />
}

// Today's Outfit Suggestions
function OutfitSuggestions() {
  const { outfits } = useOutfit()
  const { closetItems } = useCloset()

  // Get the most recent outfits
  const recentOutfits = outfits.slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Shirt className="h-5 w-5 mr-2" />
          Today's Outfit Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentOutfits.length > 0 ? (
          <div className="space-y-4">
            {recentOutfits.map((outfit) => (
              <div key={outfit.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                  <Shirt className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{outfit.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {outfit.occasion || "Casual"} • {outfit.items?.length || 0} items
                  </p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/outfit/${outfit.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/outfit">
                <Plus className="h-4 w-4 mr-2" />
                Create New Outfit
              </Link>
            </Button>
          </div>
        ) : closetItems.length > 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No outfits created yet</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/outfit">Create Your First Outfit</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Add items to your closet first</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/items">Add Items to Closet</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Recent Items and Closet Updates
function RecentItems() {
  const { closetItems } = useCloset()

  // Get the most recent items
  const recentItems = [...closetItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Box className="h-5 w-5 mr-2" />
          Recent Items & Closet Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length > 0 ? (
          <div className="space-y-4">
            {recentItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    <Box className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.category} • Added {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/items/${item.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/items">
                <ArrowRight className="h-4 w-4 mr-2" />
                View All Items
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No items in your closet yet</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/items">Add Your First Item</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Upcoming Events and Planning
function UpcomingEvents() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Upcoming Events & Planning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-muted-foreground">No upcoming events</p>
          <Button variant="outline" size="sm" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const { closetItems, loading: closetLoading } = useCloset()
  const { outfits, favoriteOutfits, loading: outfitLoading } = useOutfit()

  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const isLoading = profileLoading || closetLoading || outfitLoading

  useEffect(() => {
    if (!user) return

    const loadAnalytics = async () => {
      setAnalyticsLoading(true)
      try {
        const analyticsData = await getUserAnalytics(user.uid)
        setAnalytics(analyticsData)
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setAnalyticsLoading(false)
      }
    }

    loadAnalytics()
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
        {/* First Fold - Essential Information */}
        <WelcomeCard />

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Closet Items" value={closetItems.length} icon={<Box className="h-5 w-5" />} color="blue" />
          <KPICard title="Outfits Created" value={outfits.length} icon={<Shirt className="h-5 w-5" />} color="purple" />
          <KPICard
            title="Favorite Outfits"
            value={favoriteOutfits.length}
            icon={<Heart className="h-5 w-5" />}
            color="pink"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
          <QuickNavigation />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityPanel />
          <WeatherAndOutfitRecommendations />
        </motion.div>

        {/* Lazily Loaded Insights - Accordion */}
        <motion.div variants={itemVariants}>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="insights">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Detailed Insights
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <OutfitSuggestions />
                  <RecentItems />
                  <div className="md:col-span-2">
                    <UpcomingEvents />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="analytics">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Advanced Analytics
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : analytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <AnalyticsCharts
                      closetItems={closetItems}
                      outfits={outfits}
                      analytics={analytics}
                      className="md:col-span-2"
                    />
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No analytics data available yet</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div variants={itemVariants}>
          <AnalyticsCharts
            closetItems={closetItems}
            outfits={outfits}
            userActivity={[]} // You can fetch this from a separate service
            className="mt-6"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
